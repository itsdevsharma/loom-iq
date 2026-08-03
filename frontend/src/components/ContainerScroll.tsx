import { useEffect, useRef, useState, type ReactNode } from "react";

type ContainerScrollProps = {
  titleComponent?: ReactNode;
  children: ReactNode;
};

/**
 * A dependency-free equivalent of the scroll container treatment. Keeping the
 * animation here makes the dashboard easy to reuse without tying the landing
 * page to a particular animation library.
 */
function ContainerScroll({ titleComponent, children }: ContainerScrollProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotionPreference = () => setReducedMotion(mediaQuery.matches);
    updateMotionPreference();
    mediaQuery.addEventListener("change", updateMotionPreference);
    return () => mediaQuery.removeEventListener("change", updateMotionPreference);
  }, []);

  useEffect(() => {
    if (reducedMotion) return;

    let frame = 0;
    const updateTransform = () => {
      frame = 0;
      const container = containerRef.current;
      const card = cardRef.current;
      const header = headerRef.current;
      if (!container || !card) return;

      const bounds = container.getBoundingClientRect();
      const range = bounds.height + window.innerHeight;
      const progress = Math.min(1, Math.max(0, (window.innerHeight - bounds.top) / range));
      const isMobile = window.innerWidth <= 768;
      const scaleStart = isMobile ? 0.7 : 1.05;
      const scale = scaleStart + (1 - scaleStart) * progress;
      const rotate = 20 * (1 - progress);
      const lift = -100 * progress;

      card.style.transform = `perspective(1000px) rotateX(${rotate}deg) scale(${scale})`;
      if (header) header.style.transform = `translateY(${lift}px)`;
    };
    const requestUpdate = () => {
      if (!frame) frame = window.requestAnimationFrame(updateTransform);
    };

    updateTransform();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    return () => {
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [reducedMotion]);

  return (
    <div className="container-scroll" ref={containerRef}>
      <div className="container-scroll-sticky">
        {titleComponent && (
          <div className="container-scroll-header" ref={headerRef}>
            {titleComponent}
          </div>
        )}
        <div className="container-scroll-card" ref={cardRef}>
          <div className="container-scroll-content">{children}</div>
        </div>
      </div>
    </div>
  );
}

export default ContainerScroll;
