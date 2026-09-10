const nodemailer = require('nodemailer');

function registerSupport(app, limiter) {
  app.post('/api/support', limiter, async (req, res) => {
    const fields = {};
    for (const key of ['name', 'email', 'subject', 'message']) {
      fields[key] = typeof req.body?.[key] === 'string' ? req.body[key].trim() : '';
    }
    const { name, email, subject, message } = fields;
    if (name.length < 2 || name.length > 100 || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || subject.length < 3 || subject.length > 150 || /[\r\n]/.test(subject + name + email) || message.length < 10 || message.length > 5000) {
      return res.status(400).json({ message: 'Enter your name, a valid email, a subject, and an issue description of 10–5000 characters.' });
    }
    const env = process.env;
    if (!env.SALES_EMAIL || !env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
      return res.status(503).json({ message: 'Support messaging is temporarily unavailable. Please try again later.' });
    }
    try {
      const transport = nodemailer.createTransport({
        host: env.SMTP_HOST, port: Number(env.SMTP_PORT || 587), secure: env.SMTP_SECURE === 'true',
        auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
        connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 20000,
      });
      const result = await transport.sendMail({
        from: env.EMAIL_FROM || env.SMTP_USER, to: env.SALES_EMAIL, replyTo: email,
        subject: 'LoomIQ Support: ' + subject,
        text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
      });
      if (!result.accepted?.length) throw new Error('Email was not accepted');
      return res.json({ success: true });
    } catch {
      return res.status(502).json({ message: 'Your message could not be sent. Please try again shortly.' });
    }
  });
}
module.exports = { registerSupport };
