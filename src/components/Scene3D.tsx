import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function Scene3D() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let frame = 0;
    let disposed = false;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 0, 7);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
    } catch {
      host.dataset.webgl = "unavailable";
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setClearColor(0x000000, 0);
    host.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);

    const orb = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.05, 2),
      new THREE.MeshStandardMaterial({
        color: 0x3b9fc9,
        emissive: 0x123c58,
        emissiveIntensity: 1.2,
        metalness: 0.45,
        roughness: 0.28,
        wireframe: false
      })
    );
    group.add(orb);

    const shell = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.12, 1),
      new THREE.MeshBasicMaterial({ color: 0x8be4ff, wireframe: true, transparent: true, opacity: 0.2 })
    );
    group.add(shell);

    const ringMaterial = new THREE.MeshBasicMaterial({ color: 0x6bd7ff, transparent: true, opacity: 0.48 });
    const ringA = new THREE.Mesh(new THREE.TorusGeometry(1.72, 0.006, 8, 120), ringMaterial);
    ringA.rotation.set(1.05, 0.25, 0.2);
    group.add(ringA);
    const ringB = new THREE.Mesh(new THREE.TorusGeometry(1.48, 0.004, 8, 120), ringMaterial.clone());
    ringB.rotation.set(0.35, 1.15, 0.7);
    group.add(ringB);

    scene.add(new THREE.AmbientLight(0x9bcfff, 1.5));
    const keyLight = new THREE.PointLight(0x75dfff, 24, 12);
    keyLight.position.set(3, 3, 4);
    scene.add(keyLight);
    const fillLight = new THREE.PointLight(0x416bff, 12, 10);
    fillLight.position.set(-3, -2, 1);
    scene.add(fillLight);

    const resize = () => {
      const width = Math.max(host.clientWidth, 1);
      const height = Math.max(host.clientHeight, 1);
      camera.aspect = width / height;
      camera.position.z = width < 420 ? 8 : 7;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      renderer.render(scene, camera);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const animate = (time: number) => {
      if (disposed) return;
      const t = time * 0.00035;
      if (!reduceMotion) {
        orb.rotation.y = t;
        orb.rotation.x = Math.sin(t * 0.7) * 0.12;
        shell.rotation.y = -t * 0.7;
        ringA.rotation.z += 0.0007;
        ringB.rotation.x += 0.0005;
        group.position.y = Math.sin(t * 1.8) * 0.06;
      }
      renderer.render(scene, camera);
      frame = window.requestAnimationFrame(animate);
    };
    frame = window.requestAnimationFrame(animate);

    return () => {
      disposed = true;
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => material.dispose());
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <div className="scene3d" ref={hostRef} role="img" aria-label="Objet 3D lumineux animé représentant le noyau d’OREL">
      <div className="scene3d-fallback">OREL 3D</div>
      <span className="scene3d-label">CORE · LIVE RENDER</span>
    </div>
  );
}
