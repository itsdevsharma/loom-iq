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

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 3001);
const maxRequestsPerWindow = 5;
const rateLimitWindowMs = 15 * 60 * 1000;
const requestLog = new Map();
const { createInvoice, renderInvoice } = require("./invoice");
const { pricing, equal } = require("./early-bird");
const { fileRepository, initializeMongo } = require("./repository");
const { keyFor, fail, eligibility, profile, enroll } = require("./account-service");
const offerDbPath = process.env.OFFER_DB_PATH || path.join(__dirname, "data", "offers.json");
const demoDbPath = path.join(__dirname, "data", "demo-requests.json");
let repository = fileRepository(offerDbPath, demoDbPath);
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
  return session && session.expiresAt > Date.now() ? session : null;
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
app.use(helmet());
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

function validateDemoRequest(body) {
  const name = cleanText(body.name);
  const email = cleanText(body.email).toLowerCase();
  const company = cleanText(body.company);
  const businessType = cleanText(body.businessType);
  const errors = {};
  if (!name) errors.name = "Name is required.";
  else if (name.length < 2 || name.length > 100) errors.name = "Name must be between 2 and 100 characters.";
  if (!email) errors.email = "Email is required.";
  else if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Enter a valid email address.";
  if (!company) errors.company = "Company is required.";
  else if (company.length < 2 || company.length > 150) errors.company = "Company must be between 2 and 150 characters.";
  if (businessType.length > 80) errors.businessType = "Business type is too long.";
  return { values: { name, email, company, businessType }, errors };
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
  if (req.method === "POST" && req.headers.origin && req.headers.origin !== process.env.FRONTEND_ORIGIN && req.headers.origin !== `${req.protocol}://${req.get("host")}`) {
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
  } else {
    const existing = await repository.get("customers", key);
    if (!existing?.passwordHash || !await bcrypt.compare(password, existing.passwordHash)) return res.status(401).json({ message: "Email or password is incorrect." });
  }
  const id = visitorId(req) || crypto.randomBytes(32).toString("hex");
  const token = crypto.randomBytes(32).toString("hex");
  const now = Date.now();
  const result = await repository.transaction(async tx => {
    const existing = await tx.get("customers", key);
    if (action === "signup" && existing?.passwordHash) throw fail(409, "Unable to create this account. Try signing in.");
    if (action === "login" && !existing?.passwordHash) throw fail(401, "Please sign in again.");
    const { c, v } = await enroll(tx, id, key, now);
    if (action === "signup") Object.assign(c, values, { passwordHash, registeredAt: now, termsAcceptedAt: now });
    await tx.put("customers", key, c);
    await tx.put("sessions", keyFor(token), { customerKey: key, visitorId: id, expiresAt: now + 30 * 86400000 });
    return { ...eligibility(v, c), signedUp: true, customer: profile(c) };
  });
  visitorCookie(res, id);
  res.cookie("loomiq_session", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 30 * 86400000, path: "/" });
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

app.get("/health", (_request, response) => {
  response.json({ ok: true, storage: repository.kind, timestamp: new Date().toISOString() });
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
  if (cleanText(body.website)) {
    response.status(400).json({ success: false, message: "Validation failed", errors: { form: "Unable to process request." } });
    return;
  }
  if (Number.isFinite(body.formStartedAt) && Date.now() - body.formStartedAt < 1000) {
    response.status(400).json({ success: false, message: "Validation failed", errors: { form: "Please take a moment before submitting." } });
    return;
  }
  const { values, errors } = validateDemoRequest(body);
  if (Object.keys(errors).length > 0) {
    response.status(400).json({ success: false, message: "Validation failed", errors });
    return;
  }
  await setVisitor(request, response);
  // Demo requests do not change account eligibility.
  const trialSelected = Boolean((await offerStatus(request)).trialSelected);
  const now = new Date().toISOString();
  const demoRequest = {
    id: "demo_" + crypto.randomUUID(),
    ...values,
    status: "new",
    requestType: trialSelected ? "trial" : "demo",
    createdAt: now,
    updatedAt: now,
  };
  await repository.transaction(tx => tx.put("demoRequests", demoRequest.id, demoRequest));
  sendDemoNotification(demoRequest).catch(() => {});
  response.status(201).json({ success: true, message: "Demo request submitted successfully" });
});
app.post("/api/purchase/quote", async (req, res) => {
  const plan = pricing[req.body?.plan];
  if (!plan || !Object.hasOwn(pricing, req.body?.plan)) return res.status(400).json({ success: false, message: "Invalid plan." });
  const offer = await offerStatus(req);
  res.json({ success: true, offer, amount: (offer.eligible ? plan.firstMonth : plan.recurring) * 100, recurring: plan.recurring });
});

