import { createServerFn } from "@tanstack/react-start";

/** Documents, equipment notes and inspections. Every call is checked on the server: verified sign-in, same-company admin or office role. */
const tok = (d: unknown) => {
  const t = String((d as { token?: unknown })?.token ?? "");
  if (!t || t.length > 4000) throw new Error("input");
  return t;
};
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const BUCKET = "company-documents";
export const MAX_UPLOAD = 5 * 1024 * 1024;
export const DOC_TYPES: Record<string, string> = {
  pdf: "application/pdf", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", txt: "text/plain",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};
export const DOC_CATEGORIES = ["permit", "plans", "invoice", "warranty", "correspondence", "other"] as const;
export const INSPECTION_STATUSES = ["scheduled", "passed", "failed", "cancelled"] as const;

async function officeCtx(token: string) {
  const { serverBackend } = await import("./backend.server");
  const office = await import("./office.server");
  const db = serverBackend();
  const who = await office.whoIs(db, token);
  const member = await office.membership(db, who.email);
  const isOffice = !!member && (member.role === "admin" || member.role === "office");
  return { db, who, member, isOffice };
}
const clean = (v: unknown, max: number) => String(v ?? "").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "").trim().slice(0, max + 1);

async function packetOf(db: import("@supabase/supabase-js").SupabaseClient, id: string, company: string) {
  const { data } = await db.from("office_packets").select("id, company_id, tracking_no").eq("id", id).maybeSingle();
  return data && data.company_id === company ? (data as { id: string; company_id: string; tracking_no: string }) : null;
}

function sniff(bytes: Uint8Array, mime: string): boolean {
  const s = (a: number[]) => a.every((b, i) => bytes[i] === b);
  switch (mime) {
    case "application/pdf": return s([0x25, 0x50, 0x44, 0x46]);
    case "image/png": return s([0x89, 0x50, 0x4e, 0x47]);
    case "image/jpeg": return s([0xff, 0xd8, 0xff]);
    case "image/webp": return s([0x52, 0x49, 0x46, 0x46]) && bytes[8] === 0x57 && bytes[9] === 0x45;
    case "text/plain": return !bytes.slice(0, 2000).includes(0);
    default: return s([0x50, 0x4b, 0x03, 0x04]); // docx / xlsx are zip containers
  }
}

export const uploadDocument = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; packetId: string | null; title: string; category: string; notes: string; fileName: string; mime: string; base64: string }) => {
    const packetId = d?.packetId ? String(d.packetId).toLowerCase() : null;
    const title = clean(d?.title, 160), notes = clean(d?.notes, 1000), fileName = clean(d?.fileName, 200).replace(/[\\/]/g, "_");
    const base64 = String(d?.base64 ?? "");
    if ((packetId && !UUID.test(packetId)) || !title || title.length > 160 || notes.length > 1000 || !fileName || fileName.length > 200
      || !(DOC_CATEGORIES as readonly string[]).includes(String(d?.category)) || !Object.values(DOC_TYPES).includes(String(d?.mime))
      || base64.length > Math.ceil(MAX_UPLOAD * 4 / 3) + 8 || !base64) throw new Error("input");
    return { token: tok(d), packetId, title, notes, fileName, category: String(d.category), mime: String(d.mime), base64 };
  })
  .handler(async ({ data }) => {
    const { db, who, member, isOffice } = await officeCtx(data.token);
    if (!member || !isOffice) return { ok: false as const, reason: "forbidden" as const };
    const ext = data.fileName.split(".").pop()?.toLowerCase() ?? "";
    if (DOC_TYPES[ext] !== data.mime) return { ok: false as const, reason: "type" as const };
    const bytes = Uint8Array.from(atob(data.base64), (c) => c.charCodeAt(0));
    if (bytes.length === 0 || bytes.length > MAX_UPLOAD) return { ok: false as const, reason: "size" as const };
    if (!sniff(bytes, data.mime)) return { ok: false as const, reason: "type" as const };
    if (data.packetId && !(await packetOf(db, data.packetId, member.company_id))) return { ok: false as const, reason: "job" as const };
    const path = `${member.company_id}/${crypto.randomUUID()}.${ext}`;
    const up = await db.storage.from(BUCKET).upload(path, bytes, { contentType: data.mime, upsert: false });
    if (up.error) throw new Error("store");
    const { data: row, error } = await db.from("company_documents").insert({
      company_id: member.company_id, packet_id: data.packetId, title: data.title, category: data.category, notes: data.notes || null,
      file_name: data.fileName, mime: data.mime, size_bytes: bytes.length, storage_path: path, uploaded_by: who.email,
    }).select("id").single();
    if (error) { await db.storage.from(BUCKET).remove([path]); throw new Error("save"); }
    return { ok: true as const, id: row.id as string };
  });

