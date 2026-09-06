const express = require("express");

const app = express();
const port = Number(process.env.PORT || 3001);
const maxRequestsPerWindow = 5;
const rateLimitWindowMs = 15 * 60 * 1000;
const requestLog = new Map();
const demoRequests = [];

app.disable("x-powered-by");
app.use(express.json({ limit: "20kb" }));

app.use((request, response, next) => {
  const allowedOrigin = process.env.FRONTEND_ORIGIN;
  if (allowedOrigin) {
    response.setHeader("Access-Control-Allow-Origin", allowedOrigin);
    response.setHeader("Vary", "Origin");
    response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    response.setHeader("Access-Control-Allow-Headers", "Content-Type");
  }

  if (request.method === "OPTIONS") {
    response.sendStatus(204);
    return;
  }

  next();
});

function getClientAddress(request) {
  return request.ip || request.socket.remoteAddress || "unknown";
}

function isRateLimited(address) {
  const now = Date.now();
  const recentRequests = (requestLog.get(address) || []).filter(
    (timestamp) => now - timestamp < rateLimitWindowMs,
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

app.get("/health", (_request, response) => {
  response.json({ ok: true });
});

app.post("/api/demo-requests", (request, response) => {
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

  const now = new Date().toISOString();
  demoRequests.push({
    id: `demo_${Date.now()}_${demoRequests.length + 1}`,
    ...values,
    status: "new",
    createdAt: now,
    updatedAt: now,
  });

  response.status(201).json({ success: true, message: "Demo request submitted successfully" });
});

app.use((_error, _request, response, _next) => {
  response.status(400).json({ success: false, message: "Invalid request." });
});

if (require.main === module) {
  app.listen(port, () => {
    console.log(`LoomIQ API listening on port ${port}`);
  });
}

module.exports = { app, demoRequests };