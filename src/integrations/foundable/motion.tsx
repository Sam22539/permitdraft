// Foundable's movement parts for this website: a part that comes in as a visitor scrolls to it, and one that moves with
// the scroll. Each sends its words visible in the page the server sends, rests for a visitor who asks for reduced motion
// and has no look of its own. Foundable writes this file and replaces it whole, so never edit it.
import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useScroll, useTransform } from "motion/react";

const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Brings its children in, once, as a visitor scrolls to them: they rise `rise` pixels and fade in over `seconds`, after
 * `delay` seconds. The server sends them as they finally look, so they read with no script; once the page has loaded,
 * only a part still below the window is set back, to come in as its first pixel enters the window (a short last part
 * of a page included), or at once as the page is printed. It is a `div`: lay it out with `className`. It is the browser's own
 * observer and a CSS transition, so a page that only brings parts in loads no animation library.
 */
export function Reveal({ children, className, delay = 0, rise = 24, seconds = 0.6 }: { children: ReactNode; className?: string; delay?: number; rise?: number; seconds?: number }) {
  const part = useRef<HTMLDivElement>(null);
  // "sent": as the server sent it. "set": set back, below the window. "in": coming in, or in.
  const [state, setState] = useState<"sent" | "set" | "in">("sent");
  useEffect(() => {
    const element = part.current;
    // What a visitor already sees never blinks out: a part waits only where it is below the window as the page loads.
    if (!element || reduced() || element.getBoundingClientRect().top <= window.innerHeight) return;
    setState("set");
    const observer = new IntersectionObserver(entries => { if (entries.some(entry => entry.isIntersecting)) arrive(); });
    const arrive = () => { setState("in"); observer.disconnect(); };
    // A page printed before a part was reached prints it: shown at once on the element itself, since a print waits for
    // neither a render nor a transition.
    const print = () => { observer.disconnect(); element.style.removeProperty("opacity"); element.style.removeProperty("transform"); setState("sent"); };
    observer.observe(element);
    window.addEventListener("beforeprint", print);
    return () => { observer.disconnect(); window.removeEventListener("beforeprint", print); };
  }, []);
  const ease = `${seconds}s cubic-bezier(0.22, 1, 0.36, 1) ${delay}s`;
  const style = state === "sent" ? undefined : state === "set" ? { opacity: 0, transform: `translateY(${rise}px)` }
    : { opacity: 1, transform: "none", transition: `opacity ${ease}, transform ${ease}` };
  return <div ref={part} className={className} style={style}>{children}</div>;
}

/**
 * Moves its children with the scroll as they pass through the window: they drift `shift` pixels against it, and settle
 * from `scale` times their size to their own by the middle of the window. Nothing is ever hidden. It is a `div`: lay it
 * out with `className`, inside a box that hides overflow where a picture drifts.
 */
export function ScrollLinked({ children, className, shift = 40, scale = 1 }: { children: ReactNode; className?: string; shift?: number; scale?: number }) {
  const part = useRef<HTMLDivElement>(null);
  const [moves, setMoves] = useState(false);
  useEffect(() => { setMoves(!reduced()); }, []);
  const { scrollYProgress } = useScroll({ target: part, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [shift, -shift]);
  const size = useTransform(scrollYProgress, [0, 0.5], [scale, 1]);
  return <motion.div ref={part} className={className} style={moves ? { y, scale: size } : undefined}>{children}</motion.div>;
}
