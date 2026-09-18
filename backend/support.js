const { sendMail, mailConfigured } = require('./mail');

function registerSupport(app, limiter, store) {
  app.post('/api/support', limiter, async (req, res) => {
    const fields = {};
    for (const key of ['name', 'email', 'subject', 'message']) {
      fields[key] = typeof req.body?.[key] === 'string' ? req.body[key].trim() : '';
    }
    const { name, email, subject, message } = fields;
    if (name.length < 2 || name.length > 100 || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || subject.length < 3 || subject.length > 150 || /[\r\n]/.test(subject + name + email) || message.length < 10 || message.length > 5000) {
      return res.status(400).json({ message: 'Enter your name, a valid email, a subject, and an issue description of 10–5000 characters.' });
    }
    if (store) {
      const id = require('node:crypto').randomUUID();
      await store().transaction(tx => tx.put('supportRequests', id, {id, ...fields, status:'new', createdAt:Date.now(), updatedAt:Date.now()}));
      // Persisted requests remain visible to the team even if notification delivery fails.
    }
    const env = process.env;
    if (!env.SALES_EMAIL || !mailConfigured()) {
      return store ? res.json({success:true}) : res.status(503).json({ message: 'Support messaging is temporarily unavailable. Please try again later.' });
    }
    try {
      await sendMail({
        to: env.SALES_EMAIL, replyTo: email,
        subject: 'LoomIQ Support: ' + subject,
        text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
      });
      return res.json({ success: true });
    } catch {
      return store ? res.json({success:true}) : res.status(502).json({ message: 'Your message could not be sent. Please try again shortly.' });
    }
  });
}
module.exports = { registerSupport };
