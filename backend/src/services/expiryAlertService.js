import { Batch } from '../models/Batch.js';
import { ExpiryAlertNotification } from '../models/ExpiryAlertNotification.js';
import { User } from '../models/User.js';
import { env } from '../config/env.js';
import { sendMail } from '../utils/mailer.js';
import { logger } from '../utils/logger.js';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
let schedulerHandle = null;
let isRunning = false;

const startOfToday = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

const dateKey = (date) => date.toISOString().slice(0, 10);

const buildMailContent = ({ organizationName, nearExpiryDays, batches }) => {
  const rowsHtml = batches
    .map((batch) => {
      const expiryDate = new Date(batch.expiryDate).toLocaleDateString('en-GB');
      const medicineName = batch.medicine?.name || 'Unknown medicine';
      const genericName = batch.medicine?.genericName ? ` (${batch.medicine.genericName})` : '';
      return `<tr>
        <td style="padding:8px;border:1px solid #ddd">${medicineName}${genericName}</td>
        <td style="padding:8px;border:1px solid #ddd">${batch.batchNo}</td>
        <td style="padding:8px;border:1px solid #ddd">${batch.quantity}</td>
        <td style="padding:8px;border:1px solid #ddd">${expiryDate}</td>
      </tr>`;
    })
    .join('');

  const textLines = batches
    .map((batch) => {
      const expiryDate = new Date(batch.expiryDate).toLocaleDateString('en-GB');
      const medicineName = batch.medicine?.name || 'Unknown medicine';
      return `- ${medicineName} | Batch: ${batch.batchNo} | Qty: ${batch.quantity} | Expiry: ${expiryDate}`;
    })
    .join('\n');

  const text = [
    `Near-expiry medicine alert for ${organizationName}.`,
    `The following medicines will expire within ${nearExpiryDays} days:`,
    '',
    textLines,
  ].join('\n');

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:760px;margin:auto">
      <h2 style="margin-bottom:6px">Near-expiry medicine alert</h2>
      <p style="margin-top:0;color:#444">Organization: <strong>${organizationName}</strong></p>
      <p style="color:#444">The following medicines will expire within <strong>${nearExpiryDays} days</strong>.</p>
      <table style="border-collapse:collapse;width:100%;font-size:14px">
        <thead>
          <tr>
            <th style="padding:8px;border:1px solid #ddd;text-align:left">Medicine</th>
            <th style="padding:8px;border:1px solid #ddd;text-align:left">Batch</th>
            <th style="padding:8px;border:1px solid #ddd;text-align:left">Quantity</th>
            <th style="padding:8px;border:1px solid #ddd;text-align:left">Expiry</th>
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    </div>
  `;

  return { text, html };
};

const sendOrganizationAlert = async ({ organizationId, organizationName, batches, alertDate, nearExpiryDays }) => {
  const users = await User.find({
    organization: organizationId,
    status: 'active',
    role: { $in: ['Owner', 'Admin'] },
  })
    .select('email')
    .lean();

  const recipientEmails = [...new Set(users.map((u) => u.email).filter(Boolean))];

  if (recipientEmails.length === 0) {
    logger.warn('Skipping expiry alert email: no active owner/admin recipients', {
      organizationId: organizationId.toString(),
    });
    return;
  }

  const alreadyNotified = await ExpiryAlertNotification.findOne({
    organization: organizationId,
    alertDate,
  }).lean();

  if (alreadyNotified) return;

  const { text, html } = buildMailContent({ organizationName, nearExpiryDays, batches });

  const mailResult = await sendMail({
    to: recipientEmails.join(','),
    subject: `Invenzaa: ${batches.length} medicine batch(es) near expiry`,
    text,
    html,
  });

  if (mailResult?.skipped) {
    logger.warn('Expiry alert email skipped: mail configuration missing');
    return;
  }

  await ExpiryAlertNotification.create({
    organization: organizationId,
    alertDate,
    recipientEmails,
    batchCount: batches.length,
  });

  logger.info('Near-expiry alert email sent', {
    organizationId: organizationId.toString(),
    recipients: recipientEmails.length,
    batches: batches.length,
  });
};

export const runNearExpiryAlertScan = async () => {
  if (isRunning) return;
  isRunning = true;

  try {
    const nearExpiryDays = Math.max(1, env.nearExpiryDays || 30);
    const today = startOfToday();
    const threshold = new Date(today.getTime() + nearExpiryDays * ONE_DAY_MS);
    const alertDate = dateKey(today);

    const batches = await Batch.find({
      expiryDate: { $gte: today, $lte: threshold },
      quantity: { $gt: 0 },
    })
      .populate('medicine', 'name genericName')
      .populate('organization', 'name')
      .sort({ organization: 1, expiryDate: 1 })
      .lean();

    if (batches.length === 0) {
      logger.debug('Near-expiry scan complete: no batches found');
      return;
    }

    const grouped = new Map();
    for (const batch of batches) {
      const organizationId = batch.organization?._id?.toString?.() || batch.organization?.toString?.();
      if (!organizationId) continue;

      if (!grouped.has(organizationId)) {
        grouped.set(organizationId, {
          organizationId,
          organizationName: batch.organization?.name || 'Organization',
          batches: [],
        });
      }

      grouped.get(organizationId).batches.push(batch);
    }

    for (const group of grouped.values()) {
      await sendOrganizationAlert({
        organizationId: group.organizationId,
        organizationName: group.organizationName,
        batches: group.batches,
        alertDate,
        nearExpiryDays,
      });
    }
  } catch (error) {
    logger.error('Near-expiry scan failed', {
      error: error?.message,
    });
  } finally {
    isRunning = false;
  }
};

export const startNearExpiryAlertScheduler = () => {
  if (schedulerHandle) return;

  const startupDelay = Math.max(0, env.expiryAlertStartupDelayMs || 0);
  const intervalMs = Math.max(60 * 1000, env.expiryAlertIntervalMs || ONE_DAY_MS);

  setTimeout(() => {
    runNearExpiryAlertScan();
  }, startupDelay);

  schedulerHandle = setInterval(() => {
    runNearExpiryAlertScan();
  }, intervalMs);

  logger.info('Near-expiry alert scheduler started', {
    nearExpiryDays: env.nearExpiryDays,
    startupDelayMs: startupDelay,
    intervalMs,
  });
};
