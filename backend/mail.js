const nodemailer = require('nodemailer');

const mailProvider = (env = process.env) => env.MAIL_PROVIDER || (env.RESEND_API_KEY ? 'resend' : 'smtp');
function mailConfigured(env = process.env) {
  if (mailProvider(env) === 'resend') return Boolean(env.RESEND_API_KEY?.trim() && env.EMAIL_FROM?.trim());
  if (mailProvider(env) !== 'smtp') return false;
  return Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS && (env.EMAIL_FROM || env.SMTP_USER));
}
async function sendViaResend(message, env) {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST', redirect: 'error', signal: AbortSignal.timeout(15000),
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: env.EMAIL_FROM, to: Array.isArray(message.to) ? message.to : [message.to],
        subject: message.subject, text: message.text, html: message.html,
        ...(message.replyTo ? { reply_to: message.replyTo } : {}),
        ...(message.attachments ? { attachments: message.attachments.map(attachment => ({
          filename: attachment.filename,
          content: Buffer.isBuffer(attachment.content) ? attachment.content.toString('base64') : Buffer.from(attachment.content, attachment.encoding || 'utf8').toString('base64'),
          ...(attachment.contentType ? { content_type: attachment.contentType } : {}),
        })) } : {}),
      }),
    });
    const body = await response.json().catch(() => null);
    if (!response.ok || typeof body?.id !== 'string' || !body.id) {
      // Provider bodies may contain email addresses or message content.
      console.error('Resend delivery failed:', { status: response.status });
      throw new Error('Provider rejected email');
    }
  } catch (error) {
    console.error('HTTPS email delivery failed:', { timeout: error.name === 'TimeoutError' });
    throw Object.assign(new Error('Email could not be sent. Please try again shortly.'), { status: 502 });
  }
}
async function sendMail(message) {
  if (!mailConfigured()) throw Object.assign(new Error('Email is temporarily unavailable. Please contact support.'), { status: 503 });
  const env = process.env;
  if (mailProvider(env) === 'resend') return sendViaResend(message, env);
  const transport = nodemailer.createTransport({
    host: env.SMTP_HOST, port: Number(env.SMTP_PORT || 587), secure: env.SMTP_SECURE === 'true',
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
    connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 20000,
  });
  try {
    const result = await transport.sendMail({ from: env.EMAIL_FROM || env.SMTP_USER, ...message });
    if (!result.accepted?.length) throw new Error('Email was not accepted');
  } catch (error) {
    console.error('SMTP delivery failed:', {
      code: error.code,
      command: error.command,
      responseCode: error.responseCode,
      response: error.response,
      message: error.message,
    });
    throw Object.assign(new Error('Email could not be sent. Please try again shortly.'), { status: 502 });
  } finally { transport.close(); }
}
module.exports = { sendMail, mailConfigured, mailProvider };
