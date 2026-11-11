import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function Scene3D() {
  const hostRef = useRef<HTMLDivElement>(null);
import type { HandPointer } from "../lib/gestures";

type Props = { handControl?: HandPointer };

export default function Scene3D({ handControl }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const handControlRef = useRef<HandPointer | undefined>(handControl);

  useEffect(() => { handControlRef.current = handControl; }, [handControl]);

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
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      host.textContent = "WebGL n'est pas disponible sur cet appareil.";
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
    renderer.setSize(host.clientWidth || 640, host.clientHeight || 320);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(
      38,
      (host.clientWidth || 640) / (host.clientHeight || 320),
      0.1,
      100
    );
    camera.position.set(0, 0.25, 6);

    const coreGeometry = new THREE.IcosahedronGeometry(1.05, 2);
    const coreMaterial = new THREE.MeshStandardMaterial({
      color: 0x75dfff,
      metalness: 0.72,
      roughness: 0.22,
      wireframe: true
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    scene.add(core);

    const inner = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.72, 1),
      new THREE.MeshStandardMaterial({
        color: 0x183c5b,
        emissive: 0x0b4564,
        emissiveIntensity: 0.8,
        metalness: 0.55,
        roughness: 0.3
      })
    );
    scene.add(inner);

    const ringMaterial = new THREE.MeshStandardMaterial({
      color: 0x6bdcff,
      metalness: 0.8,
      roughness: 0.25,
      emissive: 0x123e5b,
      emissiveIntensity: 0.45
    });
    const ringA = new THREE.Mesh(new THREE.TorusGeometry(1.48, 0.012, 8, 120), ringMaterial);
    ringA.rotation.x = 1.12;
    ringA.rotation.y = 0.3;
    scene.add(ringA);

    const ringB = new THREE.Mesh(new THREE.TorusGeometry(1.7, 0.008, 8, 120), ringMaterial.clone());
    ringB.rotation.x = -0.78;
    ringB.rotation.y = -0.4;
    scene.add(ringB);

    scene.add(new THREE.AmbientLight(0x9bc9e8, 1.4));
    const keyLight = new THREE.PointLight(0x75dfff, 28, 20);
    keyLight.position.set(3, 3, 4);
    scene.add(keyLight);
    const fillLight = new THREE.PointLight(0x3566ff, 16, 18);
    fillLight.position.set(-3, -2, 2);
    scene.add(fillLight);

    const starGeometry = new THREE.BufferGeometry();
    const starPositions = new Float32Array(240 * 3);
    for (let i = 0; i < starPositions.length; i += 3) {
      starPositions[i] = (Math.random() - 0.5) * 8;
      starPositions[i + 1] = (Math.random() - 0.5) * 5;
      starPositions[i + 2] = (Math.random() - 0.5) * 4 - 1;
    }
    starGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
    const stars = new THREE.Points(
      starGeometry,
      new THREE.PointsMaterial({ color: 0x6dcfff, size: 0.018, transparent: true, opacity: 0.65 })
    );
    scene.add(stars);

    const targetScale = new THREE.Vector3(1, 1, 1);
    let frame = 0;
    let animationId = 0;
    const animate = () => {
      animationId = window.requestAnimationFrame(animate);
      frame += 0.006;
      const control = handControlRef.current;
      if (control?.active) {
        core.rotation.y = THREE.MathUtils.lerp(core.rotation.y, (0.5 - control.x) * 2.4, 0.12);
        core.rotation.x = THREE.MathUtils.lerp(core.rotation.x, (control.y - 0.5) * 1.8, 0.12);
        targetScale.setScalar(control.gesture === "pinch" ? 1.24 : 1);
        core.scale.lerp(targetScale, 0.12);
      } else {
        core.rotation.x += 0.0018;
        core.rotation.y += 0.003;
        targetScale.setScalar(1);
        core.scale.lerp(targetScale, 0.08);
      }
      inner.rotation.y -= 0.002;
      ringA.rotation.z += 0.0018;
      ringB.rotation.z -= 0.0012;
      stars.rotation.y = Math.sin(frame * 0.35) * 0.08;
      renderer.render(scene, camera);
    };
    animate();

    const resizeObserver = new ResizeObserver(() => {
      const width = host.clientWidth;
      const height = host.clientHeight;
      if (!width || !height) return;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    });
    resizeObserver.observe(host);

    return () => {
      window.cancelAnimationFrame(animationId);
      resizeObserver.disconnect();
      coreGeometry.dispose();
      coreMaterial.dispose();
      inner.geometry.dispose();
      (inner.material as THREE.Material).dispose();
      ringA.geometry.dispose();
      ringMaterial.dispose();
      ringB.geometry.dispose();
      (ringB.material as THREE.Material).dispose();
      starGeometry.dispose();
      (stars.material as THREE.Material).dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <div className="scene3d" ref={hostRef} role="img" aria-label="Objet 3D lumineux animé représentant le noyau d’OREL">
      <div className="scene3d-fallback">OREL 3D</div>
      <span className="scene3d-label">CORE · LIVE RENDER</span>
    </div>
    <div
      ref={hostRef}
      className="scene3d"
      role="img"
      aria-label="Noyau spatial 3D animé d'OREL"
      style={{ width: "100%", height: "320px", minHeight: "240px", overflow: "hidden", borderRadius: "12px" }}
    />
  );
}
