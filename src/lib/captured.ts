import { useSyncExternalStore } from "react";
import { copyPhotos, deleteJobPhotos, JOB_ID, type Slot, type Unit } from "./photos";
import { finishDraft, readDraftValues } from "./job-draft";
import { nsKey } from "./demo-mode";

// Finished practice captures, kept in this browser (localStorage). Photos stay in the existing IndexedDB photo store:
// each capture gets its own `job` id, so its photos live under `<captureId>:<slot>` like every other photo.
export type CapturedPhoto = { unit?: Unit; slot: Slot; key: string; name: string; type: string; savedAt: number; uploaded: boolean };
export type Captured = {
  id: string; finishedAt: number;
  values: Record<string, string>;        // exactly the keys the tech edited
  formDefaults: Record<string, string>;  // form defaults shown but never edited
  photos: CapturedPhoto[];
  /** Item-level corrections saved on the review draft, by field key. The captured value above is never overwritten. */
  corrections?: Record<string, Correction>;
};
/**
 * A correction to one captured item, with the evidence for it. `flaggedAt` only means "awaiting office review":
 * flagging never confirms, approves or readies anything for filing, and never clears a missing-item blocker.
 */
export type Correction = { value: string; evidence: string; savedAt: number; flaggedAt?: number };
export const CAPTURED_KEY = "permitdraft-captured-jobs-v1";
const key = () => nsKey(CAPTURED_KEY);
const DEFAULT_SHOWN: Record<string, string> = { type: "Heat pump change-out", work: "Heat-pump change-out, same pad, left side yard" };

const EMPTY: Captured[] = [];
let raw: string | null | undefined;
let rawKey = "";
let cache: Captured[] = EMPTY;
const subs = new Set<() => void>();

function read(): Captured[] {
  if (typeof localStorage === "undefined") return EMPTY;
  const k = key();
  let r: string | null = null;
  try { r = localStorage.getItem(k); } catch { return cache; }
  if (r === raw && k === rawKey) return cache;
  raw = r; rawKey = k;
  try { const p = r ? JSON.parse(r) : []; cache = Array.isArray(p) ? p : EMPTY; } catch { cache = EMPTY; }
  return cache;
}
function subscribe(f: () => void) {
  subs.add(f);
  const on = (e: StorageEvent) => { if (e.key === key()) f(); };
  window.addEventListener("storage", on);
  return () => { subs.delete(f); window.removeEventListener("storage", on); };
}
export function useCaptured(): Captured[] { return useSyncExternalStore(subscribe, read, () => EMPTY); }

/**
 * Save a job-scoped snapshot of the unfinished capture, then clear the unfinished draft.
 * Returns the new id, or null when anything failed — in that case nothing is cleared and nothing half-saved is left.
 */
export async function finishCapture(): Promise<string | null> {
  const id = `cap-${Date.now().toString(36)}`;
  try {
    const values = readDraftValues();
    const formDefaults: Record<string, string> = {};
    for (const k of Object.keys(DEFAULT_SHOWN)) if (!(k in values)) formDefaults[k] = DEFAULT_SHOWN[k];
    const copies = await copyPhotos(JOB_ID, id);
    const rec: Captured = {
      id, finishedAt: Date.now(), values, formDefaults,
      photos: copies.map((c) => ({ ...(c.unit ? { unit: c.unit } : {}), slot: c.slot, key: c.key, name: c.name, type: c.type, savedAt: c.savedAt, uploaded: c.uploaded })),
    };
    const prev = read();
    const next = JSON.stringify([rec, ...prev]);
    try {
      localStorage.setItem(key(), next);
      if (localStorage.getItem(key()) !== next) throw new Error("readback mismatch");
    } catch (e) { await deleteJobPhotos(id); throw e; }
    read(); subs.forEach((f) => f());
    finishDraft();
    return id;
  } catch {
    await deleteJobPhotos(id);
    return null;
  }
}

/** Write the captured list back with a readback check, then tell every screen. Throws when the save did not stick. */
function writeAll(list: Captured[]) {
  const next = JSON.stringify(list);
  localStorage.setItem(key(), next);
  if (localStorage.getItem(key()) !== next) throw new Error("readback mismatch");
  read(); subs.forEach((f) => f());
}
function updateCorrections(capId: string, change: (c: Record<string, Correction>) => Record<string, Correction>): boolean {
  try {
    const list = read();
    if (!list.some((c) => c.id === capId)) return false;
    writeAll(list.map((c) => (c.id === capId ? { ...c, corrections: change({ ...(c.corrections ?? {}) }) } : c)));
    return true;
  } catch { return false; }
}
/** Save (or replace) a correction for one item. A new or changed correction is not flagged until marked again. */
export function saveCorrection(capId: string, field: string, value: string, evidence: string): boolean {
  const v = value.trim(), e = evidence.trim();
  if (!v || !e) return false;
  return updateCorrections(capId, (m) => ({ ...m, [field]: { value: v, evidence: e, savedAt: Date.now() } }));
}
/** Mark a saved correction for office review. Nothing else changes. */
export function flagCorrection(capId: string, field: string): boolean {
  return updateCorrections(capId, (m) => (m[field] ? { ...m, [field]: { ...m[field], flaggedAt: Date.now() } } : m));
}
