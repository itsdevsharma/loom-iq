import type { ReactNode } from 'react';

type SectionTone = 'white' | 'soft' | 'highlight' | 'dark';

export function SectionContainer({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`agency-container ${className}`.trim()}>{children}</div>;
}

export function SectionWrapper({ id, labelledBy, tone = 'white', className = '', containerClassName = '', children }: {
  id: string;
  labelledBy: string;
  tone?: SectionTone;
  className?: string;
  containerClassName?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={labelledBy} className={`agency-section-frame agency-tone-${tone} ${className}`.trim()}>
      <SectionContainer className={containerClassName}>{children}</SectionContainer>
    </section>
  );
}

export function SectionHeader({ id, eyebrow, title, description, className = '' }: {
  id: string;
  eyebrow: string;
  title: ReactNode;
  description: ReactNode;
  className?: string;
}) {
  return (
    <header className={`agency-section-heading ${className}`.trim()}>
      <div><p className="agency-kicker">{eyebrow}</p><h2 id={id}>{title}</h2></div>
      <p>{description}</p>
    </header>
  );
}
