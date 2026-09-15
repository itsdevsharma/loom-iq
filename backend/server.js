const express = require("express");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");
const Razorpay = require("razorpay");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");
const nodemailer = require("nodemailer");
const path = require("path");

dotenv.config({ path: path.join(__dirname, '.env'), quiet: true });

const app = express();
const port = Number(process.env.PORT || 3001);
const maxRequestsPerWindow = 5;
const rateLimitWindowMs = 15 * 60 * 1000;
const requestLog = new Map();
const { createInvoice, invoiceSeller } = require("./invoice");
const { renderInvoicePdf } = require("./invoice-pdf");
const { equal } = require("./early-bird");
const { fileRepository, initializeMongo } = require("./repository");
const { keyFor, fail, eligibility, profile, enroll } = require("./account-service");
const { sendMail, mailConfigured } = require('./mail');
const erpIntegration = require('./erp-integration');
const offerDbPath = process.env.OFFER_DB_PATH || path.join(__dirname, "data", "offers.json");
const demoDbPath = path.join(__dirname, "data", "demo-requests.json");
let repository = fileRepository(offerDbPath, demoDbPath);
function createAuditLogger(store) {
  return async (entry, tx) => {
    const doc = { ...entry, createdAt: Date.now() };
    if (tx) {
      try {
        const id = crypto.randomBytes(8).toString('hex');
        await tx.put('audit_logs', id, doc);
      } catch (e) {
        console.error('audit log failed', e.message);
      }
    } else {
      try {
        await store().transaction(tx2 => {
          const id = crypto.randomBytes(8).toString('hex');
          return tx2.put('audit_logs', id, doc);
        });
      } catch (e) {
        console.error('audit log failed', e.message);
      }
    }
  };
}
function visitorId(req) { return /(?:^|; )loomiq_visitor=([a-f0-9]{64})(?:;|$)/.exec(req.headers.cookie || "")?.[1]; }
function visitorCookie(res, id) {
  res.cookie("loomiq_visitor", id, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 365 * 86400000, path: "/" });
}
async function setVisitor(req, res) {
  let id = visitorId(req);
  if (!id || !await repository.get("visitors", id)) {
    id = crypto.randomBytes(32).toString("hex");
    await repository.transaction(tx => tx.put("visitors", id, { startedAt: null, trialAt: null, offerStartedAt: Date.now() }));
  }
  visitorCookie(res, id);
  return id;
}
async function account(req) {
  const token = /(?:^|; )loomiq_session=([a-f0-9]{64})(?:;|$)/.exec(req.headers.cookie || "")?.[1];
  if (!token) return null;
  const session = await repository.get("sessions", keyFor(token));
  if (!session || session.expiresAt <= Date.now()) return null;
  const customer = await repository.get('customers', session.customerKey);
  return customer && (session.version || 0) === (customer.sessionVersion || 0) ? session : null;
}
async function offerStatus(req, currentVisitorId) {
  const session = await account(req);
  return repository.transaction(async tx => {
    const id = session?.visitorId || currentVisitorId || visitorId(req);
    const v = id ? await tx.get("visitors", id) : null;
    const c = session ? await tx.get("customers", session.customerKey) : null;
    if (session && !c) throw fail(401, "Please sign in again.");
    // Existing accounts join this new campaign on their first visit; never reset it.
    const start = c?.offerStartedAt ?? v?.offerStartedAt ?? Date.now();
    if (v) { v.offerStartedAt = start; await tx.put("visitors", id, v); }
    if (c) { c.offerStartedAt = start; await tx.put("customers", session.customerKey, c); }
    return { ...eligibility(v, c), signedUp: Boolean(c), ...(c ? { customer: profile(c) } : {}) };
  });
}
async function requireAccount(req, res, next) {
  if (!await account(req)) return res.status(401).json({ success: false, message: "Please sign up or sign in first." });
  next();
}

const razorpay = process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
  ? new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET, protocol: "https" })
  : null;

app.disable("x-powered-by");
if (process.env.TRUST_PROXY_HOPS) app.set('trust proxy', Number(process.env.TRUST_PROXY_HOPS));
app.use(helmet());
app.use(["/api/admin/content", "/api/admin/website"], express.json({ limit: "1mb" }));
app.use(express.json({ limit: "20kb", verify: (req, _res, buffer) => { req.rawBody = buffer; } }));
app.use(morgan("combined"));
app.use((request, response, next) => {
  const allowedOrigin = process.env.FRONTEND_ORIGIN;
  if (allowedOrigin) {
    response.setHeader("Access-Control-Allow-Origin", allowedOrigin);
    response.setHeader("Vary", "Origin");
    response.setHeader("Access-Control-Allow-Credentials", "true");
    response.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
    response.setHeader("Access-Control-Allow-Headers", "Content-Type");
  }
  if (request.method === "OPTIONS") {
    response.sendStatus(204);
    return;
  }
  next();
});

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", globalLimiter);

