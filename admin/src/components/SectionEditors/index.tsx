import React from 'react'
import type { SectionInput } from '../../types/content'

interface HeroProps {
  section: SectionInput
  onChange: (patch: Partial<SectionInput['props']>) => void
}

export function HeroEditor({ section, onChange }: HeroProps) {
  const p = section.props as Record<string, any>
  return (
    <div className="section-editor-cells">
      <div><label>Headline</label><input value={p.headline ?? ''} onChange={e => onChange({ headline: e.target.value })} /></div>
      <div><label>Subheadline</label><textarea rows={3} value={p.subheadline ?? ''} onChange={e => onChange({ subheadline: e.target.value })} /></div>
      <div className="props">
        <div><label>CTA text</label><input value={p.ctaText ?? ''} onChange={e => onChange({ ctaText: e.target.value })} /></div>
        <div><label>CTA link</label><input value={p.ctaLink ?? ''} onChange={e => onChange({ ctaLink: e.target.value })} /></div>
      </div>
    </div>
  )
}

interface FeaturesProps {
  section: SectionInput
  onChange: (patch: Partial<SectionInput['props']>) => void
}

export function FeaturesEditor({ section, onChange }: FeaturesProps) {
  const p = section.props as Record<string, any>
  const items = Array.isArray(p.items) ? p.items : []
  function addItem() {
    onChange({ items: [...items, { title: '', description: '' }] })
  }
  function updateItem(i: number, field: string, value: string) {
    const next = items.map((it: any, idx: number) => idx === i ? { ...it, [field]: value } : it)
    onChange({ items: next })
  }
  function removeItem(i: number) {
    onChange({ items: items.filter((_: any, idx: number) => idx !== i) })
  }
  return (
    <div className="section-editor-cells">
      <div className="chip-row">
        {items.map((it: any, i: number) => (
          <span className="chip" key={i}>
            <span>{it.title || 'Item ' + (i + 1)}</span>
            <button type="button" onClick={() => removeItem(i)}>×</button>
          </span>
        ))}
        <button type="button" onClick={addItem}>+ Add feature</button>
      </div>
      {items.map((it: any, i: number) => (
        <div key={i} className="props" style={{ marginTop: 8, padding: '8px 10px', background: '#fafbfc', borderRadius: 6 }}>
          <div><label>Title</label><input value={it.title ?? ''} onChange={e => updateItem(i, 'title', e.target.value)} /></div>
          <div><label>Description</label><textarea rows={2} value={it.description ?? ''} onChange={e => updateItem(i, 'description', e.target.value)} /></div>
        </div>
      ))}
    </div>
  )
}

interface TestimonialsProps {
  section: SectionInput
  onChange: (patch: Partial<SectionInput['props']>) => void
}

export function TestimonialsEditor({ section, onChange }: TestimonialsProps) {
  const p = section.props as Record<string, any>
  const entries = Array.isArray(p.entries) ? p.entries : []
  function addEntry() {
    onChange({ entries: [...entries, { quote: '', who: '' }] })
  }
  function updateEntry(i: number, field: string, value: string) {
    const next = entries.map((it: any, idx: number) => idx === i ? { ...it, [field]: value } : it)
    onChange({ entries: next })
  }
  function removeEntry(i: number) {
    onChange({ entries: entries.filter((_: any, idx: number) => idx !== i) })
  }
  return (
    <div className="section-editor-cells">
      <div className="chip-row">
        {entries.map((it: any, i: number) => (
          <span className="chip" key={i}>
            <span>{it.who || 'Quote ' + (i + 1)}</span>
            <button type="button" onClick={() => removeEntry(i)}>×</button>
          </span>
        ))}
        <button type="button" onClick={addEntry}>+ Add testimonial</button>
      </div>
      {entries.map((it: any, i: number) => (
        <div key={i} className="props" style={{ marginTop: 8, padding: '8px 10px', background: '#fafbfc', borderRadius: 6 }}>
          <div style={{ gridColumn: '1 / -1' }}><label>Quote</label><textarea rows={2} value={it.quote ?? ''} onChange={e => updateEntry(i, 'quote', e.target.value)} /></div>
          <div><label>Name / role</label><input value={it.who ?? ''} onChange={e => updateEntry(i, 'who', e.target.value)} /></div>
        </div>
      ))}
    </div>
  )
}

interface RichtextProps {
  section: SectionInput
  onChange: (patch: Partial<SectionInput['props']>) => void
}

export function RichtextEditor({ section, onChange }: RichtextProps) {
  const p = section.props as Record<string, any>
  return (
    <div className="section-editor-cells">
      <div className="props full"><label>Body</label><textarea rows={6} value={p.body ?? ''} onChange={e => onChange({ body: e.target.value })} /></div>
    </div>
  )
}

interface CtaProps {
  section: SectionInput
  onChange: (patch: Partial<SectionInput['props']>) => void
}

