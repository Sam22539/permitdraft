/**
 * PermitDraft redesign building blocks (docs/design/DESIGN_SYSTEM.md §5).
 * Every redesigned screen uses these, inside a `.pd` wrapper (see src/pd-tokens.css).
 * Colors come only from the --pd-* tokens; no raw hex values here.
 */
import * as React from "react";
import { cn } from "@/lib/utils";

/* ---------- Button ---------- */
type ButtonVariant = "primary" | "secondary" | "onNavy";
type ButtonSize = "md" | "lg";
const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-[10px] font-bold text-center no-underline transition-colors " +
  "disabled:cursor-not-allowed disabled:bg-[var(--pd-disabled-bg)] disabled:text-[var(--pd-disabled-fg)] disabled:border-transparent";
const buttonVariants: Record<ButtonVariant, string> = {
  primary: "bg-[var(--pd-orange-700)] text-white hover:bg-[var(--pd-orange-800)]",
  secondary: "bg-white text-[var(--pd-ink)] border border-[var(--pd-gray-300)] hover:border-[var(--pd-ink)] font-semibold",
  onNavy: "bg-transparent text-white border border-[var(--pd-navy-600)] hover:border-white font-semibold",
};
const buttonSizes: Record<ButtonSize, string> = {
  md: "min-h-[44px] px-[18px] text-[15px]",
  lg: "min-h-[56px] px-6 text-[17px] w-full", // tech app primary actions (gloves)
};
export type PdButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize };
export function PdButton({ variant = "primary", size = "md", className, type = "button", ...props }: PdButtonProps) {
  return <button type={type} className={cn(buttonBase, buttonVariants[variant], buttonSizes[size], className)} {...props} />;
}
export function pdButtonClass(variant: ButtonVariant = "primary", size: ButtonSize = "md") {
  return cn(buttonBase, buttonVariants[variant], buttonSizes[size]);
}

/* ---------- Status pill (tables) ---------- */
export type PdStatus = "matched" | "conflict" | "missing" | "review" | "submitted" | "ready" | "corrections" | "approved" | "field";
const statusStyle: Record<PdStatus, string> = {
  matched: "bg-[var(--pd-success-bg)] text-[var(--pd-success-fg)]",
  approved: "bg-[var(--pd-success-bg)] text-[var(--pd-success-fg)]",
  conflict: "bg-[var(--pd-conflict-bg)] text-[var(--pd-conflict-fg)]",
  missing: "bg-[var(--pd-missing-bg)] text-[var(--pd-missing-fg)] border border-dashed border-[var(--pd-missing-border)]",
  review: "bg-[var(--pd-info-bg)] text-[var(--pd-info-fg)]",
  submitted: "bg-[var(--pd-submitted-bg)] text-[var(--pd-submitted-fg)]",
  ready: "bg-[var(--pd-ready-bg)] text-[var(--pd-ready-fg)]",
  corrections: "bg-[var(--pd-danger-bg)] text-[var(--pd-danger-fg)]",
  field: "bg-[var(--pd-gray-100)] text-[var(--pd-missing-fg)]",
};
export function PdStatusPill({ status, children, className }: { status: PdStatus; children: React.ReactNode; className?: string }) {
  return <span className={cn("inline-block rounded-[6px] px-2 py-[3px] text-[12px] font-bold whitespace-nowrap", statusStyle[status], className)}>{children}</span>;
}

/* ---------- Chip (headers, versions) ---------- */
export function PdChip({ children, mono, tone = "info", className }: { children: React.ReactNode; mono?: boolean; tone?: "info" | "neutral" | "orange"; className?: string }) {
  const tones = { info: "bg-[var(--pd-info-bg)] text-[var(--pd-info-fg)]", neutral: "bg-[var(--pd-gray-100)] text-[var(--pd-missing-fg)]", orange: "bg-[var(--pd-orange-100)] text-[var(--pd-orange-800)]" };
  return <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold whitespace-nowrap", mono && "font-mono font-medium", tones[tone], className)}>{children}</span>;
}