function getClientAddress(request) {
  return request.ip || request.socket.remoteAddress || "unknown";
}

function isRateLimited(address) {
  const now = Date.now();
  const recentRequests = (requestLog.get(address) || []).filter(
    (timestamp) => now - timestamp < rateLimitWindowMs
  );
  if (recentRequests.length >= maxRequestsPerWindow) {
    requestLog.set(address, recentRequests);
    return true;
  }
  recentRequests.push(now);
  requestLog.set(address, recentRequests);
  return false;
}

function cleanText(value) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

function validateDemoRequest(body, { requireMobile = false } = {}) {
  const name = cleanText(body.name);
  const email = cleanText(body.email).toLowerCase();
  const company = cleanText(body.company);
  const mobile = cleanText(body.mobile).replace(/[^0-9+]/g, '');
  const businessType = cleanText(body.businessType);
  const errors = {};
  if (!name) errors.name = "Name is required.";
  else if (name.length < 2 || name.length > 100) errors.name = "Name must be between 2 and 100 characters.";
  if (!email) errors.email = "Email is required.";
  else if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Enter a valid email address.";
  if (!company) errors.company = "Company is required.";
  else if (company.length < 2 || company.length > 150) errors.company = "Company must be between 2 and 150 characters.";
  if (businessType.length > 80) errors.businessType = "Business type is too long.";
  if (requireMobile && (mobile.length < 10 || mobile.length > 16)) errors.mobile = "Enter a valid mobile number.";
  return { values: { name, email, company, mobile, businessType }, errors };
}
function sendDemoNotification(demoRequest) {
  const salesEmail = process.env.SALES_EMAIL || process.env.EMAIL_API_KEY;
  if (!salesEmail) {
    console.log("Demo request received (no email configured):", demoRequest.email);
    return Promise.resolve();
  }
  let transporterOptions;
  if (process.env.SMTP_HOST) {
    transporterOptions = {
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    };
  } else {
    transporterOptions = {
      host: "smtp-relay.brevo.com",
      port: 587,
      auth: { user: process.env.EMAIL_API_KEY, pass: process.env.EMAIL_API_KEY },
    };
  }
  const transporter = nodemailer.createTransport(transporterOptions);
  return transporter
    .sendMail({
      from: process.env.EMAIL_FROM || "noreply@loomiq.com",
      to: salesEmail,
      subject: "New Demo Request: " + demoRequest.company,
      text: [
        "Name: " + demoRequest.name,
        "Email: " + demoRequest.email,
        "Company: " + demoRequest.company,
        "Business Type: " + (demoRequest.businessType || "N/A"),
        "Submitted: " + demoRequest.createdAt,
      ].join("\n"),
    })
    .catch((error) => {
      console.error("Failed to send demo notification email:", error.message);
    });
}

app.use("/api", (req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method) && req.headers.origin && req.headers.origin !== process.env.FRONTEND_ORIGIN && req.headers.origin !== `${req.protocol}://${req.get("host")}`) {
    return res.status(403).json({ success: false, message: "Origin not allowed." });
  }
  next();
});

app.post("/api/offers/visit", async (req, res) => {
  const id = await setVisitor(req, res);
  res.json(await offerStatus(req, id));
});
app.get("/api/offers/status", async (req, res) => res.json(await offerStatus(req)));

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false });
require('./account-routes').registerAccountRoutes(app, { store: () => repository, account, limiter: authLimiter });
require('./operator-routes').registerOperatorRoutes(app, () => repository);
// Register admin routes
const auditLogger = createAuditLogger(() => repository);
require('./admin-routes').registerAdminRoutes(app, { store: () => repository, addAudit: auditLogger });
require('./admin-content-routes').registerAdminContentRoutes(app, { store: () => repository, addAudit: auditLogger });
require('./content-routes').registerContentRoutes(app, { store: () => repository, PUBLIC_SITE_URL: process.env.PUBLIC_SITE_URL });
require('./website-content').registerWebsiteContentRoutes(app, {store: () => repository, addAudit: auditLogger, ...require('./admin-content-routes')});
require('./admin-records').registerAdminRecordRoutes(app, {store: () => repository, addAudit: auditLogger});
require('./admin-commerce').registerAdminCommerce(app, {store: () => repository, addAudit: auditLogger, razorpay});