app.post("/api/purchase/order", requireAccount, async (request, response) => {
  const plan = cleanText(request.body?.plan);
  const customer = request.body?.customer && typeof request.body.customer === "object" ? request.body.customer : {};
  const requiredFields = ["name", "email", "phone", "company", "address", "city", "state"];
  const missingField = requiredFields.find((field) => !cleanText(customer[field]));
  if (!Object.prototype.hasOwnProperty.call(pricing, plan) || missingField) {
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
    if (offer.eligible && !process.env.RAZORPAY_WEBHOOK_SECRET) return response.status(503).json({ success: false, message: "Early-bird payment confirmation is not configured. Please contact support." });
    const amount = (offer.eligible ? pricing[plan].firstMonth : pricing[plan].recurring) * 100;
    if (request.body.expectedAmount !== amount) return response.status(409).json({ success: false, message: "Your eligibility or price changed. Review the updated total and pay again.", amount, offer });
    const order = await razorpay.orders.create({ amount, currency: "INR", receipt: "loomiq_" + crypto.randomBytes(12).toString("hex"), notes: { plan } });
    await repository.transaction(tx => tx.put("orders", order.id, { visitorId: id, customerKey: key, amount, plan, discounted: offer.eligible, expiresAt: offer.expiresAt, createdAt: Date.now(), testMode: !process.env.RAZORPAY_KEY_ID.startsWith("rzp_live_"), billing: Object.fromEntries(["name", "email", "company", "phone", "address", "city", "state"].map(field => [field, cleanText(customer[field])])), seller: { name: process.env.INVOICE_BUSINESS_NAME || "LoomIQ", address: process.env.INVOICE_BUSINESS_ADDRESS || "", gstin: process.env.INVOICE_GSTIN || "", email: "support@loomiq.com" } }));
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

async function settle(paymentId, observedAt = Date.now(), authoritativeTime = false) {
  const payment = await razorpay.payments.fetch(paymentId);
  if (!authoritativeTime) observedAt = Date.now();
  const result = await repository.transaction(async tx => {
    const order = await tx.get("orders", payment.order_id);
    if (!order || payment.amount !== order.amount || payment.currency !== "INR") throw new Error("Payment does not match a stored order.");
    if (order.paymentId === paymentId && order.status === "paid") return { success: true };
    if (order.status === "rejected" && payment.amount_refunded === payment.amount) return { success: false, message: "This ineligible payment has been refunded. Please purchase at the regular price." };
    if (payment.status !== "captured") return { success: false, message: "Payment is awaiting capture. Please contact support with your payment reference." };
    const c = await tx.get("customers", order.customerKey);
    const v = await tx.get("visitors", order.visitorId);
    if (order.discounted && observedAt >= order.expiresAt && !authoritativeTime && order.status !== "rejected") return { success: false, message: "Payment confirmation is pending the gateway timestamp. Contact support with your payment reference; do not pay again." };
    const invalid = order.status === "rejected" || order.discounted && (observedAt >= order.expiresAt);
    if (invalid) {
      order.status = "rejected";
      await tx.put("orders", payment.order_id, order);
      return { success: false, refund: true };
    }
    order.status = "paid"; order.paymentId = paymentId; order.paidAt = observedAt;
    order.invoice ||= createInvoice(payment.order_id, order, c);
    c.paidOrder = payment.order_id; v.paidOrder = payment.order_id;
    await tx.put("orders", payment.order_id, order);
    await tx.put("customers", order.customerKey, c);
    await tx.put("visitors", order.visitorId, v);
    return { success: true, message: "Payment verified successfully." };
  });
  // External gateway calls must stay outside retryable database transactions.
  if (result.refund) {
    if (!payment.amount_refunded) {
      const refundClient = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET, headers: { "X-Refund-Idempotency": `early-bird-${paymentId}` } });
      const refund = await refundClient.payments.refund(paymentId, { amount: payment.amount });
      await repository.transaction(async tx => {
        const order = await tx.get("orders", payment.order_id);
        order.refundId = refund.id;
        await tx.put("orders", payment.order_id, order);
      });
    }
    return { success: false, message: "This early-bird payment is no longer eligible. A full refund was requested. Please purchase at the regular price." };
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
      order.invoice = createInvoice(id, order, customer);
      await tx.put("orders", id, order);
    }
    return order.invoice;
  });
}
app.get("/api/purchase/receipt", requireAccount, async (req, res) => res.json(await ownedInvoice(req)));
app.get("/api/purchase/receipt/:orderId", requireAccount, async (req, res) => res.json(await ownedInvoice(req)));
app.get("/api/purchase/invoice/:orderId", requireAccount, async (req, res) => {
  const invoice = await ownedInvoice(req);
  res.setHeader("Content-Security-Policy", "default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'");
  res.type("html").send(renderInvoice(invoice));
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

app.use((error, _request, response, _next) => {
  const status = error.status || (error.type === "entity.parse.failed" ? 400 : 503);
  response.status(status).json({ success: false, message: status < 500 ? error.message : "Unable to save or retrieve your information. Please try again shortly." });
});

async function startServer() {
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
