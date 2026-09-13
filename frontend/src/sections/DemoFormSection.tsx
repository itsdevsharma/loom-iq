import { cmsValue } from '../websiteContent';
import { useState } from "react";
import type { FormEvent } from "react";
import "../DemoFormSection.css";
import { trackEvent } from "../analytics";

type FormStatus = "idle" | "submitting" | "success" | "error";

function DemoFormSection() {
  const [status, setStatus] = useState<FormStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formStartedAt] = useState(() => Date.now());

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setFieldErrors({});

    const formData = new FormData(event.currentTarget);
    const name = (formData.get("name") as string | null)?.trim() ?? "";
    const email = (formData.get("email") as string | null)?.trim() ?? "";
    const company = (formData.get("company") as string | null)?.trim() ?? "";
    

    if (!name || !email || !company) {
      setErrorMessage(cmsValue("DemoFormSection.extra31", "Please fill in your name, work email, and company name."));
      trackEvent("demo_form_error");
      setStatus("error");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMessage(cmsValue("DemoFormSection.extra32", "Please enter a valid work email address."));
      trackEvent("demo_form_error");
      setStatus("error");
      return;
    }

    setStatus("submitting");
    trackEvent("demo_form_submitted");

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL ?? ""}/api/demo-requests`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          company,
          businessType: formData.get("businessType"),
          website: formData.get("website"),
          formStartedAt,
          trial: false,
        }),
      });
      const result = await response.json() as { success?: boolean; message?: string; errors?: Record<string, string> };

      if (!response.ok || !result.success) {
        setFieldErrors(result.errors ?? {});
        throw new Error(result.message ?? "We could not submit your request.");
      }

      trackEvent("demo_form_success");
      window.location.assign(`${import.meta.env.BASE_URL}thank-you`);
    } catch (error) {
      trackEvent("demo_form_error");
      setErrorMessage(error instanceof Error ? error.message : "Network error. Please try again.");
      setStatus("error");
    }
  };

  return (
    <section id="demo" className="section section-shell section-demo-form">
      <div className="demo-form-inner">
        <div className="demo-form-copy">
          <p className="eyebrow">{cmsValue("DemoFormSection.1", "Product walkthrough")}</p>
          <h2>{cmsValue("DemoFormSection.2", "See LoomIQ mapped to your manufacturing workflow.")}</h2>
          <p>{cmsValue("DemoFormSection.3", " Walk through your order, material, production, quality, dispatch, and finance process with a LoomIQ product specialist. ")}</p>

          <ul className="demo-form-list">
            <li>{cmsValue("DemoFormSection.4", "Map one real order from enquiry to delivery")}</li>
            <li>{cmsValue("DemoFormSection.5", "See material planning, stores, production, and quality in action")}</li>
            <li>{cmsValue("DemoFormSection.6", "Review costing, dispatch, and receivables visibility")}</li>
            <li>{cmsValue("DemoFormSection.7", "Leave with a practical module recommendation")}</li>
          </ul>
        </div>

        <div className="demo-form-card">
          {status === "success" ? (
            <div className="demo-form-success" role="status" aria-live="polite">
              <span className="demo-form-success-icon" aria-hidden="true">✓</span>
              <h3>{cmsValue("DemoFormSection.8", "Thanks — request received.")}</h3>
              <p>{cmsValue("DemoFormSection.9", " A LoomIQ specialist will reach out within one business day to understand your operation and confirm a walkthrough time. ")}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} onFocus={() => trackEvent("demo_form_started")} noValidate>
              <h3>{cmsValue("DemoFormSection.10", "Book a personalized demo")}</h3>
              <p className="demo-form-meta">{cmsValue("DemoFormSection.11", "No account or payment needed. After the demo, we’ll help you decide whether a trial or paid plan fits.")}</p>

              <label htmlFor="demo-name">{cmsValue("DemoFormSection.12", "Full name")}</label>
              <input
                id="demo-name"
                name="name"
                type="text"
                autoComplete="name"
                placeholder={cmsValue("DemoFormSection.13", "Jane Doe")}
                required
                aria-invalid={Boolean(fieldErrors.name)}
              />
              {fieldErrors.name && <span className="demo-form-field-error">{fieldErrors.name}</span>}

              <label htmlFor="demo-email">{cmsValue("DemoFormSection.14", "Work email")}</label>
              <input
                id="demo-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder={cmsValue("DemoFormSection.15", "jane@company.com")}
                required
                aria-invalid={Boolean(fieldErrors.email)}
              />
              {fieldErrors.email && <span className="demo-form-field-error">{fieldErrors.email}</span>}

              <label htmlFor="demo-company">{cmsValue("DemoFormSection.16", "Company name")}</label>
              <input
                id="demo-company"
                name="company"
                type="text"
                autoComplete="organization"
                placeholder={cmsValue("DemoFormSection.17", "Acme Industries")}
                required
                aria-invalid={Boolean(fieldErrors.company)}
              />
              {fieldErrors.company && <span className="demo-form-field-error">{fieldErrors.company}</span>}

              <label htmlFor="demo-business">{cmsValue("DemoFormSection.18", "Business type (optional)")}</label>
              <select id="demo-business" name="businessType" defaultValue="">
                <option value="" disabled>{cmsValue("DemoFormSection.19", "Select an option")}</option>
                <option value="fabric-mill">{cmsValue("DemoFormSection.20", "Fabric mill")}</option>
                <option value="dyeing-processing">{cmsValue("DemoFormSection.21", "Dyeing / Processing")}</option>
                <option value="garment">{cmsValue("DemoFormSection.22", "Garment manufacturing")}</option>
                <option value="home-textiles">{cmsValue("DemoFormSection.23", "Home textiles")}</option>
                <option value="textile-trading">{cmsValue("DemoFormSection.24", "Textile trading / Distribution")}</option>
                <option value="other-manufacturing">{cmsValue("DemoFormSection.25", "Other manufacturing")}</option>
                <option value="other">{cmsValue("DemoFormSection.26", "Other")}</option>
              </select>

              <label className="demo-form-honeypot" htmlFor="demo-website">{cmsValue("DemoFormSection.27", "Website")}</label>
              <input className="demo-form-honeypot" id="demo-website" name="website" type="text" tabIndex={-1} autoComplete="off" />

              <button
                type="submit"
                className="button button-primary demo-form-submit"
                disabled={status === "submitting"}
              >
                {status === "submitting" ? "Submitting..." : cmsValue("DemoFormSection.28", "Book a personalized demo")}
              </button>

              <p className="demo-form-privacy">{cmsValue("DemoFormSection.29", " We will only use your information to schedule and prepare your demo. See our ")}<a href={`${import.meta.env.BASE_URL}privacy`}>{cmsValue("DemoFormSection.30", "privacy policy")}</a>.
              </p>

              {status === "error" && errorMessage && (
                <p className="demo-form-error" role="alert">{errorMessage}</p>
              )}
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

export default DemoFormSection;