require('./support').registerSupport(app, rateLimit({ windowMs: 15 * 60 * 1000, max: 5, standardHeaders: true, legacyHeaders: false, message: { message: 'Too many messages. Please try again in 15 minutes.' } }), () => repository);
app.post("/api/account/:action", authLimiter, async (req, res) => {
  const action = req.params.action;
  if (!["signup", "login"].includes(action)) return res.sendStatus(404);
  const email = cleanText(req.body?.email).toLowerCase();
  const password = req.body?.password;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || typeof password !== "string" || password.length < 10 || Buffer.byteLength(password) > 72) {
    return res.status(400).json({ message: "Enter a valid email and a password of at least 10 characters (maximum 72 bytes)." });
  }
  const key = keyFor(email);
  let values, passwordHash;
  if (action === "signup") {
    const validation = validateDemoRequest(req.body);
    if (Object.keys(validation.errors).length) return res.status(400).json({ message: "Enter your name, work email, and company." });
    if (req.body.acceptTerms !== true) return res.status(400).json({ message: "Please accept the terms to sign up." });
    values = validation.values;
    passwordHash = await bcrypt.hash(password, 12);
    if (!mailConfigured() || !(process.env.ACCOUNT_NOTIFICATION_EMAIL || process.env.SALES_EMAIL)) {
      return res.status(503).json({ message: "Account email is temporarily unavailable. Please contact support." });
    }
  } else {
    const existing = await repository.get("customers", key);
    if (!existing?.passwordHash || !await bcrypt.compare(password, existing.passwordHash)) return res.status(401).json({ message: "Email or password is incorrect." });
    passwordHash = existing.passwordHash;
  }
  const id = visitorId(req) || crypto.randomBytes(32).toString("hex");
  const token = crypto.randomBytes(32).toString("hex");
  const verificationToken = action === 'signup' ? String(crypto.randomInt(100000, 1000000)) : null;
  const now = Date.now();
  const result = await repository.transaction(async tx => {
    const existing = await tx.get("customers", key);
    if (action === "signup" && existing?.passwordHash) throw fail(409, "Unable to create this account. Try signing in.");
    if (action === "login" && (!existing?.passwordHash || existing.passwordHash !== passwordHash)) throw fail(401, "Please sign in again.");
    const { c, v } = await enroll(tx, id, key, now);
    if (action === "signup") Object.assign(c, values, { passwordHash, registeredAt: now, termsAcceptedAt: now, emailVerification: { hash: keyFor(verificationToken), expiresAt: now + 10 * 60000 } });
    await tx.put("customers", key, c);
    await tx.put("sessions", keyFor(token), { customerKey: key, visitorId: id, version: c.sessionVersion || 0, expiresAt: now + 30 * 86400000 });
    return { ...eligibility(v, c), signedUp: true, customer: profile(c) };
  });
  visitorCookie(res, id);
  res.cookie("loomiq_session", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 30 * 86400000, path: "/" });
  if (action === 'signup') {
    const notificationEmail = process.env.ACCOUNT_NOTIFICATION_EMAIL || process.env.SALES_EMAIL;
    try {
      await Promise.all([
        sendMail({ to: email, subject: 'Your LoomIQ verification code', text: `Welcome to LoomIQ. Your verification code is: ${verificationToken}\n\nEnter this code in your account within 10 minutes. Do not share it with anyone.` }),
        sendMail({ to: notificationEmail, replyTo: email, subject: 'New LoomIQ account', text: `A new LoomIQ account was created.\n\nName: ${values.name}\nCompany: ${values.company}\nEmail: ${email}` }),
      ]);
    } catch {
      console.error('Signup email delivery failed.');
      return res.status(502).json({ message: 'Your account was created, but we could not send the verification email. Please sign in and request another verification link.' });
    }
  }
  res.status(action === "signup" ? 201 : 200).json(result);
});
app.post("/api/trial/select", requireAccount, async (req, res) => {
  if (req.body?.acceptConditions !== true) return res.status(400).json({ message: "Please accept the trial conditions." });
  const session = await account(req);
  await repository.transaction(async tx => {
    const c = await tx.get("customers", session.customerKey);
    const v = await tx.get("visitors", session.visitorId);
    if (c.paidOrder) throw fail(409, "A purchased account cannot start the new-customer trial.");
    c.trialAt ||= Date.now(); v.trialAt ||= c.trialAt;
    c.trialRequest ||= { id: crypto.randomUUID(), requestedAt: Date.now(), status: "requested" };
    await tx.put("customers", session.customerKey, c);
    await tx.put("visitors", session.visitorId, v);
  });
  res.json(await offerStatus(req));
});

