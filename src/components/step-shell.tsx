import { ResourceLink } from "./resource-link";
import { Link } from "@tanstack/react-router";
import { AppPage } from "./app-shell";
import { useLang } from "../lib/lang";
import { useCorePath, useDemo } from "./demo";
import { useEffect, useRef } from "react";

/** On a phone, keeps a step's own Next or Finish button (and the message about it) pinned above the bottom menu,
 *  or above the keyboard while one is open. On a computer it sits in the card exactly as before. */
export function PinnedAction({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    const root = document.documentElement;
    if (!el) return;
    const vv = window.visualViewport;
    const coarse = window.matchMedia("(pointer: coarse)");
    const typing = () => {
      const a = document.activeElement as HTMLElement | null;
      if (!a) return false;
      if (a.isContentEditable || a.tagName === "TEXTAREA") return true;
      return a.tagName === "INPUT" && !["checkbox", "radio", "button", "submit", "file", "range", "color"].includes((a as HTMLInputElement).type);
    };
    let leave: ReturnType<typeof setTimeout> | undefined;
    const update = () => {
      root.style.setProperty("--cx-pin-h", `${Math.ceil(el.getBoundingClientRect().height)}px`);
      const kb = vv ? Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop)) : 0;
      root.style.setProperty("--cx-kb", `${kb}px`);
      if (kb > 80 || (coarse.matches && typing())) {
        clearTimeout(leave);
        root.setAttribute("data-cx-kb", "");
      } else if (root.hasAttribute("data-cx-kb")) {
        // Wait before moving the bar back above the menu, so a tap on Next that closes the keyboard still lands on it.
        clearTimeout(leave);
        leave = setTimeout(() => {
          const k = vv ? window.innerHeight - vv.height - vv.offsetTop : 0;
          if (!(k > 80 || (coarse.matches && typing()))) root.removeAttribute("data-cx-kb");
        }, 400);
      }
    };
    const ro = new ResizeObserver(update);
    ro.observe(el);
    vv?.addEventListener("resize", update);
    vv?.addEventListener("scroll", update);
    window.addEventListener("resize", update);
    document.addEventListener("focusin", update);
    const out = () => setTimeout(update, 50);
    document.addEventListener("focusout", out);
    update();
    el.dataset.ready = "1";
    return () => {
      ro.disconnect();
      clearTimeout(leave);
      vv?.removeEventListener("resize", update);
      vv?.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      document.removeEventListener("focusin", update);
      document.removeEventListener("focusout", out);
      root.removeAttribute("data-cx-kb");
      root.style.removeProperty("--cx-pin-h");
      root.style.removeProperty("--cx-kb");
    };
  }, []);
  return <div ref={ref} className={`cx-pin ${className}`} data-testid="pinned-action">{children}</div>;
}

const STEP_NAMES: [string, string][] = [["Job site", "Sitio del trabajo"], ["Equipment", "Equipo"], ["Work done", "Trabajo hecho"], ["Checks", "Revisiones"], ["Photos", "Fotos"]];

export function StepHead({ n, title }: { n: number; title: [string, string] }) {
  const { t } = useLang();
  return (
    <header className="cx-head">
      <div>
        <p className="cx-stepline" data-testid="step-label">
          <strong>{t(`Step ${n} of 5: ${STEP_NAMES[n - 1][0]}`, `Paso ${n} de 5: ${STEP_NAMES[n - 1][1]}`)}</strong>
        </p>
        <div role="progressbar" aria-label={t(`Step ${n} of 5`, `Paso ${n} de 5`)} aria-valuenow={n} aria-valuemin={0} aria-valuemax={5} className="mt-2">
          <ol className="cx-steps" aria-hidden>
            {STEP_NAMES.map((s, i) => <li key={i} className={i + 1 < n ? "done" : i + 1 === n ? "now" : ""}><span><span className="cx-sn">{i + 1}</span><span className="cx-sl">{t(s[0], s[1])}</span></span></li>)}
          </ol>
        </div>
      </div>
      <h1>{t(...title)}</h1>
    </header>
  );
}

export function StepShell({ n, title, sub, back, children, next, nextLabel, action, fixBar, onNext }: {
  n: number; title: [string, string]; sub: [string, string]; back: string; next?: string; nextLabel?: [string, string]; children: React.ReactNode;
  /** A step's own final action (and its feedback), pinned on a phone in place of a Next link. */
  action?: React.ReactNode;
  /** Set when the step was opened from a review draft: replaces Next and Back with Save to draft and Back to draft. */
  fixBar?: React.ReactNode;
  /** Return false to stop Next from leaving this step (the step shows its own message). */
  onNext?: () => boolean;
}) {
  const { t } = useLang();
  const p = useCorePath();
  const demo = useDemo();
  return (
    <AppPage bottom capture>
      <StepHead n={n} title={title} />
      <p className="cx-note">{t(...sub).split(" · ").slice(1).join(" · ") || t(...sub)}</p>
      <section className="cx-card">
        {children}
        {fixBar ? null : action ? <PinnedAction className="cx-pin-gap">{action}</PinnedAction> : null}
        {fixBar ? null : <div className="cx-actions">
          {next ? <PinnedAction><Link to={p(next)} className="ap-btn primary" onClick={(e) => { if (onNext && !onNext()) e.preventDefault(); }}>{t(...(nextLabel ?? ["Next", "Siguiente"]))}</Link></PinnedAction> : null}
          <Link to={p(back)} className="cx-back">{t("Back", "Atrás")}</Link>
        </div>}
      </section>
      {fixBar}
      <ResourceLink stage={(["setup", "equipment", "permit", "permit", "close_out"] as const)[n - 1]} />
      <p className="cx-note">{demo ? t("Practice screen with a sample job. Not connected to real permit filing.", "Pantalla de práctica con un trabajo de muestra. No está conectada a la presentación real de permisos.") : t("Not connected to real permit filing.", "No está conectada a la presentación real de permisos.")}</p>
    </AppPage>
  );
}

export const selectCls = "";
