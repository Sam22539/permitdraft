import { useSyncExternalStore } from "react";
import { copyPhotos, deleteJobPhotos, JOB_ID, type Slot } from "./photos";
import { finishDraft, readDraftValues } from "./job-draft";

// Finished practice captures, kept in this browser (localStorage). Photos stay in the existing IndexedDB photo store:
// each capture gets its own `job` id, so its photos live under `<captureId>:<slot>` like every other photo.
export type CapturedPhoto = { slot: Slot; key: string; name: string; type: string; savedAt: number; uploaded: boolean };
export type Captured = {
  id: string; finishedAt: number;
  values: Record<string, string>;        // exactly the keys the tech edited
  formDefaults: Record<string, string>;  // form defaults shown but never edited
  photos: CapturedPhoto[];
};
export const CAPTURED_KEY = "permitdraft-captured-jobs-v1";
const DEFAULT_SHOWN: Record<string, string> = { type: "Heat pump change-out", work: "Heat-pump change-out, same pad, left side yard" };

const EMPTY: Captured[] = [];
let raw: string | null | undefined;
let cache: Captured[] = EMPTY;
const subs = new Set<() => void>();

function read(): Captured[] {
  if (typeof localStorage === "undefined") return EMPTY;
  let r: string | null = null;
  try { r = localStorage.getItem(CAPTURED_KEY); } catch { return cache; }
  if (r === raw) return cache;
  raw = r;
  try { const p = r ? JSON.parse(r) : []; cache = Array.isArray(p) ? p : EMPTY; } catch { cache = EMPTY; }
  return cache;
}
function subscribe(f: () => void) {
  subs.add(f);
  const on = (e: StorageEvent) => { if (e.key === CAPTURED_KEY) f(); };
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
      photos: copies.map((c) => ({ slot: c.slot, key: c.key, name: c.name, type: c.type, savedAt: c.savedAt, uploaded: c.uploaded })),
    };
    const prev = read();
    const next = JSON.stringify([rec, ...prev]);
    try {
      localStorage.setItem(CAPTURED_KEY, next);
      if (localStorage.getItem(CAPTURED_KEY) !== next) throw new Error("readback mismatch");
    } catch (e) { await deleteJobPhotos(id); throw e; }
    read(); subs.forEach((f) => f());
    finishDraft();
    return id;
  } catch {
    await deleteJobPhotos(id);
    return null;
  }
}
