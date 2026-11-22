import { useEffect, useState } from "react";
import { useSearch } from "@tanstack/react-router";
import { useCaptured, type Captured, type Correction } from "./captured";
import { fieldSets, FIX_INPUT_ID, type CapField } from "./capture-fields";
import { useDraft } from "./job-draft";
import { saveCorrection } from "./captured";

/** Search for a capture step opened from a review draft's NEEDED action: which saved job, which field, which rule row. */
export type FixSearch = { fix?: string; field?: string; rule?: string };
export function fixSearch(s: Record<string, unknown>): FixSearch {
  const str = (v: unknown) => (typeof v === "string" && v ? v : undefined);
  return { fix: str(s.fix), field: str(s.field), rule: str(s.rule) };
}

export type FixInfo = {
  cap: Captured; field: CapField; inputId: string; rule?: string;
  value: string; evidence: string; setEvidence: (v: string) => void; existing?: Correction;
  /** Saves only this field, as a correction with its evidence. Never touches other fields or the unfinished draft. */
  save: () => "ok" | "empty" | "failed";
};

/** The saved job's value for a field: what the tech entered, else the form default that was shown. */
export function savedValue(cap: Captured, k: string): string {
  return k in cap.values ? cap.values[k] : cap.formDefaults[k] ?? "";
}

/**
 * Values for one capture step. Normally the unfinished draft. Opened from a review draft (?fix=<job>&field=<key>) it
 * instead preloads that saved job; only the targeted field can change, and saving makes a correction on that job.
 */
export function useStepDraft(step: number) {
  const s = useSearch({ strict: false }) as FixSearch;
  const all = useCaptured();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const draft = useDraft(s.fix ? undefined : step);
  const [val, setVal] = useState<string | undefined>();
  const [ev, setEv] = useState<string | undefined>();
  const cap = s.fix ? all.find((c) => c.id === s.fix) : undefined;
  const field = cap && s.field ? fieldSets(cap).find((f) => f.key === s.field && f.step === step && FIX_INPUT_ID[f.key]) : undefined;

  if (!s.fix) return { ...draft, fix: null as FixInfo | null, fixState: "off" as const, fixParams: s };
  if (!mounted) return { ...draft, set: () => {}, fix: null, fixState: "loading" as const, fixParams: s };
  if (!cap || !field) return { ...draft, set: () => {}, fix: null, fixState: "missing" as const, fixParams: s };

  const existing = cap.corrections?.[field.key];
  const value = val ?? existing?.value ?? savedValue(cap, field.key);
  const evidence = ev ?? existing?.evidence ?? "";
  const fix: FixInfo = {
    cap, field, inputId: FIX_INPUT_ID[field.key], rule: s.rule, value, evidence, setEvidence: setEv, existing,
    save: () => {
      if (!value.trim() || !evidence.trim()) return "empty";
      return saveCorrection(cap.id, field.key, value, evidence) ? "ok" : "failed";
    },
  };
  return {
    get: (k: string) => (k === field.key ? value : savedValue(cap, k)),
    set: (k: string, v: string) => { if (k === field.key) setVal(v); },
    fix, fixState: "on" as const, fixParams: s,
  };
}

/** Focus and highlight the targeted input, and make every other part of the step's card inert so nothing else is edited. */
export function useFixFocus(fix: FixInfo | null, dep: string) {
  useEffect(() => {
    if (!fix) return;
    const el = document.getElementById(fix.inputId);
    if (!el) return;
    const card = el.closest(".cx-card");
    const marked: Element[] = [];
    const target = el.closest(".cx-field") ?? el;
    target.classList.add("cx-target");
    let node: Element = target;
    while (node.parentElement && node !== card) {
      const parent: Element = node.parentElement;
      for (const sib of Array.from(parent.children)) {
        if (sib !== node && !sib.hasAttribute("inert")) { sib.setAttribute("inert", ""); sib.classList.add("cx-dim"); marked.push(sib); }
      }
      node = parent;
    }
    return () => { target.classList.remove("cx-target"); marked.forEach((m) => { m.removeAttribute("inert"); m.classList.remove("cx-dim"); }); };
  }, [fix?.inputId, dep]);
  useEffect(() => {
    if (!fix) return;
    const el = document.getElementById(fix.inputId);
    if (!el) return;
    el.scrollIntoView({ block: "center" });
    (el as HTMLElement).focus({ preventScroll: true });
  }, [fix?.inputId]);
}
