const testimonials = [
  {
    quote:
      "We replaced five tools and finally got one source of truth for growth and operations.",
    author: "Maya Chen",
    role: "VP Revenue, Northstar Labs",
  },
  {
    quote:
      "The workflow feels premium, calm, and dramatically easier for every team to use.",
    author: "Darren Brooks",
    role: "Founder, Brightlane",
  },
];

function TestimonialsSection() {
  return (
    <section className="section section-shell section-testimonials">
      <div className="section-heading">
        <p className="eyebrow">Customer stories</p>
        <h2>Teams trust LoomIQ to keep momentum moving.</h2>
      </div>
      <div className="testimonial-grid">
        {testimonials.map((testimonial) => (
          <article key={testimonial.author} className="testimonial-card">
            <p>“{testimonial.quote}”</p>
            <strong>{testimonial.author}</strong>
            <span>{testimonial.role}</span>
          </article>
        ))}
      </div>
    </section>
  );
}

export default TestimonialsSection;