app.get("/health", async (_request, response) => {
  try {
    if (app.locals.db) await app.locals.db.command({ ping: 1 }, { timeoutMS: 3000 });
    response.json({ ok: true, storage: repository.kind, timestamp: new Date().toISOString() });
  } catch { response.status(503).json({ ok: false }); }
});

app.get("/api/purchase/config", (_request, response) => {
  const configured = Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
  response.json({
    success: true,
    configured,
    keyId: configured ? String(process.env.RAZORPAY_KEY_ID).slice(0, 8) + "..." : null,
    message: configured
      ? "Razorpay is configured. Verify the key is valid and active in your dashboard."
      : "Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env.",
  });
});

// Customer contact data is private; listing requires an operator token.
app.get("/api/demo-requests", async (request, response) => {
  const expected = process.env.ADMIN_API_TOKEN;
  const provided = request.get("authorization")?.replace(/^Bearer /, "");
  if (!expected || !provided || !equal(crypto.createHash("sha256").update(provided).digest("hex"), crypto.createHash("sha256").update(expected).digest("hex"))) return response.sendStatus(403);
  response.json({ requests: await repository.list("demoRequests") });
});

app.post("/api/demo-requests", async (request, response) => {
  if (isRateLimited(getClientAddress(request))) {
    response.status(429).json({ success: false, message: "Too many requests. Please try again later." });
    return;
  }
  const body = request.body && typeof request.body === "object" ? request.body : {};
  if (String(body.action || '').toLowerCase() === 'verify') {
    const requestId = cleanText(body.requestId);
    const otp = cleanText(body.otp);
    if (!requestId || !/^\d{6}$/.test(otp)) return response.status(400).json({ success: false, message: 'Enter the six-digit verification code.' });
    const demoRequest = await repository.get('demoRequests', requestId);
    if (!demoRequest || demoRequest.status !== 'verification_pending') return response.status(404).json({ success: false, message: 'This demo verification request is no longer available.' });
    try {
      const result = await erpIntegration.verifyDemo({ requestId: demoRequest.erpRequestId, otp });
      const credentials = result.credentials;
      await repository.transaction(async tx => {
        const current = await tx.get('demoRequests', requestId);
        if (!current) return;
        Object.assign(current, { status: 'active', updatedAt: new Date().toISOString(), expiresAt: credentials.expiresAt, erp: { userId: result.userId, organizationId: result.organizationId } });
        await tx.put('demoRequests', requestId, current);
      });
      // Email is a delivery channel; credentials are also returned once to the
      // verified browser so a temporary mail delay cannot lock out the prospect.
      let credentialEmailDelivered = false;
      try {
        await sendMail({ to: demoRequest.email, subject: 'Your LoomIQ 3-hour demo credentials', text: `Your LoomIQ ERP demo is ready.\n\nLogin: ${result.loginUrl}\nUsername: ${credentials.username}\nTemporary password: ${credentials.temporaryPassword}\nExpires: ${new Date(credentials.expiresAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', timeZoneName: 'short' })}\n\nDo not share these credentials.` });
        credentialEmailDelivered = true;
      } catch (error) { console.error('Demo credential email failed:', error.message); }
      return response.status(201).json({ success: true, data: { credentials, loginUrl: result.loginUrl, credentialEmailDelivered } });
    } catch (error) {
      return response.status(error.status || 502).json({ success: false, message: error.message || 'Unable to verify your demo.' });
    }
  }
  if (cleanText(body.website)) {
    response.status(400).json({ success: false, message: "Validation failed", errors: { form: "Unable to process request." } });
    return;
  }
  if (Number.isFinite(body.formStartedAt) && Date.now() - body.formStartedAt < 1000) {
    response.status(400).json({ success: false, message: "Validation failed", errors: { form: "Please take a moment before submitting." } });
    return;
  }
  const { values, errors } = validateDemoRequest(body, { requireMobile: true });
  if (Object.keys(errors).length > 0) {
    response.status(400).json({ success: false, message: "Validation failed", errors });
    return;
  }
  if (!erpIntegration.configured()) return response.status(503).json({ success: false, message: 'The LoomIQ demo service is temporarily unavailable. Please contact support.' });
  await setVisitor(request, response);
  // Demo requests do not change account eligibility.
  const trialSelected = Boolean((await offerStatus(request)).trialSelected);
  const now = new Date().toISOString();
  let erpRequest;
  try {
    erpRequest = await erpIntegration.startDemo({ name: values.name, businessName: values.company, email: values.email, mobile: values.mobile, source: 'loomiq_marketing', campaign: cleanText(body.campaign), ip: getClientAddress(request) });
    if (!erpRequest.otp) throw new Error('ERP verification code was not supplied to the trusted delivery service.');
    await sendMail({ to: values.email, subject: 'Your LoomIQ demo verification code', text: `Your LoomIQ verification code is: ${erpRequest.otp}\n\nIt expires in 10 minutes. Do not share this code.` });
  } catch (error) {
    return response.status(error.status || 502).json({ success: false, message: error.message || 'Unable to start your demo.' });
  }
  const demoRequest = {
    id: "demo_" + crypto.randomUUID(),
    ...values,
    status: "verification_pending",
    requestType: "three_hour_demo",
    erpRequestId: erpRequest.requestId,
    createdAt: now,
    updatedAt: now,
  };
  await repository.transaction(tx => tx.put("demoRequests", demoRequest.id, demoRequest));
  sendDemoNotification(demoRequest).catch(() => {});
  response.status(202).json({ success: true, message: "Verification code sent.", data: { requestId: demoRequest.id } });
});
app.post("/api/purchase/quote", async (req, res) => {
  const offer = await offerStatus(req);
  const session = await account(req);
  const quote = await require('./customer-pricing').customerQuote(repository, session?.customerKey, req.body?.plan, offer);
  res.json({success:true,offer,...quote});
});

