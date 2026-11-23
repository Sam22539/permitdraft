import { backend } from "./backend";
import { loadPhotos, markUploaded, JOB_ID, ALL_SLOTS, type PhotoRec } from "./photos";

const ID_KEY = "permitdraft-core-draft-job-id";
/** The id the unfinished Core job keeps from its first photo until Finish; its photos and packet are saved under it. */
export function draftJobId(): string {
  let id = "";
  try { id = localStorage.getItem(ID_KEY) ?? ""; } catch { /* ignore */ }
  if (!id) {
    id = `cap-${Date.now().toString(36)}`;
    try { localStorage.setItem(ID_KEY, id); } catch { /* ignore */ }
  }
  return id;
}
export function clearDraftJobId() { try { localStorage.removeItem(ID_KEY); } catch { /* ignore */ } }

async function toDataUrl(rec: PhotoRec): Promise<{ url: string; mime: string }> {
  const read = (b: Blob) => new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = () => rej(r.error); r.readAsDataURL(b); });
  try {
    const bmp = await createImageBitmap(rec.blob);
    const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas");
    c.width = Math.max(1, Math.round(bmp.width * scale)); c.height = Math.max(1, Math.round(bmp.height * scale));
    c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
    bmp.close();
    const blob: Blob | null = await new Promise((r) => c.toBlob(r, "image/jpeg", 0.8));
    if (blob) return { url: await read(blob), mime: "image/jpeg" };
  } catch { /* fall back to the original file */ }
  return { url: await read(rec.blob), mime: rec.type || "image/jpeg" };
}

let running: Promise<number> | null = null;
/** Saves every photo of the unfinished job to the database (and drops removed ones). Returns how many are still not saved. */
export function syncPhotos(jobId: string): Promise<number> {
  if (running) return running.then(() => syncPhotos(jobId));
  running = (async () => {
    let left = 0;
    try {
      const { data: sess } = await backend.auth.getSession();
      const uid = sess.session?.user.id;
      const recs = await loadPhotos(JOB_ID);
      if (!uid) return recs.filter((r) => !r.uploaded).length;
      const { data: rows, error } = await backend.from("job_photos").select("id, slot").eq("job_id", jobId);
      if (error) return recs.filter((r) => !r.uploaded).length;
      const local = new Set(recs.map((r) => r.slot));
      for (const row of rows ?? []) if (!local.has(row.slot)) await backend.from("job_photos").delete().eq("id", row.id);
      for (const r of recs.filter((x) => !x.uploaded && ALL_SLOTS.includes(x.slot))) {
        try {
          const { url, mime } = await toDataUrl(r);
          const { error: e } = await backend.from("job_photos").upsert(
            { user_id: uid, job_id: jobId, slot: r.slot, unit: r.unit ?? null, name: r.name.slice(0, 200), mime, data_url: url, taken_at: r.savedAt },
            { onConflict: "user_id,job_id,slot" });
          if (e) { left++; continue; }
          await markUploaded(r.slot, r.savedAt, JOB_ID);
        } catch { left++; }
      }
    } catch { left = (await loadPhotos(JOB_ID).catch(() => [])).filter((r) => !r.uploaded).length || 1; }
    return left;
  })().finally(() => { running = null; });
  return running;
}
