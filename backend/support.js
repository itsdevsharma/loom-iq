const { sendMail, mailConfigured } = require('./mail');

const consultationServices = new Set(['Digital Marketing', 'Meta Ads Management', 'Google Ads Management', 'SEO Services', 'Social Media Marketing', 'Performance Marketing', 'Lead Generation', 'Website Audit', 'Help me decide']);

function registerSupport(app, limiter, store) {
  // Keep phone-based sales enquiries in the existing admin inbox, separately
  // typed from email-based support. Never invent an email for a sales lead.
  app.post('/api/consultations', limiter, async (req, res) => {
    if (req.body?.website) return res.status(400).json({ message: 'Unable to accept this request. Please call our team instead.' });
    const clean = key => typeof req.body?.[key] === 'string' ? req.body[key].trim() : '';
    const name = clean('name'), phone = clean('phone'), service = clean('service'), business = clean('business');
    const digits = phone.replace(/\D/g, '');
    if (name.length < 2 || name.length > 100 || /[\r\n]/.test(name) || phone.length > 30 || !/^[+\d\s().-]+$/.test(phone) || digits.length < 7 || digits.length > 15 || !consultationServices.has(service) || business.length > 200) {
      return res.status(400).json({ message: 'Enter your full name, a valid phone number with 7–15 digits, and a service.' });
    }
    if (!store) return res.status(503).json({ message: 'Enquiries are temporarily unavailable. Please call +91 82220 88524.' });
    const source = clean('sourcePage');
    const sourcePage = /^\/[a-zA-Z0-9/_-]*$/.test(source) ? source.slice(0, 200) : '/';
    const attribution = {};
    for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']) {
      const value = req.body?.attribution?.[key];
      if (typeof value === 'string' && value.trim()) attribution[key] = value.trim().slice(0, 200);
    }
    const id = require('node:crypto').randomUUID();
    const subject = service + ' consultation';
    const message = `Phone: ${phone}\nBusiness: ${business || 'Not provided'}\nService: ${service}\nSource page: ${sourcePage}`;
    const record = { id, kind: 'consultation', name, phone, email: '', service, business, subject, message, sourcePage, attribution, status: 'new', createdAt: Date.now(), updatedAt: Date.now() };
    try { await store().transaction(tx => tx.put('supportRequests', id, record)); }
    catch { return res.status(503).json({ message: 'Your enquiry could not be saved. Please try again or call +91 82220 88524.' }); }
    if (process.env.SALES_EMAIL && mailConfigured()) {
      try { await sendMail({ to: process.env.SALES_EMAIL, subject: 'LoomIQ Consultation: ' + service, text: `Name: ${name}\n${message}` }); }
      catch { /* The saved enquiry remains available in the admin inbox. */ }
    }
    return res.status(201).json({ success: true });
  });
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