/** A 60-second download link for one document of the caller's own company. */
export const documentLink = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; id: string }) => {
    const id = String(d?.id ?? "").toLowerCase();
    if (!UUID.test(id)) throw new Error("input");
    return { token: tok(d), id };
  })
  .handler(async ({ data }) => {
    const { db, member, isOffice } = await officeCtx(data.token);
    if (!member || !isOffice) return { ok: false as const, reason: "forbidden" as const };
    const { data: doc } = await db.from("company_documents").select("company_id, storage_path, file_name").eq("id", data.id).maybeSingle();
    if (!doc || doc.company_id !== member.company_id) return { ok: false as const, reason: "missing" as const };
    const { data: s, error } = await db.storage.from(BUCKET).createSignedUrl(doc.storage_path, 60, { download: doc.file_name });
    if (error || !s) throw new Error("link");
    return { ok: true as const, url: s.signedUrl };
  });

export const addEquipmentNote = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; packetId: string; unit: string; note: string }) => {
    const packetId = String(d?.packetId ?? "").toLowerCase(), unit = clean(d?.unit, 120), note = clean(d?.note, 1000);
    if (!UUID.test(packetId) || !unit || unit.length > 120 || !note || note.length > 1000) throw new Error("input");
    return { token: tok(d), packetId, unit, note };
  })
  .handler(async ({ data }) => {
    const { db, who, member, isOffice } = await officeCtx(data.token);
    if (!member || !isOffice) return { ok: false as const, reason: "forbidden" as const };
    if (!(await packetOf(db, data.packetId, member.company_id))) return { ok: false as const, reason: "job" as const };
    const { error } = await db.from("equipment_notes").insert({ company_id: member.company_id, packet_id: data.packetId, unit_label: data.unit, note: data.note, created_by: who.email });
    if (error) throw new Error("save");
    return { ok: true as const };
  });

const when = (v: unknown) => { const d = new Date(String(v ?? "")); if (isNaN(+d)) throw new Error("input"); return d; };

export const recordInspection = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; packetId: string; kind: string; at: string; notes: string }) => {
    const packetId = String(d?.packetId ?? "").toLowerCase(), kind = clean(d?.kind, 120), notes = clean(d?.notes, 1000);
    if (!UUID.test(packetId) || !kind || kind.length > 120 || notes.length > 1000) throw new Error("input");
    return { token: tok(d), packetId, kind, at: when(d?.at), notes };
  })
  .handler(async ({ data }) => {
    const { db, who, member, isOffice } = await officeCtx(data.token);
    if (!member || !isOffice) return { ok: false as const, reason: "forbidden" as const };
    const pk = await packetOf(db, data.packetId, member.company_id);
    if (!pk) return { ok: false as const, reason: "job" as const };
    const { data: row, error } = await db.from("company_inspections").insert({
      company_id: pk.company_id, packet_id: pk.id, tracking_no: pk.tracking_no, kind: data.kind, scheduled_at: data.at.toISOString(),
      notes: data.notes || null, created_by: who.email, updated_by: who.email,
    }).select("id").single();
    if (error) throw new Error("save");
    const { error: ae } = await db.from("inspection_audit").insert({ company_id: pk.company_id, inspection_id: row.id, packet_id: pk.id, action: "recorded", actor: who.email, to_at: data.at.toISOString(), to_status: "scheduled", note: data.notes || null });
    if (ae) throw new Error("audit");
    return { ok: true as const };
  });

/** Reschedules and/or sets the outcome of a company-recorded inspection; every change is audited. */
export const updateInspection = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; id: string; at: string; status: string; notes: string }) => {
    const id = String(d?.id ?? "").toLowerCase(), notes = clean(d?.notes, 1000);
    if (!UUID.test(id) || notes.length > 1000 || !(INSPECTION_STATUSES as readonly string[]).includes(String(d?.status))) throw new Error("input");
    return { token: tok(d), id, at: when(d?.at), status: String(d.status), notes };
  })
  .handler(async ({ data }) => {
    const { db, who, member, isOffice } = await officeCtx(data.token);
    if (!member || !isOffice) return { ok: false as const, reason: "forbidden" as const };
    const { data: old } = await db.from("company_inspections").select("*").eq("id", data.id).maybeSingle();
    if (!old || old.company_id !== member.company_id) return { ok: false as const, reason: "missing" as const };
    const timeChanged = +new Date(old.scheduled_at) !== +data.at, statusChanged = old.status !== data.status, noteChanged = (old.notes ?? "") !== data.notes;
    if (!timeChanged && !statusChanged && !noteChanged) return { ok: true as const };
    const { error } = await db.from("company_inspections").update({ scheduled_at: data.at.toISOString(), status: data.status, notes: data.notes || null, updated_by: who.email, updated_at: new Date().toISOString() }).eq("id", old.id).eq("company_id", old.company_id);
    if (error) throw new Error("save");
    const action = statusChanged ? "outcome" : timeChanged ? "rescheduled" : "edited";
    const { error: ae } = await db.from("inspection_audit").insert({ company_id: old.company_id, inspection_id: old.id, packet_id: old.packet_id, action, actor: who.email, from_at: old.scheduled_at, to_at: data.at.toISOString(), from_status: old.status, to_status: data.status, note: data.notes || null });
    if (ae) throw new Error("audit");
    return { ok: true as const };
  });
