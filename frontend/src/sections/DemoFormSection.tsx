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
      setErrorMessage("Please fill in your name, work email, and company name.");
      trackEvent("demo_form_error");
      setStatus("error");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMessage("Please enter a valid work email address.");
      trackEvent("demo_form_error");
      setStatus("error");
      return;
    }

    setStatus("submitting");
    trackEvent("demo_form_submitted");

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL ?? ""}/api/demo-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          company,
          businessType: formData.get("businessType"),
          website: formData.get("website"),
          formStartedAt,
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
          <p className="eyebrow">Product walkthrough</p>
          <h2>See LoomIQ mapped to your manufacturing workflow.</h2>
          <p>
            Walk through your order, material, production, quality, dispatch, and
            finance process with a LoomIQ product specialist.
          </p>

          <ul className="demo-form-list">
            <li>Map one real order from enquiry to delivery</li>
            <li>See material planning, stores, production, and quality in action</li>
            <li>Review costing, dispatch, and receivables visibility</li>
            <li>Leave with a practical module recommendation</li>
          </ul>
        </div>

        <div className="demo-form-card">
          {status === "success" ? (
            <div className="demo-form-success" role="status" aria-live="polite">
              <span className="demo-form-success-icon" aria-hidden="true">✓</span>
              <h3>Thanks — request received.</h3>
              <p>
                A LoomIQ specialist will reach out within one business day to
                understand your operation and confirm a walkthrough time.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} onFocus={() => trackEvent("demo_form_started")} noValidate>
              <h3>Show us how your factory works</h3>
              <p className="demo-form-meta">We will prepare the walkthrough around your process.</p>

              <label htmlFor="demo-name">Full name</label>
              <input
                id="demo-name"
                name="name"
                type="text"
                autoComplete="name"
                placeholder="Jane Doe"
                required
                aria-invalid={Boolean(fieldErrors.name)}
              />
              {fieldErrors.name && <span className="demo-form-field-error">{fieldErrors.name}</span>}

              <label htmlFor="demo-email">Work email</label>
              <input
                id="demo-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="jane@company.com"
                required
                aria-invalid={Boolean(fieldErrors.email)}
              />
              {fieldErrors.email && <span className="demo-form-field-error">{fieldErrors.email}</span>}

              <label htmlFor="demo-company">Company name</label>
              <input
                id="demo-company"
                name="company"
                type="text"
                autoComplete="organization"
                placeholder="Acme Industries"
                required
                aria-invalid={Boolean(fieldErrors.company)}
              />
              {fieldErrors.company && <span className="demo-form-field-error">{fieldErrors.company}</span>}

              <label htmlFor="demo-business">Business type (optional)</label>
              <select id="demo-business" name="businessType" defaultValue="">
                <option value="" disabled>Select an option</option>
                <option value="fabric-mill">Fabric mill</option>
                <option value="dyeing-processing">Dyeing / Processing</option>
                <option value="garment">Garment manufacturing</option>
                <option value="home-textiles">Home textiles</option>
                <option value="textile-trading">Textile trading / Distribution</option>
                <option value="other-manufacturing">Other manufacturing</option>
                <option value="other">Other</option>
              </select>

              <label className="demo-form-honeypot" htmlFor="demo-website">Website</label>
              <input className="demo-form-honeypot" id="demo-website" name="website" type="text" tabIndex={-1} autoComplete="off" />

              <button
                type="submit"
                className="button button-primary demo-form-submit"
                disabled={status === "submitting"}
              >
                {status === "submitting" ? "Submitting..." : "Request a walkthrough"}
              </button>

              <p className="demo-form-privacy">
                We will only use your information to schedule and prepare your demo.
                See our <a href={`${import.meta.env.BASE_URL}privacy`}>privacy policy</a>.
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