/* ---------- Card ---------- */
export function PdCard({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-[14px] border border-[var(--pd-gray-200)] bg-white", className)} {...props} />;
}

/* ---------- KPI card (office dashboard) ---------- */
export function PdKpiCard({ label, value, trend, sub, dark }: { label: string; value: string; trend?: string; sub?: string; dark?: boolean }) {
  const flat = !trend || /^[-+]?0%$/.test(trend);
  return (
    <div className={cn("flex flex-col gap-1 rounded-[14px] p-3.5", dark ? "bg-[var(--pd-navy-900)] text-white" : "border border-[var(--pd-gray-200)] bg-white text-[var(--pd-ink)]")}>
      <p className="text-[13px] font-bold">{label}</p>
      <div className="flex flex-wrap items-baseline gap-2">
        <p className="whitespace-nowrap text-[24px] font-extrabold xl:text-[28px]">{value}</p>
        {trend && <span className={cn("rounded-[6px] px-1.5 py-0.5 text-[12px] font-bold", flat ? "bg-[var(--pd-gray-100)] text-[var(--pd-missing-fg)]" : "bg-[var(--pd-success-bg)] text-[var(--pd-success-fg)]")}>{trend}</span>}
      </div>
      {sub && <p className={cn("text-[12px]", dark ? "text-[var(--pd-on-navy-muted)]" : "text-[var(--pd-gray-600)]")}>{sub}</p>}
    </div>
  );
}

/* ---------- Sync pill (tech app): always says exactly where the work is ---------- */
export type PdSyncState = "saved" | "queued" | "delivered";
const syncText: Record<PdSyncState, [string, string]> = {
  saved: ["Saved on phone", "Guardado en el teléfono"],
  queued: ["Queued · no signal", "En cola · sin señal"],
  delivered: ["Delivered to office", "Entregado a la oficina"],
};
export function PdSyncPill({ state, lang = "en", onNavy }: { state: PdSyncState; lang?: "en" | "es"; onNavy?: boolean }) {
  const style =
    state === "delivered" ? "bg-[var(--pd-success-bg)] text-[var(--pd-success-soft-fg)]"
    : state === "queued" ? "bg-[var(--pd-conflict-bg)] text-[var(--pd-conflict-fg)]"
    : onNavy ? "bg-[var(--pd-navy-700)] text-[var(--pd-on-navy-muted)]" : "bg-[var(--pd-gray-100)] text-[var(--pd-missing-fg)]";
  return <span role="status" className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-[12px] font-bold whitespace-nowrap", style)}>{syncText[state][lang === "es" ? 1 : 0]}</span>;
}

/* ---------- Draft-only notice ---------- */
export function PdDraftNotice({ lang = "en", className }: { lang?: "en" | "es"; className?: string }) {
  return (
    <p className={cn("rounded-[12px] bg-[var(--pd-notice-bg)] p-3 text-[14px] leading-[1.45] text-[var(--pd-conflict-fg)]", className)}>
      {lang === "es"
        ? "Borrador: no es una garantía de cumplimiento. Usted lo presenta en el portal oficial de permisos de la ciudad."
        : "Draft — not a guarantee of compliance. You file it yourself on the city's official permit portal."}
    </p>
  );
}

/* ---------- Logo: the real PD monogram, never redrawn ---------- */
export function PdLogo({ onDark, size = 30, withName = true, className }: { onDark?: boolean; size?: number; withName?: boolean; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <img src={onDark ? "/generated-assets/company-logo-white.png" : "/generated-assets/company-logo.png"} alt={withName ? "" : "PermitDraft"} width={size} height={size} />
      {withName && <span className={cn("text-[19px] font-bold tracking-[-0.01em]", onDark ? "text-white" : "text-[var(--pd-ink)]")}>PermitDraft</span>}
    </span>
  );
}

/* ---------- Eyebrow label ---------- */
export function PdEyebrow({ children, onDark, className }: { children: React.ReactNode; onDark?: boolean; className?: string }) {
  return <p className={cn("font-mono text-[12px] uppercase tracking-[0.14em]", onDark ? "text-[var(--pd-orange-300)]" : "text-[var(--pd-orange-700)]", className)}>{children}</p>;
}
