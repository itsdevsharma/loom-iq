const nodemailer = require('nodemailer');

function mailConfigured(env = process.env) {
  return Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS && (env.EMAIL_FROM || env.SMTP_USER));
}
async function sendMail(message) {
  if (!mailConfigured()) throw Object.assign(new Error('Email is temporarily unavailable. Please contact support.'), { status: 503 });
  const env = process.env;
  const transport = nodemailer.createTransport({
    host: env.SMTP_HOST, port: Number(env.SMTP_PORT || 587), secure: env.SMTP_SECURE === 'true',
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 20000,
  });
  try {
    const result = await transport.sendMail({ from: env.EMAIL_FROM || env.SMTP_USER, ...message });
    if (!result.accepted?.length) throw new Error('Email was not accepted');
  } catch {
    throw Object.assign(new Error('Email could not be sent. Please try again shortly.'), { status: 502 });
  } finally { transport.close(); }
}
module.exports = { sendMail, mailConfigured };
