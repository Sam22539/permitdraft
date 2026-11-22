import { useEffect, useSyncExternalStore } from "react";
import { nsKey } from "./demo-mode";

// Practice job draft, autosaved in this browser (localStorage, works offline). Only keys the person has edited are
// stored, so defaults never overwrite saved answers (blank and unchecked values are kept as saved).
const DEFAULTS: Record<string, string> = {
  type: "Heat pump change-out", work: "Heat-pump change-out, same pad, left side yard",
};
const BASE_KEY = "permitdraft-job-draft-v1";
const key = () => nsKey(BASE_KEY);
export const STEP_PATHS = ["/new", "/new/equipment", "/new/work", "/new/checks", "/new/photos"] as const;

// `stage` keeps text typed but not yet saved into an answer (the dictation box), so stepping back and forward keeps it.
// It is never part of the finished job's answers.
type Saved = { values: Record<string, string>; step: number; stage?: Record<string, string> };
const EMPTY: Saved = { values: {}, step: 0 };
let raw: string | null | undefined;
let rawKey = "";
let cache: Saved = EMPTY;
const subs = new Set<() => void>();

function read(): Saved {
  if (typeof localStorage === "undefined") return EMPTY;
  const k = key();
  let r: string | null = null;
  try { r = localStorage.getItem(k); } catch { return cache; }
  if (r === raw && k === rawKey) return cache;
  raw = r; rawKey = k;
  try {
    const p = r ? JSON.parse(r) : null;
    cache = p && typeof p === "object" ? { values: typeof p.values === "object" && p.values ? p.values : {}, step: Number(p.step) || 0, stage: typeof p.stage === "object" && p.stage ? p.stage : {} } : EMPTY;
  } catch { cache = EMPTY; }
  return cache;
}
function write(s: Saved) {
  const r = JSON.stringify(s);
  try { localStorage.setItem(key(), r); } catch { /* storage full or blocked: keep in memory */ }
  raw = r; rawKey = key(); cache = s;
  subs.forEach((f) => f());
}
function subscribe(f: () => void) {
  subs.add(f);
  const on = (e: StorageEvent) => { if (e.key === key()) f(); };
  window.addEventListener("storage", on);
  return () => { subs.delete(f); window.removeEventListener("storage", on); };
}
const snap = () => read();
const serverSnap = () => EMPTY;

/** The keys the person actually edited (no defaults). */
export function readDraftValues(): Record<string, string> { return { ...read().values }; }

/** Replace the unfinished draft with these values (the demo's sample job). */
export function seedDraft(values: Record<string, string>) { write({ values: { ...values }, step: 1 }); }

export function finishDraft() {
  try { localStorage.removeItem(key()); } catch { /* ignore */ }
  raw = null; rawKey = key(); cache = EMPTY;
  subs.forEach((f) => f());
}

/** Unfinished saved draft: the step to reopen (1–5), or 0 when none. */
export function useResumeStep(): number {
  const s = useSyncExternalStore(subscribe, snap, serverSnap);
  return s.step >= 1 && s.step <= 5 ? s.step : 0;
}

/** Unsaved text staged in this draft (kept across steps until saved, cancelled, finished or reset). */
export function useDraftStage(k: string): [string | undefined, (v: string | undefined) => void] {
  const s = useSyncExternalStore(subscribe, snap, serverSnap);
  const set = (v: string | undefined) => {
    const c = read();
    const stage = { ...(c.stage ?? {}) };
    if (v === undefined) delete stage[k]; else stage[k] = v;
    write({ ...c, stage });
  };
  return [s.stage?.[k], set];
}

export function useDraft(step?: number) {
  const s = useSyncExternalStore(subscribe, snap, serverSnap);
  useEffect(() => {
    if (step && read().step !== step) write({ ...read(), step });
  }, [step]);
  return {
    get: (k: string) => (k in s.values ? s.values[k] : DEFAULTS[k] ?? ""),
    set: (k: string, v: string) => { const c = read(); write({ ...c, values: { ...c.values, [k]: v } }); },
  };
}
