import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

let cachedTransport = null;

const canSendMail = () =>
  Boolean(env.mail.host && env.mail.port && env.mail.user && env.mail.pass && env.mail.from);

export const getMailer = () => {
  if (!canSendMail()) return null;
  if (cachedTransport) return cachedTransport;

  cachedTransport = nodemailer.createTransport({
    host: env.mail.host,
    port: env.mail.port,
    secure: env.mail.secure,
    auth: {
      user: env.mail.user,
      pass: env.mail.pass,
    },
  });

  return cachedTransport;
};

export const sendMail = async ({ to, subject, html, text }) => {
  const transport = getMailer();
  if (!transport) return { skipped: true };

  await transport.sendMail({
    from: env.mail.from,
    to,
    subject,
    text,
    html,
  });

  return { skipped: false };
};