export function CtaEditor({ section, onChange }: CtaProps) {
  const p = section.props as Record<string, any>
  return (
    <div className="section-editor-cells">
      <div className="props full"><label>Label</label><input value={p.label ?? ''} onChange={e => onChange({ label: e.target.value })} /></div>
      <div className="props">
        <div><label>Link</label><input value={p.link ?? ''} onChange={e => onChange({ link: e.target.value })} /></div>
        <div><label>Link text</label><input value={p.linkText ?? ''} onChange={e => onChange({ linkText: e.target.value })} /></div>
        <div><label>Background color</label><input type="color" value={p.backgroundColor ?? '#0b1220'} onChange={e => onChange({ backgroundColor: e.target.value })} /></div>
      </div>
    </div>
  )
}

interface FaqProps {
  section: SectionInput
  onChange: (patch: Partial<SectionInput['props']>) => void
}

export function FaqEditor({ section, onChange }: FaqProps) {
  const p = section.props as Record<string, any>
  const items = Array.isArray(p.items) ? p.items : []
  function addItem() {
    onChange({ items: [...items, { question: '', answer: '' }] })
  }
  function updateItem(i: number, field: string, value: string) {
    const next = items.map((it: any, idx: number) => idx === i ? { ...it, [field]: value } : it)
    onChange({ items: next })
  }
  function removeItem(i: number) {
    onChange({ items: items.filter((_: any, idx: number) => idx !== i) })
  }
  return (
    <div className="section-editor-cells">
      <div className="chip-row">
        {items.map((it: any, i: number) => (
          <span className="chip" key={i}>
            <span>{it.question || 'FAQ ' + (i + 1)}</span>
            <button type="button" onClick={() => removeItem(i)}>×</button>
          </span>
        ))}
        <button type="button" onClick={addItem}>+ Add question</button>
      </div>
      {items.map((it: any, i: number) => (
        <div key={i} className="props full" style={{ marginTop: 8, padding: '8px 10px', background: '#fafbfc', borderRadius: 6 }}>
          <div><label>Question</label><input value={it.question ?? ''} onChange={e => updateItem(i, 'question', e.target.value)} /></div>
          <div><label>Answer</label><textarea rows={2} value={it.answer ?? ''} onChange={e => updateItem(i, 'answer', e.target.value)} /></div>
        </div>
      ))}
    </div>
  )
}

const EDITORS: Record<string, React.ComponentType<HeroProps | FeaturesProps | TestimonialsProps | RichtextProps | CtaProps | FaqProps>> = {
  hero: HeroEditor,
  features: FeaturesEditor,
  testimonials: TestimonialsEditor,
  richtext: RichtextEditor,
  cta: CtaEditor,
  faq: FaqEditor,
}

export function SectionEditor({ section, onChange }: { section: SectionInput; onChange: (patch: Partial<SectionInput['props']>) => void }) {
  const Editor = EDITORS[section.type] ?? null
  if (!Editor) return <div className="section-editor-cells"><div className="section-empty">Section type “{section.type}” is read-only in this editor.</div></div>
  return <Editor section={section} onChange={onChange} />
}

/* Section renderers for the preview iframe */
export function renderSections(sections: SectionInput[]) {
  return sections.map((s: SectionInput) => {
    const p = s.props as Record<string, any>
    switch (s.type) {
      case 'hero':
        return (
          <section key={s.id} className="sec-hero">
            <h1>{p.headline ?? ''}</h1>
            {(p.subheadline ?? '') && <p>{p.subheadline}</p>}
            {p.ctaText && <a className="btn" href={p.ctaLink ?? '#'}>{p.ctaText}</a>}
          </section>
        )
      case 'features':
        return (
          <section key={s.id} className="sec-features">
            {(Array.isArray(p.items) ? p.items : []).map((it: any, i: number) => (
              <div key={i} className="fcard">
                <h3>{it.title ?? ''}</h3>
                {(it.description ?? '') && <p>{it.description}</p>}
              </div>
            ))}
          </section>
        )
      case 'testimonials':
        return (
          <section key={s.id} className="sec-testimonials">
            {(Array.isArray(p.entries) ? p.entries : []).map((it: any, i: number) => (
              <div key={i} className="tcard">
                <p>{it.quote ?? ''}</p>
                {(it.who ?? '') && <div className="who">{it.who}</div>}
              </div>
            ))}
          </section>
        )
      case 'richtext':
        return <section key={s.id} className="sec-richtext">{p.body ?? ''}</section>
      case 'cta':
        return (
          <section key={s.id} className="sec-cta" style={p.backgroundColor ? { backgroundColor: p.backgroundColor } : undefined}>
            <div className="label">{p.label ?? ''}</div>
            {p.link && <a className="btn" href={p.link}>{p.linkText ?? 'Learn more'}</a>}
          </section>
        )
      case 'faq':
        return (
          <section key={s.id} className="sec-faq">
            {(Array.isArray(p.items) ? p.items : []).map((it: any, i: number) => (
              <div key={i} className="faq-item">
                <div className="q">{it.question ?? ''}</div>
                {(it.answer ?? '') && <div className="a">{it.answer}</div>}
              </div>
            ))}
          </section>
        )
      default:
        return <section key={s.id} style={{ padding: 16, background: '#f3f4fb', borderRadius: 8 }}>Section type “{s.type}” (preview not available)</section>
    }
  })
}
