import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Maximize2, Minus, Plus, RotateCcw, X } from "lucide-react";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Button } from "./ui/button";
import { Image } from "../image";
import { useLang } from "../lib/lang";
import "../photo-viewer.css";

const MIN = 1;
const MAX = 5;
const STEP = 1.5;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

type Props = {
  src: string;
  alt: string;
  /** The caption the evidence already shows, repeated under the full-screen photo. */
  caption: ReactNode;
  testId: string;
  width?: number;
  height?: number;
};

/**
 * An evidence thumbnail that opens the original photo full screen: zoom buttons, drag to pan, pinch on a phone, wheel on
 * a computer, +/-/0 and arrow keys. Escape or Close returns focus to the thumbnail, so the reader is back on the same
 * evidence.
 */
export function PhotoViewer({ src, alt, caption, testId, width = 240, height = 240 }: Props) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState({ s: 1, x: 0, y: 0 });
  const stage = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const lastTap = useRef(0);

  const fit = useCallback((s: number, x: number, y: number) => {
    const el = stage.current;
    const w = el?.clientWidth ?? 0, h = el?.clientHeight ?? 0;
    const mx = ((s - 1) * w) / 2, my = ((s - 1) * h) / 2;
    return { s, x: clamp(x, -mx, mx), y: clamp(y, -my, my) };
  }, []);

  // Zoom about a point given in the stage's own coordinates from its centre, so what is under the finger stays there.
  const zoomTo = useCallback((next: number, cx = 0, cy = 0) => {
    setView((v) => {
      const s = clamp(next, MIN, MAX);
      const k = s / v.s;
      return fit(s, cx - (cx - v.x) * k, cy - (cy - v.y) * k);
    });
  }, [fit]);
  const zoomBy = useCallback((f: number) => setView((v) => {
    const s = clamp(v.s * f, MIN, MAX);
    const k = s / v.s;
    return fit(s, v.x * k, v.y * k);
  }), [fit]);
  const reset = () => setView({ s: 1, x: 0, y: 0 });

  useEffect(() => { if (!open) { reset(); pointers.current.clear(); } }, [open]);

  const local = (e: { clientX: number; clientY: number }) => {
    const r = stage.current!.getBoundingClientRect();
    return { x: e.clientX - r.left - r.width / 2, y: e.clientY - r.top - r.height / 2 };
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (e.pointerType !== "mouse" && pointers.current.size === 1) {
      const now = Date.now();
      if (now - lastTap.current < 300) {
        const p = local(e);
        if (view.s > 1) reset(); else zoomTo(2.5, p.x, p.y);
        lastTap.current = 0;
      } else lastTap.current = now;
    }
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const map = pointers.current;
    const prev = map.get(e.pointerId);
    if (!prev) return;
    if (map.size === 2) {
      const [a, b] = [...map.entries()];
      const other = a[0] === e.pointerId ? b[1] : a[1];
      const before = Math.hypot(prev.x - other.x, prev.y - other.y);
      const after = Math.hypot(e.clientX - other.x, e.clientY - other.y);
      map.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (before > 0) {
        const mid = local({ clientX: (e.clientX + other.x) / 2, clientY: (e.clientY + other.y) / 2 });
        setView((v) => {
          const s = clamp(v.s * (after / before), MIN, MAX);
          const k = s / v.s;
          return fit(s, mid.x - (mid.x - v.x) * k, mid.y - (mid.y - v.y) * k);
        });
      }
      return;
    }
    const dx = e.clientX - prev.x, dy = e.clientY - prev.y;
    map.set(e.pointerId, { x: e.clientX, y: e.clientY });
    setView((v) => (v.s > 1 ? fit(v.s, v.x + dx, v.y + dy) : v));
  };
  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => { pointers.current.delete(e.pointerId); };

  const onWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const p = local(e);
    setView((v) => {
      const s = clamp(v.s * (e.deltaY < 0 ? 1.15 : 1 / 1.15), MIN, MAX);
      const k = s / v.s;
      return fit(s, p.x - (p.x - v.x) * k, p.y - (p.y - v.y) * k);
    });
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const pan = 60;
    if (e.key === "+" || e.key === "=") { e.preventDefault(); zoomBy(STEP); }
    else if (e.key === "-" || e.key === "_") { e.preventDefault(); zoomBy(1 / STEP); }
    else if (e.key === "0") { e.preventDefault(); reset(); }
    else if (view.s > 1 && e.key.startsWith("Arrow")) {
      e.preventDefault();
      const dx = e.key === "ArrowLeft" ? pan : e.key === "ArrowRight" ? -pan : 0;
      const dy = e.key === "ArrowUp" ? pan : e.key === "ArrowDown" ? -pan : 0;
      setView((v) => fit(v.s, v.x + dx, v.y + dy));
    }
  };

  const pct = Math.round(view.s * 100);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button type="button" className="pv-thumb" data-testid={`${testId}-open`} aria-label={t(`Enlarge photo: ${alt}`, `Ampliar foto: ${alt}`)}>
          <Image src={src} alt={alt} width={width} height={height} />
          <span className="pv-hint" aria-hidden="true"><Maximize2 /> {t("Tap to enlarge", "Toque para ampliar")}</span>
        </button>
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className="pv-dialog top-0 left-0 flex h-dvh w-screen max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-none border-0 p-0 sm:max-w-none data-[state=open]:zoom-in-100 data-[state=closed]:zoom-out-100"
        data-testid={`${testId}-viewer`}
        onKeyDown={onKeyDown}
        aria-describedby={`${testId}-cap`}
      >
        <div className="pv-bar">
          <DialogTitle className="pv-title">{alt}</DialogTitle>
          <div className="pv-tools" role="group" aria-label={t("Zoom controls", "Controles de zoom")}>
            <Button type="button" variant="secondary" size="icon" className="pv-tool" onClick={() => zoomBy(1 / STEP)} disabled={view.s <= MIN} aria-label={t("Zoom out", "Alejar")} data-testid={`${testId}-zoom-out`}><Minus /></Button>
            <output className="pv-pct" aria-live="polite" data-testid={`${testId}-zoom-level`}>{pct}%</output>
            <Button type="button" variant="secondary" size="icon" className="pv-tool" onClick={() => zoomBy(STEP)} disabled={view.s >= MAX} aria-label={t("Zoom in", "Acercar")} data-testid={`${testId}-zoom-in`}><Plus /></Button>
            <Button type="button" variant="secondary" size="icon" className="pv-tool" onClick={reset} disabled={view.s === 1} aria-label={t("Reset zoom", "Restablecer zoom")} data-testid={`${testId}-zoom-reset`}><RotateCcw /></Button>
            <DialogClose asChild>
              <Button type="button" variant="secondary" className="pv-tool pv-close" data-testid={`${testId}-close`}><X /> {t("Close", "Cerrar")}</Button>
            </DialogClose>
          </div>
        </div>
        <div
          ref={stage}
          className="pv-stage"
          style={{ cursor: view.s > 1 ? "grab" : "zoom-in" }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onWheel={onWheel}
          onDoubleClick={(e) => { if (view.s > 1) reset(); else { const p = local(e); zoomTo(2.5, p.x, p.y); } }}
        >
          {/* The original photo, never a resized copy. */}
          <Image
            src={src}
            alt={alt}
            width={1600}
            height={1200}
            priority
            draggable={false}
            className="pv-img"
            data-testid={`${testId}-full`}
            style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.s})` }}
          />
        </div>
        <DialogDescription asChild>
          <div id={`${testId}-cap`} className="pv-cap">
            {caption}
            <p className="pv-help">{t("Pinch or use + and − to zoom; drag to move around. Escape closes.", "Pellizque o use + y − para hacer zoom; arrastre para moverse. Escape cierra.")}</p>
          </div>
        </DialogDescription>
      </DialogContent>
    </Dialog>
  );
}
