import { PurchaseInvoice } from '../models/PurchaseInvoice.js';

export const getNextPurchaseInvoiceNumber = async (orgId, session) => {
  let query = PurchaseInvoice.findOne({ organization: orgId })
    .sort({ invoiceNumber: -1 })
    .select('invoiceNumber');
  if (session) query = query.session(session);
  const last = await query.lean();

  const prefix = 'PINV';
  const year = new Date().getFullYear();
  // `invoiceNumber` is globally `unique`, so include `orgId` to avoid collisions across orgs.
  const base = `${prefix}-${year}-${orgId}-`;

  if (!last?.invoiceNumber?.startsWith(base)) {
    return `${base}0001`;
  }

  const num = parseInt(last.invoiceNumber.replace(base, ''), 10) || 0;
  return `${base}${String(num + 1).padStart(4, '0')}`;
};

export const createPurchaseInvoice = async (purchase, orgId, session) => {
  const invoiceNumber = await getNextPurchaseInvoiceNumber(orgId, session);

  const items = purchase.items.map((item) => ({
    medicine: item.medicine?._id ?? item.medicine,
    medicineName: item.medicine?.name ?? 'Unknown',
    batchNo: item.batch?.batchNo ?? 'N/A',
    quantity: item.quantity,
    unitCost: item.unitCost,
    total: item.quantity * item.unitCost,
  }));

  const opts = session ? { session } : {};
  const created = await PurchaseInvoice.create(
    [
      {
        invoiceNumber,
        purchase: purchase._id,
        organization: orgId,
        supplierName: purchase.supplierName ?? '',
        items,
        totalCost: purchase.totalCost,
        invoiceDate: purchase.purchaseDate ?? new Date(),
      },
    ],
    opts
  );

  return created[0] || created;
};