app.post("/api/purchase/order", requireAccount, async (request, response) => {
  const plan = cleanText(request.body?.plan);
  const customer = request.body?.customer && typeof request.body.customer === "object" ? request.body.customer : {};
  const requiredFields = ["name", "email", "phone", "company", "address", "city", "state"];
  const missingField = requiredFields.find((field) => !cleanText(customer[field]));
  if (!["Starter", "Growth"].includes(plan) || missingField) {
    response.status(400).json({ success: false, message: "Choose a plan and complete all required customer details." });
    return;
  }
  if (!razorpay) {
    response.status(503).json({
      success: false,
      code: "RAZORPAY_NOT_CONFIGURED",
      message: "Secure payment is not configured. Please contact LoomIQ to complete this purchase.",
    });
    return;
  }
  try {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanText(customer.email))) return response.status(400).json({ success: false, message: "Enter a valid email." });
    const session = await account(request);
    const id = session.visitorId;
    const key = session.customerKey;
    if (cleanText(customer.email).toLowerCase() !== (await repository.get("customers", key)).email) return response.status(400).json({ message: "Use the email of your signed-in account." });
    if (request.body.acceptConditions !== true) return response.status(400).json({ message: "Please accept the purchase conditions." });
    const offer = await offerStatus(request);
    const quote = await require('./customer-pricing').customerQuote(repository, key, plan, offer);
    const amount = quote.amount;
    if (request.body.expectedAmount !== amount) return response.status(409).json({ success: false, message: "Your eligibility or price changed. Review the updated total and pay again.", amount, offer, quote });
    const order = await razorpay.orders.create({ amount, currency: "INR", receipt: "loomiq_" + crypto.randomBytes(12).toString("hex"), notes: { plan } });
    await repository.transaction(tx => tx.put("orders", order.id, { id: order.id, visitorId: id, customerKey: key, amount, plan, unitPrice: amount, pricingSource: quote.source, pricingRevision: quote.pricingRevision, createdAt: Date.now(), testMode: !process.env.RAZORPAY_KEY_ID.startsWith("rzp_live_"), billing: Object.fromEntries(["name", "email", "company", "phone", "address", "city", "state", "stateCode", "pan", "gstin"].map(field => [field, cleanText(customer[field])])), seller: invoiceSeller() }));
    response.status(201).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    const statusCode = error.statusCode || (error.code === "Razorpay API timeout" ? 504 : 502);
    console.error("Razorpay order creation failed:", {
      code: error.code,
      statusCode: error.statusCode,
      message: error.message,
      body: error.error,
    });

    let message = "Unable to prepare secure checkout. Please try again.";
    if (error.error && error.error.code === "BAD_REQUEST_ERROR" && String(error.error.description).toLowerCase().includes("authentication")) {
      message = "Payment gateway authentication failed. Please contact LoomIQ to complete this purchase.";
    } else if (error.code === "Razorpay API timeout") {
      message = "Payment gateway is taking too long to respond. Please try again.";
    }

    response.status(statusCode).json({ success: false, message });
  }
});

const ERP_CONVERSION_LEASE_MS = 2 * 60 * 1000;
const ERP_CONVERSION_MAX_DELAY_MS = 60 * 60 * 1000;
const erpRetryInterval = () => Math.max(5000, Math.min(Number(process.env.ERP_CONVERSION_RETRY_INTERVAL_MS || 30000), 5 * 60 * 1000));
const retryDelay = attempts => Math.min(ERP_CONVERSION_MAX_DELAY_MS, erpRetryInterval() * 2 ** Math.min(Math.max(0, attempts - 1), 7));

