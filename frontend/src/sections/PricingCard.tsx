import type { CSSProperties, MouseEventHandler, ReactNode } from "react";
import "../PricingCard.css";

type PricingCardProps = {
  planName?: string;
  tagline?: string;
  price?: string;
  originalPrice?: string;
  recurringText?: string;
  period?: string;
  features?: string[];
  ctaLabel?: string;
  onCtaClick?: MouseEventHandler<HTMLAnchorElement | HTMLButtonElement>;
  href?: string;
  featured?: boolean;
  badge?: string | null;
  eyebrow?: string;
  bottomText?: string;
  icon?: ReactNode;
  accent?: string;
  accentStrong?: string;
  background?: string;
  className?: string;
};

export default function PricingCard({
  planName = "Starter",
  tagline = "For textile teams getting started",
  price = "$19",
  originalPrice,
  recurringText,
  period = "/mo",
  features = [],
  ctaLabel = "Get started",
  onCtaClick,
  href,
  featured = false,
  badge = featured ? "Most popular" : null,
  eyebrow,
  bottomText,
  icon,
  accent = "var(--accent)",
  accentStrong = "var(--accent-strong)",
  background = "var(--panel)",
  className = "",
}: PricingCardProps) {
  const CTA = href ? "a" : "button";

  return (
    <div
      className={`pricing-card-anim ${featured ? "is-featured" : ""} ${className}`}
      style={{
        ["--pc-accent"]: accent,
        ["--pc-accent-strong"]: accentStrong,
        ["--pc-bg"]: background,
      } as CSSProperties}
    >
      <div className="pc-border" aria-hidden="true" />

      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      {badge && <span className="pc-badge">{badge}</span>}

      <div className="pc-content">
        {icon && <div className="pc-icon">{icon}</div>}

        <h3 className="pc-plan-name">{planName}</h3>
        {tagline && <p className="pc-tagline">{tagline}</p>}

        <div className="pc-price-row">
          {originalPrice && <span className="pc-original-price">{originalPrice}</span>}
          <span className="pc-price">{price}</span>
          {period && <span className="pc-period">{period}</span>}
        </div>
        {recurringText && <p className="pc-recurring-text">{recurringText}</p>}

        {features.length > 0 && (
          <ul className="pc-feature-list">
            {features.map((feature, i) => (
              <li key={i}>
                <span className="pc-check" aria-hidden="true" />
                {feature}
              </li>
            ))}
          </ul>
        )}

        <CTA
          className="pc-cta"
          href={href}
          onClick={onCtaClick}
          type={href ? undefined : "button"}
        >
          {ctaLabel}
        </CTA>
      </div>

      {bottomText && <span className="pc-bottom-text">{bottomText}</span>}
    </div>
  );
}