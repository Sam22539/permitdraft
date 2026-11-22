import { useCallback, useEffect, useRef, useState } from "react";
import { isDemo } from "./demo-mode";

// Device-local photo store: real image blobs in IndexedDB, keyed by job + slot. Nothing is uploaded; every photo stays
// "waiting to upload" because no server ever acknowledges it in this practice build.
export const JOB_ID = "hp-1187";
export type Slot = "plate" | "outdoor" | "gauge" | "wide";
// SLOTS are the required photos (readiness). "wide" is an optional whole-unit shot and never blocks anything.
export const SLOTS: Slot[] = ["plate", "outdoor", "gauge"];
export const ALL_SLOTS: Slot[] = [...SLOTS, "wide"];
export type Unit = "indoor" | "outdoor";
export type PhotoRec = { unit?: Unit; key: string; job: string; slot: Slot; blob: Blob; name: string; type: string; savedAt: number; uploaded: boolean };

const REAL_DB = "permitdraft-photos";
export const DEMO_PHOTO_DB = "permitdraft-demo-photos";
const dbName = () => (isDemo() ? DEMO_PHOTO_DB : REAL_DB);
const STORE = "photos";
const keyOf = (job: string, slot: Slot) => `${job}:${slot}`;

function open(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    if (typeof indexedDB === "undefined") return rej(new Error("IndexedDB unavailable"));
    const r = indexedDB.open(dbName(), 1);
    r.onupgradeneeded = () => { r.result.createObjectStore(STORE, { keyPath: "key" }); };
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error ?? new Error("open failed"));
    r.onblocked = () => rej(new Error("blocked"));
  });
}

function run<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return open().then((db) => new Promise<T>((res, rej) => {
    const tx = db.transaction(STORE, mode);
    let out: T;
    const req = fn(tx.objectStore(STORE));
    req.onsuccess = () => { out = req.result; };
    // Resolve only once the transaction has committed, so "saved" means durably stored.
    tx.oncomplete = () => { db.close(); res(out); };
    tx.onerror = () => { db.close(); rej(tx.error ?? new Error("transaction failed")); };
    tx.onabort = () => { db.close(); rej(tx.error ?? new Error("transaction aborted")); };
  }));
}

export async function loadPhotos(job = JOB_ID): Promise<PhotoRec[]> {
  const all = await run<PhotoRec[]>("readonly", (s) => s.getAll() as IDBRequest<PhotoRec[]>);
  return all.filter((r) => r.job === job);
}

export async function savePhoto(slot: Slot, file: File, job = JOB_ID): Promise<void> {
  if (!file.type.startsWith("image/")) throw new Error("not-image");
  if (typeof createImageBitmap === "function") {
    try { (await createImageBitmap(file)).close(); } catch { throw new Error("not-image"); }
  }
  let unit: Unit | undefined;
  try { unit = (await loadPhotos(job)).find((r) => r.slot === slot)?.unit; } catch { /* keep untagged */ }
  const rec: PhotoRec = { ...(unit ? { unit } : {}), key: keyOf(job, slot), job, slot, blob: file, name: file.name || `${slot}.jpg`, type: file.type, savedAt: Date.now(), uploaded: false };
  await run("readwrite", (s) => s.put(rec)); // one put: a failure aborts and the previous photo stays
  notify();
}

export async function setPhotoUnit(slot: Slot, unit: Unit | undefined, job = JOB_ID): Promise<void> {
  const rec = (await loadPhotos(job)).find((r) => r.slot === slot);
  if (!rec) return;
  const next: PhotoRec = { ...rec };
  if (unit) next.unit = unit; else delete next.unit;
  await run("readwrite", (s) => s.put(next));
  notify();
}

export async function removePhoto(slot: Slot, job = JOB_ID): Promise<void> {
  await run("readwrite", (s) => s.delete(keyOf(job, slot)));
  notify();
}

const listeners = new Set<() => void>();
const bc = typeof window !== "undefined" && typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("pd-photos") : null;
function notify() { listeners.forEach((l) => l()); bc?.postMessage("changed"); }
if (bc && typeof bc.addEventListener === "function") bc.addEventListener("message", () => listeners.forEach((l) => l()));

export type PhotoView = { unit?: Unit; url: string; name: string; savedAt: number; uploaded: boolean };

export function usePhotos(job = JOB_ID) {
  const [map, setMap] = useState<Partial<Record<Slot, PhotoView>>>({});
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const urls = useRef<string[]>([]);
  const refresh = useCallback(async () => {
    try {
      const recs = await loadPhotos(job);
      urls.current.forEach((u) => URL.revokeObjectURL(u));
      urls.current = [];
      const m: Partial<Record<Slot, PhotoView>> = {};
      for (const r of recs) {
        const url = URL.createObjectURL(r.blob);
        urls.current.push(url);
        m[r.slot] = { unit: r.unit, url, name: r.name, savedAt: r.savedAt, uploaded: r.uploaded };
      }
      setMap(m); setLoadError(false);
    } catch { setLoadError(true); }
    setReady(true);
  }, [job]);
  useEffect(() => {
    refresh();
    listeners.add(refresh);
    return () => { listeners.delete(refresh); };
  }, [refresh]);
  useEffect(() => () => { urls.current.forEach((u) => URL.revokeObjectURL(u)); }, []);
  const pending = Object.values(map).filter((p) => p && !p.uploaded).length;
  return { photos: map, ready, loadError, pending };
}

/** Copy every photo of one job into another job's keys (same store, same `job:slot` convention). The source stays. */
export async function copyPhotos(from: string, to: string): Promise<PhotoRec[]> {
  const recs = await loadPhotos(from);
  const copies = recs.map((r) => ({ ...r, key: keyOf(to, r.slot), job: to }));
  if (copies.length) {
    await open().then((db) => new Promise<void>((res, rej) => {
      const tx = db.transaction(STORE, "readwrite");
      copies.forEach((c) => tx.objectStore(STORE).put(c));
      tx.oncomplete = () => { db.close(); res(); };
      tx.onerror = () => { db.close(); rej(tx.error ?? new Error("copy failed")); };
      tx.onabort = () => { db.close(); rej(tx.error ?? new Error("copy aborted")); };
    }));
  }
  return copies;
}

export async function deleteJobPhotos(job: string): Promise<void> {
  for (const s of ALL_SLOTS) { try { await run("readwrite", (st) => st.delete(keyOf(job, s))); } catch { /* ignore */ } }
}
