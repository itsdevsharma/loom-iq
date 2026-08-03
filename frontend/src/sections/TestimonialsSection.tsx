import { useRef } from "react";

const testimonials = [
  {
    quote:
      "We replaced five tools and finally got one source of truth for growth and operations.",
    author: "Sarthak Sharma",
    role: "Founder, Nirvaan Metals",
    photo:
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80",
  },
  {
    quote:
      "The workflow feels premium, calm, and dramatically easier for every team to use.",
    author: "Ajay Kumar Sharma",
    role: "Founder, Sandeep Metal Udyog",
    photo:
      "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=200&q=80",
  },
  {
    quote:
      "The workflow feels premium, calm, and dramatically easier for every team to use.",
    author: "Ajay Kumar Sharma",
    role: "Founder, Sandeep Metal Udyog",
    photo:
      "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=200&q=80",
  },
];

function TestimonialsSection() {
  const testimonialRef = useRef<HTMLDivElement | null>(null);

  const scrollTestimonials = (distance: number) => {
    testimonialRef.current?.scrollBy({ left: distance, behavior: "smooth" });
  };

  return (
    <section id="testimonials" className="section section-shell section-testimonials">
      <div className="section-heading">
        <p className="eyebrow">Customer stories</p>
        <h2>Teams trust LoomIQ to keep momentum moving.</h2>
      </div>
      <div className="testimonial-wrapper">
        <button
          type="button"
          className="testimonial-arrow testimonial-arrow-left"
          aria-label="Scroll testimonials left"
          onClick={() => scrollTestimonials(-360)}
        >
          ←
        </button>
        <div className="testimonial-grid" ref={testimonialRef}>
          {testimonials.map((testimonial, index) => (
            <article key={`${testimonial.author}-${index}`} className="testimonial-card">
              <p>“{testimonial.quote}”</p>
              <div className="testimonial-footer">
                {testimonial.photo ? (
                  <img
                    className="testimonial-avatar"
                    src={testimonial.photo}
                    alt={`${testimonial.author} photo`}
                  />
                ) : (
                  <div className="testimonial-avatar fallback">
                    {testimonial.author
                      .split(" ")
                      .slice(0, 2)
                      .map((word) => word[0])
                      .join("")}
                  </div>
                )}
                <div className="testimonial-meta">
                  <strong>{testimonial.author}</strong>
                  <span>{testimonial.role}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
        <button
          type="button"
          className="testimonial-arrow testimonial-arrow-right"
          aria-label="Scroll testimonials right"
          onClick={() => scrollTestimonials(360)}
        >
          →
        </button>
      </div>
    </section>
  );
}

export default TestimonialsSection;
