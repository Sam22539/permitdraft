// Foundable's 3D stage for this website: a real-time scene in a box, drawn with three. It starts only where the browser
// can draw it, shows a picture until it does and where it cannot, lights the scene, sizes it to its box, draws only while
// it is on screen, stays still for a visitor who asks for reduced motion and frees everything when the page leaves it.
// Foundable writes this file and replaces it whole, so never edit it.
import { useEffect, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

/** What `build` is handed: three itself, the scene to add to, its camera and renderer, whether the visitor asked for stillness, and `draw`, which draws one frame now (after a visitor's drag changes a still scene). */
export type Stage = { THREE: typeof THREE; scene: THREE.Scene; camera: THREE.PerspectiveCamera; renderer: THREE.WebGLRenderer; canvas: HTMLCanvasElement; still: boolean; draw: () => void };
/** One frame: seconds since the last and since the first, and how far the box has passed through the window, from 0 (entering at the bottom) to 1 (gone at the top). */
export type Frame = { delta: number; elapsed: number; scroll: number };

/** A theme colour as three reads it: the value of a CSS variable such as `--primary`, whatever notation the theme writes it in. */
export function themeColour(variable: string): THREE.Color {
  const value = getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
  const pixel = document.createElement("canvas");
  pixel.width = pixel.height = 1;
  const paint = pixel.getContext("2d", { willReadFrequently: true });
  if (!value || !paint) return new THREE.Color();
  paint.fillStyle = value;
  paint.fillRect(0, 0, 1, 1);
  const [red = 255, green = 255, blue = 255] = paint.getImageData(0, 0, 1, 1).data;
  return new THREE.Color().setRGB(red / 255, green / 255, blue / 255, THREE.SRGBColorSpace);
}

/**
 * A 3D scene in a box. `build` adds your objects to the scene, once, and may return what changes each frame. `fallback`
 * is the picture shown until the scene first draws and wherever it cannot; `label` says what the scene shows, for a
 * visitor who cannot see it. Size the box with `className`.
 */
export function Stage3D({ build, fallback, label, className }: { build: (stage: Stage) => void | ((frame: Frame) => void); fallback: ReactNode; label: string; className?: string }) {
  const box = useRef<HTMLDivElement>(null), surface = useRef<HTMLCanvasElement>(null);
  const [drawn, setDrawn] = useState(false);
  const made = useRef(build);
  made.current = build;
  useEffect(() => {
    const holder = box.current, canvas = surface.current;
    if (!holder || !canvas || !document.createElement("canvas").getContext("webgl2")) return;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); } catch { return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.NeutralToneMapping;
    const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    camera.position.set(0, 0, 5);
    const lights = new THREE.PMREMGenerator(renderer), room = new RoomEnvironment(), lit = lights.fromScene(room, 0.04);
    scene.environment = lit.texture;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = new THREE.Timer();
    timer.connect(document);
    let elapsed = 0, shown = false;
    const scroll = () => {
      const at = holder.getBoundingClientRect(), tall = window.innerHeight;
      return Math.min(1, Math.max(0, (tall - at.top) / (tall + at.height)));
    };
    const draw = () => {
      renderer.render(scene, camera);
      if (!shown) { shown = true; setDrawn(true); }
    };
    const each = made.current({ THREE, scene, camera, renderer, canvas, still, draw });
    const fit = () => {
      const { width, height } = holder.getBoundingClientRect();
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      draw();
    };
    const tick = (time: number) => {
      timer.update(time);
      const delta = timer.getDelta();
      elapsed += delta;
      each?.({ delta, elapsed, scroll: scroll() });
      draw();
    };
    each?.({ delta: 0, elapsed: 0, scroll: scroll() });
    const sized = new ResizeObserver(fit);
    sized.observe(holder);
    fit();
    const watched = new IntersectionObserver((entries) => renderer.setAnimationLoop(entries.some(entry => entry.isIntersecting) && !still ? tick : null));
    watched.observe(holder);
    return () => {
      renderer.setAnimationLoop(null);
      watched.disconnect();
      sized.disconnect();
      timer.dispose();
      scene.traverse((object) => {
        const mesh = object as THREE.Mesh;
        mesh.geometry?.dispose();
        for (const material of [mesh.material].flat()) {
          if (!material) continue;
          for (const value of Object.values(material)) if (value instanceof THREE.Texture) value.dispose();
          material.dispose();
        }
      });
      lit.dispose();
      lights.dispose();
      room.dispose();
      renderer.dispose();
    };
  }, []);
  return (
    <div ref={box} role="img" aria-label={label} className={className} style={{ position: "relative" }}>
      <div aria-hidden style={{ position: "absolute", inset: 0, opacity: drawn ? 0 : 1 }}>{fallback}</div>
      <canvas ref={surface} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: drawn ? 1 : 0 }} />
    </div>
  );
}
