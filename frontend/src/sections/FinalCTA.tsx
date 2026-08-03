import { useEffect, useRef } from "react";
import LogoImage from "../assets/company.logo.png";
type Particle = {
  x: number;
  y: number;
  dx: number;
  dy: number;
  size: number;
  alpha: number;
  targetAlpha: number;
};

function ParticlesBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return undefined;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return undefined;
    }

    let animationFrame = 0;
    const particles: Particle[] = [];
    const particleCount = 90;
    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) {
        return;
      }

      const width = parent.clientWidth;
      const height = parent.clientHeight;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      context.setTransform(1, 0, 0, 1, 0, 0);
      context.scale(dpr, dpr);

      particles.length = 0;

      for (let index = 0; index < particleCount; index += 1) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          dx: (Math.random() - 0.5) * 0.25,
          dy: (Math.random() - 0.5) * 0.25 - 0.08,
          size: Math.random() * 2 + 0.7,
          alpha: 0,
          targetAlpha: Math.random() * 0.18 + 0.04,
        });
      }
    };

    const draw = () => {
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;

      context.clearRect(0, 0, width, height);

      particles.forEach((particle) => {
        particle.x += particle.dx;
        particle.y += particle.dy;
        particle.alpha += (particle.targetAlpha - particle.alpha) * 0.02;

        if (particle.x < -10) {
          particle.x = width + 10;
        } else if (particle.x > width + 10) {
          particle.x = -10;
        }

        if (particle.y < -10) {
          particle.y = height + 10;
        } else if (particle.y > height + 10) {
          particle.y = -10;
        }

        context.beginPath();
        context.fillStyle = `rgba(85, 85, 85, ${particle.alpha})`;
        context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        context.fill();
      });

      animationFrame = window.requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      window.cancelAnimationFrame(animationFrame);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="final-cta-particles"
      aria-hidden="true"
    />
  );
}

function FinalCTA() {
  const cardRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const node = cardRef.current;
    if (!node) {
      return undefined;
    }

    const handlePointerMove = (event: PointerEvent) => {
      const bounds = node.getBoundingClientRect();
      const x = event.clientX - bounds.left;
      const y = event.clientY - bounds.top;

      node.style.setProperty("--final-cta-mouse-x", `${x}px`);
      node.style.setProperty("--final-cta-mouse-y", `${y}px`);
    };

    node.addEventListener("pointermove", handlePointerMove);

    return () => {
      node.removeEventListener("pointermove", handlePointerMove);
    };
  }, []);

  return (
    <section
      ref={cardRef}
      className="section final-cta section-shell final-cta-connect"
      id="final-cta"
    >
      <div className="final-cta-highlight" aria-hidden="true" />
      <div className="final-cta-frame">
        <ParticlesBackground />

        <div className="final-cta-visual" aria-hidden="true">
          <div className="final-cta-orbit-logo">
            <img
              src={LogoImage}
              alt="LoomIQ logo"
              className="final-cta-logo-image"
            />
          </div>

          <span className="final-cta-tag final-cta-tag-top-right">Sales</span>
          <span className="final-cta-tag final-cta-tag-left">Finance</span>
          <span className="final-cta-tag final-cta-tag-bottom-right">Ops</span>
          <span className="final-cta-tag final-cta-tag-bottom-left">
            Support
          </span>

          <div className="final-cta-pointer">
            <span className="final-cta-pointer-arrow">
              <svg
                viewBox="0 0 12 13"
                className="final-cta-pointer-icon"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M12 5.50676L0 0L2.83818 13L6.30623 7.86537L12 5.50676Z" />
              </svg>
            </span>
            <span className="final-cta-pointer-label">LoomIQ</span>
          </div>
        </div>

        <div className="final-cta-copy">
          <p className="eyebrow">Launch your stack</p>
          <h2>Ready to build a calmer operating system?</h2>
          <p>
            Bring sales, finance, operations, and service into one intelligent
            workspace your team can actually move in.
          </p>
          <div className="hero-actions final-cta-actions">
            <a href="#pricing" className="button button-primary">
              Get started
            </a>
            <a href="#showcase" className="button button-secondary">
              Book a demo
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export default FinalCTA;