const workspaceUrl = value => {
  try {
    const url = new URL(String(value || ''));
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : null;
  } catch { return null; }
};

async function findAssociatedDemo(customerKey, requestedId) {
  if (requestedId) {
    const demo = await repository.get('demoRequests', requestedId);
    if (demo?.erp?.userId) return demo;
  }
  const demos = await repository.list('demoRequests');
  // An expired demo remains eligible until its secure cleanup removes it.
  return demos.filter(item => ['active', 'expired'].includes(item.status) && item.erp?.userId && item.email && keyFor(item.email) === customerKey)
    .sort((a, b) => String(b.updatedAt || b.createdAt || '').localeCompare(String(a.updatedAt || a.createdAt || '')))[0];
}

async function claimErpConversion(orderId) {
  return repository.transaction(async tx => {
    const order = await tx.get('orders', orderId);
    if (!order || order.status !== 'paid') return null;
    const now = Date.now();
    const conversion = order.erpConversion || { status: 'pending', attempts: 0, nextAttemptAt: now };
    if (['converted', 'not_applicable'].includes(conversion.status)) return null;
    if (conversion.status === 'processing' && conversion.startedAt > now - ERP_CONVERSION_LEASE_MS) return null;
    if (conversion.nextAttemptAt && conversion.nextAttemptAt > now) return null;
    order.erpConversion = { ...conversion, status: 'processing', attempts: (conversion.attempts || 0) + 1, startedAt: now, nextAttemptAt: null, lastError: null };
    await tx.put('orders', order.id, order);
    return { id: order.id, customerKey: order.customerKey, plan: order.plan, conversion: order.erpConversion };
  });
}

async function deferErpConversion(orderId, error) {
  await repository.transaction(async tx => {
    const order = await tx.get('orders', orderId);
    if (!order?.erpConversion || order.erpConversion.status !== 'processing') return;
    const attempts = order.erpConversion.attempts || 1;
    order.erpConversion = { ...order.erpConversion, status: 'pending', startedAt: null, nextAttemptAt: Date.now() + retryDelay(attempts), lastError: String(error?.message || 'ERP conversion failed').slice(0, 500) };
    await tx.put('orders', order.id, order);
  });
}

async function markConversionNotApplicable(orderId) {
  await repository.transaction(async tx => {
    const order = await tx.get('orders', orderId);
    if (!order?.erpConversion || order.erpConversion.status !== 'processing') return;
    order.erpConversion = { ...order.erpConversion, status: 'not_applicable', completedAt: Date.now(), startedAt: null, nextAttemptAt: null };
    await tx.put('orders', order.id, order);
  });
}

async function bindDemoToConversion(orderId, demoId) {
  await repository.transaction(async tx => {
    const order = await tx.get('orders', orderId);
    if (!order?.erpConversion || order.erpConversion.status !== 'processing') return;
    order.erpConversion = { ...order.erpConversion, demoRequestId: demoId };
    await tx.put('orders', order.id, order);
  });
}

async function completeErpConversion(claim, demo, result) {
  const url = workspaceUrl(result.workspaceUrl);
  if (!url) throw new Error('ERP conversion succeeded but ERP_LOGIN_URL is not a valid HTTPS URL.');
  await repository.transaction(async tx => {
    const order = await tx.get('orders', claim.id);
    const customer = await tx.get('customers', claim.customerKey);
    if (!order || !customer || order.erpConversion?.status !== 'processing') return;
    const completedAt = Date.now();
    order.erpConversion = { ...order.erpConversion, status: 'converted', startedAt: null, nextAttemptAt: null, completedAt, workspaceUrl: url, demoRequestId: demo.id };
    customer.onboarding = { status: 'active', workspaceUrl: url, updatedAt: completedAt };
    await tx.put('orders', order.id, order);
    await tx.put('customers', claim.customerKey, customer);
    const current = await tx.get('demoRequests', demo.id);
    if (current && ['active', 'expired'].includes(current.status)) {
      current.status = 'converted'; current.convertedAt = new Date(completedAt).toISOString(); current.updatedAt = current.convertedAt; current.purchaseOrderId = order.id;
      await tx.put('demoRequests', current.id, current);
    }
  });
}

