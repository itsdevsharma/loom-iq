import { useEffect, useRef } from "react";
import * as THREE from "three";

function HeroScene() {
  const sceneRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = sceneRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 1000);
    camera.position.set(0, 0, 18);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.domElement.style.display = "block";
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 1.4, 80);
    pointLight.position.set(12, 14, 16);
    scene.add(pointLight);

    const particles = new THREE.BufferGeometry();
    const count = 420;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i += 1) {
      const x = (Math.random() - 0.5) * 26;
      const y = (Math.random() - 0.5) * 18;
      const z = (Math.random() - 0.5) * 12;
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      colors[i * 3] = 0.48;
      colors[i * 3 + 1] = 0.18;
      colors[i * 3 + 2] = 0.95;
    }

    particles.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    particles.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const pointsMaterial = new THREE.PointsMaterial({
      size: 0.16,
      vertexColors: true,
      transparent: true,
      opacity: 0.72,
      depthWrite: false,
    });

    const pointCloud = new THREE.Points(particles, pointsMaterial);
    scene.add(pointCloud);

    const gridGeometry = new THREE.BoxGeometry(18, 10, 6, 18, 10, 6);
    const grid = new THREE.LineSegments(
      new THREE.WireframeGeometry(gridGeometry),
      new THREE.LineBasicMaterial({
        color: 0x7c3aed,
        opacity: 0.16,
        transparent: true,
      }),
    );
    scene.add(grid);

    let animationFrameId: number;

    const resizeRenderer = () => {
      if (container) {
        const width = container.clientWidth;
        const height = container.clientHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
      }
    };

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      pointCloud.rotation.y += 0.0022;
      pointCloud.rotation.x += 0.0008;
      grid.rotation.y -= 0.0018;
      grid.rotation.x += 0.0005;
      renderer.render(scene, camera);
    };

    const resizeObserver = new ResizeObserver(resizeRenderer);
    resizeObserver.observe(container);
    resizeRenderer();
    animate();

    return () => {
      resizeObserver.disconnect();
      cancelAnimationFrame(animationFrameId);
      renderer.dispose();
      particles.dispose();
      pointsMaterial.dispose();
      gridGeometry.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div className="hero-scene" ref={sceneRef} />;
}

export default HeroScene;
