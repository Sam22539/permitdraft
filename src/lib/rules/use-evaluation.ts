import { useSyncExternalStore } from "react";
import type { Captured } from "../captured";
import { activeType } from "../capture-fields";
import { SLOTS } from "../photos";
import { evaluate } from "./engine";
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
  return evaluate(PACK, { type: activeType(c), values: c.values, photoSlots: SLOTS.filter((s) => c.photos.some((p) => p.slot === s)), jurisdictionCode, asOf: today() });
}