async function processErpConversion(orderId) {
  const claim = await claimErpConversion(orderId);
  if (!claim) return { status: 'unchanged' };
  try {
    const demo = await findAssociatedDemo(claim.customerKey, claim.conversion.demoRequestId);
    if (!demo) { await markConversionNotApplicable(claim.id); return { status: 'manual_onboarding' }; }
    await bindDemoToConversion(claim.id, demo.id);
    if (!erpIntegration.configured()) throw new Error('ERP paid-demo conversion is not configured.');
    const result = await erpIntegration.convertDemo({
      userId: demo.erp.userId, subscriptionId: claim.id, planCode: String(claim.plan || 'Starter').toLowerCase(),
      currentPeriodEndsAt: new Date(Date.now() + 30 * 86400000).toISOString(),
    });
    await completeErpConversion(claim, demo, result || {});
    return { status: 'converted' };
  } catch (error) {
    await deferErpConversion(claim.id, error);
    throw error;
  }
}

async function retryPendingErpConversions() {
  const orders = await repository.list('orders');
  await Promise.all(orders.filter(order => order.status === 'paid' && !['converted', 'not_applicable'].includes(order.erpConversion?.status)).map(order => processErpConversion(order.id).catch(error => console.error('ERP paid-demo conversion retry failed:', error.message))));
}

function startErpConversionRetryWorker() {
  const timer = setInterval(() => retryPendingErpConversions().catch(error => console.error('ERP conversion retry worker failed:', error.message)), erpRetryInterval());
  timer.unref?.();
  retryPendingErpConversions().catch(error => console.error('ERP conversion retry worker failed:', error.message));
  return timer;
}

async function settle(paymentId, observedAt = Date.now(), authoritativeTime = false) {
  const payment = await razorpay.payments.fetch(paymentId);
  if (!authoritativeTime) observedAt = Date.now();
  const result = await repository.transaction(async tx => {
    const order = await tx.get("orders", payment.order_id);
    if (!order || payment.amount !== order.amount || payment.currency !== "INR") throw new Error("Payment does not match a stored order.");
    if (order.paymentId === paymentId && order.status === "paid") return { success: true, customerKey: order.customerKey, orderId: order.id, plan: order.plan };
    if (order.status === "rejected") return { success: false, message: "This payment has been rejected. Please contact support with your payment reference." };
    if (payment.status !== "captured") return { success: false, message: "Payment is awaiting capture. Please contact support with your payment reference." };
    const c = await tx.get("customers", order.customerKey);
    const v = await tx.get("visitors", order.visitorId);
    order.status = "paid"; order.paymentId = paymentId; order.paidAt = observedAt;
    order.erpConversion ||= { status: 'pending', attempts: 0, nextAttemptAt: Date.now() };
    order.invoice ||= await createInvoice(payment.order_id, order, c, tx);
    c.paidOrder = payment.order_id; v.paidOrder = payment.order_id;
    c.launchPriceLock ||= {};
    c.launchPriceLock[order.plan] ||= { amount: order.amount, expiresAt: observedAt + 90 * 86400000 };
    await tx.put("orders", payment.order_id, order);
    await tx.put("customers", order.customerKey, c);
    await tx.put("visitors", order.visitorId, v);
    return { success: true, message: "Payment verified successfully.", customerKey: order.customerKey, orderId: order.id, plan: order.plan };
  });
  if (result.success && result.customerKey) {
    try {
      const workspace = await processErpConversion(result.orderId);
      if (workspace.status === 'converted') result.message = 'Payment verified and your LoomIQ workspace is now active.';
    } catch (error) {
      // Payment is already settled and must not be rolled back because a
      // downstream provisioning call is temporarily unavailable.
      console.error('ERP paid-demo conversion failed:', error.message);
      result.message = 'Payment verified. Workspace activation is in progress.';
    }
    delete result.customerKey;
  }
  return result;
}
async function ownedInvoice(req) {
  const session = await account(req);
  return repository.transaction(async tx => {
    const customer = await tx.get("customers", session.customerKey);
    const id = req.params.orderId || customer?.paidOrder;
    const order = id && await tx.get("orders", id);
    if (!order || order.customerKey !== session.customerKey || order.status !== "paid") throw fail(404, "No confirmed payment was found for this account.");
    if (!order.invoice) {
      order.invoice = await createInvoice(id, order, customer, tx);
      await tx.put("orders", id, order);
    }
    return order.invoice;
  });
}
// A consented browser may claim each real, paid order once across reloads/devices.
// Never infer conversion success from a return URL or a client-supplied amount.
app.post('/api/purchase/conversion/:orderId', requireAccount, async (req, res) => {
  if (req.body?.consent !== true) return res.status(400).json({message:'Analytics consent is required.'});
  const session = await account(req);
  const conversion = await repository.transaction(async tx => {
    const order = await tx.get('orders', req.params.orderId);
    if (!order || order.customerKey !== session.customerKey || order.status !== 'paid' || order.testMode !== false) return null;
    if (order.conversionClaimedAt) return null;
    order.conversionClaimedAt = Date.now();
    await tx.put('orders', order.id, order);
    return {eventId:'purchase_' + order.id, orderId:order.id, amount:order.amount, plan:order.plan};
  });
  res.setHeader('Cache-Control', 'no-store');
  res.json({conversion});
});
app.get("/api/purchase/receipt", requireAccount, async (req, res) => res.json(await ownedInvoice(req)));
app.get("/api/purchase/receipt/:orderId", requireAccount, async (req, res) => res.json(await ownedInvoice(req)));
app.get("/api/purchase/invoice/:orderId", requireAccount, async (req, res) => {
  const invoice = await ownedInvoice(req);
  res.setHeader("Content-Security-Policy", "default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'");
  const pdf = await renderInvoicePdf(invoice);
  const filename = String(invoice.number).replace(/[^a-zA-Z0-9_-]/g, "_") + ".pdf";
  res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
  res.setHeader("Cache-Control", "private, no-store");
  res.type("application/pdf").send(pdf);
});

