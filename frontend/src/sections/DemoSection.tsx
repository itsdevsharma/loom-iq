import { useEffect, useState } from "react";
import dashboardTour from "../assets/tour-dashboard.png";
import inventoryTour from "../assets/tour-inventory.png";
import masterDataTour from "../assets/tour-master-data.png";
import salesVoucherTour from "../assets/tour-sales-voucher.png";
import manufacturingTour from "../assets/tour-manufacturing.png";

const tourSlides = [
  { title: "Dashboard", image: dashboardTour, alt: "LoomIQ dashboard showing sales, purchases, job work, reports and production activity" },
  { title: "Inventory", image: inventoryTour, alt: "LoomIQ inventory screen with product stock and barcode details" },
  { title: "Master data", image: masterDataTour, alt: "LoomIQ master data screen for managing products and factory records" },
  { title: "Sales voucher", image: salesVoucherTour, alt: "LoomIQ new sales voucher form" },
  { title: "Manufacturing", image: manufacturingTour, alt: "LoomIQ manufacturing workspace with bill of materials and production intelligence" },
];

export default function DemoSection() {
  const [activeSlide, setActiveSlide] = useState(0);
  const activeTour = tourSlides[activeSlide];

  useEffect(() => {
    const timer = window.setInterval(() => setActiveSlide(current => (current + 1) % tourSlides.length), 5000);
    return () => window.clearInterval(timer);
  }, []);

  const moveSlide = (direction: -1 | 1) => setActiveSlide(current => (current + direction + tourSlides.length) % tourSlides.length);

  return <section id="showcase" className="section section-shell demo-section">
    <div className="demo-container">
      <div className="section-heading"><p className="eyebrow">Product tour</p><h2>See what is happening across your factory and orders.</h2><p>Explore the LoomIQ operating view for customer orders, material stock, production progress, quality, dispatch and finance.</p></div>
      <div className="demo-layout">
        <div className="demo-screen" role="region" aria-label="Product tour slideshow">
          <div className="demo-topbar" aria-hidden="true"><span /><span /><span /></div>
          <div className="tour-viewport">
            <div className="tour-track" style={{ transform: `translateX(-${activeSlide * 100}%)` }}>
              {tourSlides.map(slide => <div className="tour-slide" key={slide.title} aria-hidden={slide.title !== activeTour.title}><img src={slide.image} alt={slide.alt} className="tour-image" draggable={false} loading="lazy" /></div>)}
            </div>
          </div>
          <div className="tour-controls">
            <button className="tour-arrow" type="button" onClick={() => moveSlide(-1)} aria-label="Previous product tour screen">←</button>
            <div className="tour-dots" role="tablist" aria-label="Choose a product tour screen">
              {tourSlides.map((slide, index) => <button className={`tour-dot${index === activeSlide ? " is-active" : ""}`} type="button" key={slide.title} onClick={() => setActiveSlide(index)} role="tab" aria-selected={index === activeSlide} aria-label={`Show ${slide.title}`}><span className="sr-only">{slide.title}</span></button>)}
            </div>
            <button className="tour-arrow" type="button" onClick={() => moveSlide(1)} aria-label="Next product tour screen">→</button>
          </div>
        </div>
        <p className="demo-disclaimer">{activeTour.title} · Product interface preview with example data.</p>
      </div>
      <div className="preview-actions"><a className="button button-primary" href="#pricing">Start Using LoomIQ — ₹1,990/month</a><a href={activeTour.image} target="_blank" rel="noreferrer">Open {activeTour.title.toLowerCase()} full-size preview ↗</a></div>
      <aside id="demo" className="demo-support"><h3>Need an Enterprise walkthrough?</h3><p>Demos and WhatsApp conversations are available for hesitant buyers and Enterprise teams. You can purchase Starter or Growth online without booking a demo.</p></aside>
    </div>
  </section>;
}
