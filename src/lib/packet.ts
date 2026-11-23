import { createServerFn } from "@tanstack/react-start";
import { applicableChecks, checkConfirmed, furnaceAnswers, requiredSlots } from "./capture-fields";
import { ALL_SLOTS, EXTRA_SLOTS, type Slot } from "./photos";

const KNOWN: string[] = [...ALL_SLOTS, ...EXTRA_SLOTS];

type In = { token: string; jobId: string; employeeId: string; values: Record<string, string>; formDefaults: Record<string, string>; slots: string[] };

/**
 * Creates the one private office packet for a job: captured fields, links to the job's saved photos, the signed-in
 * technician's name and the database clock's sent time. Sending twice returns the same packet. Refused, with nothing saved
 * or sent, while any photo the job flow requires (requiredSlots) is not among the technician's photos stored in the database for
 * this job, or any other photo the device holds is not saved there yet. Once saved, one notice email goes to the technician's company's
 * verified office inbox (none where the company has none), linking to the signed-in office review.
 */
export const sendOfficePacket = createServerFn({ method: "POST" })
  .inputValidator((d: In) => {
    const token = String(d?.token ?? "");
    const jobId = String(d?.jobId ?? "");
    if (!token || token.length > 4000 || !jobId || jobId.length > 80) throw new Error("input");
    const clean = (o: unknown) => Object.fromEntries(Object.entries((o && typeof o === "object" ? o : {}) as Record<string, unknown>).slice(0, 200).map(([k, v]) => [k.slice(0, 80), String(v ?? "").slice(0, 4000)]));
    const slots = Array.isArray(d?.slots) ? [...new Set(d.slots.map(String).filter((x) => KNOWN.includes(x)))].slice(0, 8) : [];
    return { token, jobId, employeeId: String(d?.employeeId ?? "").trim().slice(0, 40), values: clean(d?.values), formDefaults: clean(d?.formDefaults), slots };
  })
  .handler(async ({ data }) => {
    const { serverBackend } = await import("./backend.server");
    const db = serverBackend();
    const { data: u, error: ue } = await db.auth.getUser(data.token);
    if (ue || !u.user) throw new Error("auth");
    const uid = u.user.id;
    const [main, extra] = await Promise.all([
      db.from("job_photos").select("id, slot, unit, name, mime, taken_at").eq("user_id", uid).eq("job_id", data.jobId),
      db.from("job_extra_photos").select("id, slot, unit, name, mime, taken_at").eq("user_id", uid).eq("job_id", data.jobId),
    ]);
    if (main.error || extra.error) throw new Error("save");
    const photos = main.data ?? [], extras = extra.data ?? [];
    const have = new Set([...photos, ...extras].map((p) => String(p.slot)));
    // The job flow's required photos decide, read from what is stored; the device's list only names uploads in progress.
    const type = data.values.type || "Heat pump change-out";
    const answers = furnaceAnswers(type, data.values);
    const missing = requiredSlots(type, data.values).filter((s) => !have.has(s) && !data.slots.includes(s)) as Slot[];
    const waiting = data.slots.filter((s) => !have.has(s)).length;
    const office = await import("./office.server");
    const capture = office.isTestPerson(u.user);
    const existing = await db.from("office_packets").select("id, sent_by_name, sent_at").eq("user_id", uid).eq("job_id", data.jobId).maybeSingle();
    if (existing.data) {
      // Finish again: the same packet; its one notice is tried only if it never went (the claim keeps it to one email).
      const notice = await office.sendOfficeNotice(db, String(existing.data.id), String(existing.data.sent_at), capture);
      return { ok: true as const, created: false, sentBy: existing.data.sent_by_name as string, sentAt: existing.data.sent_at as string, notice };
    }
    // Furnace + coil: every check the scope makes applicable must be confirmed under the current scope (hidden checks never block).
    const unconfirmed = type === "Furnace + coil change-out" ? applicableChecks(type, data.values).filter((k) => !checkConfirmed(type, data.values, k)) : [];
    if (answers.missing.length > 0 || answers.contradiction) return { ok: false as const, missing, waiting, answers: true as const, checks: unconfirmed };
    if (unconfirmed.length > 0) return { ok: false as const, missing, waiting, answers: false as const, checks: unconfirmed };
    if (missing.length > 0 || waiting > 0) return { ok: false as const, missing, waiting, answers: false as const, checks: unconfirmed };
    // The company comes from the technician's own verified membership, never from the page.
    const member = u.user.email ? await office.membership(db, u.user.email.toLowerCase()) : null;
    const md = (u.user.user_metadata ?? {}) as Record<string, unknown>;
    const { data: prof } = await db.from("profiles").select("display_name").eq("user_id", uid).maybeSingle();
    const name = String(prof?.display_name ?? "").trim() || String(md.full_name ?? md.name ?? "").trim() || u.user.email || "Technician";
    // The admin-assigned ID comes from the company's own record; the typed one is only a fallback where none is assigned.
    const assignedId = (member as { employee_id?: string | null } | null)?.employee_id ?? null;
    const row = {
      user_id: uid, job_id: data.jobId, company_id: member?.company_id ?? null, notify_status: "saved", sent_by_name: name.slice(0, 200), employee_id: assignedId || data.employeeId || null,
      captured_fields: { values: data.values, formDefaults: data.formDefaults },
      photo_links: [
        ...photos.map((p) => ({ photoId: p.id, slot: p.slot, unit: p.unit, name: p.name, type: p.mime, takenAt: p.taken_at })),
        ...extras.map((p) => ({ photoId: p.id, table: "extra", slot: p.slot, unit: p.unit, name: p.name, type: p.mime, takenAt: p.taken_at })),
      ],
    };
    const ins = await db.from("office_packets").upsert(row, { onConflict: "user_id,job_id", ignoreDuplicates: true });
    if (ins.error) throw new Error("save");
    const { data: made, error: me } = await db.from("office_packets").select("id, sent_by_name, sent_at").eq("user_id", uid).eq("job_id", data.jobId).single();
    if (me || !made) throw new Error("save");
    const notice = await office.sendOfficeNotice(db, String(made.id), String(made.sent_at), capture);
    return { ok: true as const, created: true, sentBy: String(made.sent_by_name ?? name), sentAt: String(made.sent_at), notice };
  });

/** The technician's own packet: tries its one office notice again where it failed or the inbox was not set up yet. */
export const retryOfficeNotice = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; jobId: string }) => {
    const token = String(d?.token ?? ""), jobId = String(d?.jobId ?? "");
    if (!token || token.length > 4000 || !jobId || jobId.length > 80) throw new Error("input");
    return { token, jobId };
  })
  .handler(async ({ data }) => {
    const { serverBackend } = await import("./backend.server");
    const office = await import("./office.server");
    const db = serverBackend();
    const { data: u, error: ue } = await db.auth.getUser(data.token);
    if (ue || !u.user) throw new Error("auth");
    const { data: pk } = await db.from("office_packets").select("id, sent_at").eq("user_id", u.user.id).eq("job_id", data.jobId).maybeSingle();
    if (!pk) return { notice: "missing" as const };
    return { notice: await office.sendOfficeNotice(db, String(pk.id), String(pk.sent_at), office.isTestPerson(u.user)) };
  });