app.post("/api/purchase/verify", async (req, res) => {
  const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: sig } = req.body || {};
  if (!razorpay || typeof orderId !== "string" || typeof paymentId !== "string" || !equal(sig, crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET).update(orderId + "|" + paymentId).digest("hex"))) return res.status(400).json({ success: false, message: "Payment verification failed." });
  const session = await account(req);
  if (!session || (await repository.get("orders", orderId))?.customerKey !== session.customerKey) return res.status(403).json({ success: false, message: "Checkout session does not match." });
  try { const result = await settle(paymentId); res.status(result.success ? 200 : 409).json(result); }
  catch (error) { console.error("Settlement failed:", error.message); res.status(502).json({ success: false, message: "Payment confirmation is pending. Contact support before retrying payment." }); }
});
app.post("/api/purchase/webhook", async (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret || !razorpay || !equal(req.get("x-razorpay-signature"), crypto.createHmac("sha256", secret).update(req.rawBody).digest("hex"))) return res.sendStatus(401);
  if (req.body.event !== "payment.captured") return res.sendStatus(200);
  const payment = req.body.payload?.payment?.entity;
  const order = payment?.order_id && await repository.get("orders", payment.order_id);
  if (!order) return res.sendStatus(200);
  const timestamp = Number(req.body.created_at) * 1000;
  if (!Number.isFinite(timestamp) || timestamp < order.createdAt - 1000 || timestamp > Date.now() + 60000) return res.sendStatus(400);
  try { await settle(payment.id, timestamp, true); res.sendStatus(200); }
  catch (error) { console.error("Webhook settlement failed:", error.message); res.sendStatus(500); }
});

if (process.env.SERVE_FRONTEND === 'true') require('./web').registerWebsite(app, path.join(__dirname, '../frontend/dist'), () => repository);

app.use((error, _request, response, _next) => {
  console.error('Unhandled error:', error);
  const status = error.status || (error.code === "LIMIT_FILE_SIZE" ? 413 : error.code?.startsWith("LIMIT_") ? 400 : null) || (error.type === "entity.parse.failed" ? 400 : 503);
  response.status(status).json({ success: false, message: status < 500 ? error.message : "Unable to save or retrieve your information. Please try again shortly." });
});

async function startServer() {
  require('./production-config').validateProduction();
  const { connectDatabase, closeDatabase } = require("./database");
  // Existing local development works without database configuration. Once configured,
  // a connection failure prevents startup rather than silently ignoring MongoDB.
  const useMongo = process.env.STORAGE_DRIVER !== "file" && Boolean(process.env.MONGODB_URI || process.env.MONGODB_HOST || process.env.MONGODB_USERNAME);
  if (useMongo) {
    app.locals.db = await connectDatabase();
    repository = await initializeMongo(app.locals.db, offerDbPath, demoDbPath);
    console.log("MongoDB connected; website storage is ready.");
  }
  const server = app.listen(port, () => console.log("LoomIQ API listening on port " + port));
  startErpConversionRetryWorker();
  const shutdown = () => {
    server.close(() => { closeDatabase().then(() => process.exit(0)).catch(() => process.exit(1)); });
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
  return server;
}
if (require.main === module) {
  startServer().catch((error) => { console.error(error.message); process.exitCode = 1; });
}
module.exports = { app, startServer, useRepository: (store) => { repository = store; } };
