import { useSyncExternalStore } from "react";
import type { Captured } from "../captured";
import { activeType, applicableChecks, checkConfirmed, cleanValues, fieldSets, furnaceAnswers, requiredSlots } from "../capture-fields";
import { ALL_SLOTS } from "../photos";
import { evaluate, type CheckResult } from "./engine";
import { PACK } from "./data";
import { nsKey } from "../demo-mode";

// Office-confirmed jurisdiction per captured job, kept beside (never inside) the saved capture so old jobs stay as saved.
const BASE_KEY = "permitdraft-office-jurisdiction-v1";
const key = () => nsKey(BASE_KEY);
const EMPTY: Record<string, string> = {};
let raw: string | null | undefined; let rawKey = ""; let cache = EMPTY;
const subs = new Set<() => void>();
function read() {
  if (typeof localStorage === "undefined") return EMPTY;
  const k = key();
  let r: string | null = null;
  try { r = localStorage.getItem(k); } catch { return cache; }
  if (r === raw && k === rawKey) return cache;
  raw = r; rawKey = k;
  try { const p = r ? JSON.parse(r) : {}; cache = p && typeof p === "object" ? p : EMPTY; } catch { cache = EMPTY; }
  return cache;
}
export function setOfficeJurisdiction(id: string, code: string) {
  const next = { ...read() }; if (code) next[id] = code; else delete next[id];
  try { localStorage.setItem(key(), JSON.stringify(next)); } catch { /* keep in memory */ }
  raw = undefined; cache = next; read(); subs.forEach((f) => f());
}
export function useOfficeJurisdictions(): Record<string, string> {
  return useSyncExternalStore((f) => { subs.add(f); return () => { subs.delete(f); }; }, read, () => EMPTY);
}
export function today() { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`; }
export function evaluateCapture(c: Captured, jurisdictionCode: string | null) {
  // A saved job's shown defaults (never edited) are not captured values: only what the tech entered counts.
  const type0 = activeType(c);
  const okChecks = applicableChecks(type0, c.values);
  const need = requiredSlots(type0, c.values);
  const pack = { ...PACK, rules: PACK.rules.filter((r) => {
    const m = /^app-doc-chk-(c\d)$/.exec(r.id); if (m) return okChecks.includes(m[1]);
    const ph = /^app-doc-p-(outdoor|gauge|plate_furnace|plate_coil|plate_outdoor)$/.exec(r.id); if (ph) return need.includes(ph[1] as never);
    // Nameplate details of equipment the tech answered was kept are optional evidence, never a blocker.
    if (type0 === "Furnace + coil change-out") {
      if ((r.id === "app-doc-model" || r.id === "app-doc-serial") && c.values.fu_furnace === "retained") return false;
      if ((r.id === "app-doc-coilModel" || r.id === "app-doc-coilSerial") && c.values.fu_coil === "retained") return false;
    }
    return true;
  }) };
  // A confirmation only counts under the scope it was given in: a stale tick is read as not confirmed.
  const values0 = { ...cleanValues(type0, c.values) };
  for (const k of ["c1", "c2", "c3", "c4"]) if (values0[k] === "1" && !checkConfirmed(type0, c.values, k)) delete values0[k];
  const fa = furnaceAnswers(type0, c.values);
  const ev = evaluate(pack, { type: type0, values: { ...values0, fu_ok: fa.contradiction ? "" : "1" }, photoSlots: ALL_SLOTS.filter((s) => c.photos.some((p) => p.slot === s)), jurisdictionCode, asOf: today() });
  // A flagged correction with no decision is an unresolved conflict: it blocks Ready until the office accepts or returns it.
  const open = Object.entries(c.corrections ?? {}).filter(([, k]) => k.flaggedAt && !k.decision);
  if (open.length === 0) return ev;
  const sets = fieldSets(c);
  const items: CheckResult[] = open.map(([key]) => {
    const f = sets.find((x) => x.key === key);
    const name: [string, string] = f ? [f.label[0], f.label[1]] : [key, key];
    return {
      ruleId: `conflict-${key}`, ruleVersion: 1, status: "missing" as const,
      text: [`Conflict on ${name[0]}`, `Conflicto en ${name[1]}`], todo: ["Office: accept or return the conflicting value before Ready.", "Oficina: acepte o devuelva el valor en conflicto antes de marcar listo."],
      why: ["A flagged correction conflicts with the captured value and has no decision.", "Una corrección marcada está en conflicto con el valor capturado y no tiene decisión."],
      layer: "app", scope: "documentation", ruleStatus: "unverified", sources: [], effectiveFrom: "", verifiedOn: "", dateBasis: "evaluation_date", evidence: `conflict:${key}`,
    } as CheckResult;
  });
  const missing = [...ev.missing, ...items];
  const reasons = ev.filing.reasons.includes("evidence_unresolved") ? ev.filing.reasons : [...ev.filing.reasons, "evidence_unresolved" as const];
  return { ...ev, missing, officeReview: { ready: false }, filing: { ready: false, reasons }, next: ev.missing.length > 0 ? ev.next : { kind: "capture" as const, item: items[0] } };
}
