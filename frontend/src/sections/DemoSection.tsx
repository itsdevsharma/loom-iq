import { trackEvent } from '../analytics';
import { useState } from "react";
import dashboardTour from "../assets/tour-dashboard.webp";
import inventoryTour from "../assets/tour-inventory.webp";
import masterDataTour from "../assets/tour-master-data.webp";
import salesVoucherTour from "../assets/tour-sales-voucher.webp";
import manufacturingTour from "../assets/tour-manufacturing.webp";
import { websitePricing } from '../websiteContent';

const tourSlides = [
  { title: "Dashboard", image: dashboardTour, alt: "LoomIQ dashboard showing sales, purchases, job work, reports and production activity" },
  { title: "Inventory", image: inventoryTour, alt: "LoomIQ inventory screen with product stock and barcode details" },
  { title: "Master data", image: masterDataTour, alt: "LoomIQ master data screen for managing products and factory records" },
  { title: "Sales voucher", image: salesVoucherTour, alt: "LoomIQ new sales voucher form" },
  { title: "Manufacturing", image: manufacturingTour, alt: "LoomIQ manufacturing workspace with bill of materials and production intelligence" },
];

export default function DemoSection({ general = false }: { general?: boolean }) {
  const [activeSlide, setActiveSlide] = useState(0);
  const activeTour = tourSlides[activeSlide];
  const starterPrice = `₹${websitePricing().Starter.recurring.toLocaleString('en-IN')}`;

  const moveSlide = (direction: -1 | 1) => setActiveSlide(current => (current + direction + tourSlides.length) % tourSlides.length);

  return <section id="showcase" className="section section-shell demo-section">
    <div className="demo-container">
      <div className="section-heading"><p className="eyebrow">Product tour</p><h2>{general ? 'Explore the workspace before choosing a plan.' : 'See what is happening across your factory and orders.'}</h2><p>{general ? 'Browse actual screens for stock, business records, sales and manufacturing. Open any screen at full size to inspect the details.' : 'Explore the LoomIQ operating view for customer orders, material stock, production progress, quality, dispatch and finance.'}</p></div>
      <div className="demo-layout">
        <div className="demo-screen" role="region" aria-label="Product tour slideshow">
          <div className="demo-topbar" aria-hidden="true"><span /><span /><span /></div>
          <div className="tour-viewport">
            <div className="tour-track" style={{ transform: `translateX(-${activeSlide * 100}%)` }}>
              {tourSlides.map(slide => <div className="tour-slide" key={slide.title} aria-hidden={slide.title !== activeTour.title}><img src={slide.image} alt={slide.alt} className="tour-image" draggable={false} loading="lazy" /></div>)}
            </div>
          </div>
          <div className="tour-controls">
            <button className="tour-arrow" type="button" onClick={() => { moveSlide(-1); trackEvent('erp_product_tour_view'); }} aria-label="Previous product tour screen">←</button>
            <div className="tour-dots" role="group" aria-label="Choose a product tour screen">
              {tourSlides.map((slide, index) => <button className={`tour-dot${index === activeSlide ? " is-active" : ""}`} type="button" key={slide.title} onClick={() => { setActiveSlide(index); trackEvent('erp_product_tour_view'); }} aria-pressed={index === activeSlide} aria-label={`Show ${slide.title}`}><span className="sr-only">{slide.title}</span></button>)}
            </div>
            <button className="tour-arrow" type="button" onClick={() => { moveSlide(1); trackEvent('erp_product_tour_view'); }} aria-label="Next product tour screen">→</button>
          </div>
        </div>
        <p className="demo-disclaimer">{activeTour.title} · Product interface preview with example data.</p>
      </div>
      <div className="preview-actions"><a className="button button-primary" href="#pricing">Compare plans from {starterPrice}/month</a><a href={activeTour.image} target="_blank" rel="noreferrer">Open {activeTour.title.toLowerCase()} full-size preview</a></div>
      <aside id="demo" className="demo-support"><h3>Need an Enterprise walkthrough?</h3><p>Talk to our team about multi-unit operations or a tailored implementation. Starter and Growth plans are also available to purchase directly online.</p></aside>
    </div>
  </section>;
}
