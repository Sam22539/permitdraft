import { createServerFn } from "@tanstack/react-start";

/** Dispatch: the company roster and assignment changes. Every call is checked on the server against the caller's verified membership. */
const tok = (d: unknown) => {
  const t = String((d as { token?: unknown })?.token ?? "");
  if (!t || t.length > 4000) throw new Error("input");
  return t;
};
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function officeCtx(token: string) {
  const { serverBackend } = await import("./backend.server");
  const office = await import("./office.server");
  const db = serverBackend();
  const who = await office.whoIs(db, token);
  const member = await office.membership(db, who.email);
  const isOffice = !!member && (member.role === "admin" || member.role === "office");
  return { db, who, member, isOffice };
}

export type RosterEntry = { email: string; role: "admin" | "office" | "technician"; employeeId: string | null };

/** The signed-in office person's own company roster (never another company's). */
export const getRoster = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string }) => ({ token: tok(d) }))
  .handler(async ({ data }) => {
    const { db, member, isOffice } = await officeCtx(data.token);
    if (!member || !isOffice) return { ok: false as const, roster: [] as RosterEntry[] };
    const { data: rows, error } = await db.from("company_members").select("email, role, employee_id").eq("company_id", member.company_id).order("added_at");
    if (error) throw new Error("read");
    const roster = ((rows ?? []) as { email: string; role: RosterEntry["role"]; employee_id: string | null }[]).map((m) => ({ email: m.email, role: m.role, employeeId: m.employee_id }));
    return { ok: true as const, roster };
  });

/** Assigns an existing job to one of the company's technicians and sets or changes its time window. */
export const assignJob = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; packetId: string; tech: string; start: string; end: string; note: string }) => {
    const packetId = String(d?.packetId ?? "");
    const tech = String(d?.tech ?? "").trim().toLowerCase();
    const start = new Date(String(d?.start ?? "")), end = new Date(String(d?.end ?? ""));
    const note = String(d?.note ?? "").trim();
    if (!UUID.test(packetId) || !tech || tech.length > 200 || isNaN(+start) || isNaN(+end) || note.length > 500) throw new Error("input");
    return { token: tok(d), packetId: packetId.toLowerCase(), tech, start, end, note };
  })
  .handler(async ({ data }) => {
    const { db, who, member, isOffice } = await officeCtx(data.token);
    if (!member || !isOffice) return { ok: false as const, reason: "forbidden" as const };
    if (data.end <= data.start || +data.end - +data.start > 24 * 3600 * 1000) return { ok: false as const, reason: "window" as const };
    const { data: pk } = await db.from("office_packets").select("id, company_id, tracking_no, captured_fields").eq("id", data.packetId).maybeSingle();
    if (!pk || pk.company_id !== member.company_id) return { ok: false as const, reason: "job" as const };
    const { data: tm } = await db.from("company_members").select("email, role").eq("company_id", member.company_id).eq("email", data.tech).maybeSingle();
    if (!tm || tm.role !== "technician") return { ok: false as const, reason: "tech" as const };
    const cf = (pk.captured_fields ?? {}) as { values?: Record<string, string>; formDefaults?: Record<string, string> };
    const v = { ...(cf.formDefaults ?? {}), ...(cf.values ?? {}) };
    const address = [v.addr, v.city].map((x) => String(x ?? "").trim()).filter(Boolean).join(", ") || null;
    const customer = String(v.name ?? "").trim() || null;
    const { data: old } = await db.from("job_assignments").select("technician_email, starts_at, ends_at").eq("packet_id", pk.id).maybeSingle();
    const startIso = data.start.toISOString(), endIso = data.end.toISOString();
    const row = { technician_email: data.tech, starts_at: startIso, ends_at: endIso, note: data.note || null, address, customer_name: customer, updated_by: who.email, updated_at: new Date().toISOString() };
    let action: "assigned" | "reassigned" | "rescheduled" | "reassigned_rescheduled" = "assigned";
    if (!old) {
      const { error } = await db.from("job_assignments").insert({ packet_id: pk.id, company_id: pk.company_id, tracking_no: pk.tracking_no, assigned_by: who.email, ...row });
      if (error) throw new Error("save");
    } else {
      const techChanged = old.technician_email !== data.tech;
      const timeChanged = +new Date(old.starts_at) !== +data.start || +new Date(old.ends_at) !== +data.end;
      action = techChanged && timeChanged ? "reassigned_rescheduled" : techChanged ? "reassigned" : "rescheduled";
      const { error } = await db.from("job_assignments").update(row).eq("packet_id", pk.id).eq("company_id", pk.company_id);
      if (error) throw new Error("save");
    }
    const { error: ae } = await db.from("job_assignment_audit").insert({
      company_id: pk.company_id, packet_id: pk.id, tracking_no: pk.tracking_no, action, actor: who.email,
      from_tech: old?.technician_email ?? null, to_tech: data.tech, from_start: old?.starts_at ?? null, to_start: startIso, from_end: old?.ends_at ?? null, to_end: endIso,
    });
    if (ae) throw new Error("audit");
    return { ok: true as const, action };
  });

/** Takes a job off its technician's schedule; the change is audited. */
export const unassignJob = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; packetId: string }) => {
    const packetId = String(d?.packetId ?? "");
    if (!UUID.test(packetId)) throw new Error("input");
    return { token: tok(d), packetId: packetId.toLowerCase() };
  })
  .handler(async ({ data }) => {
    const { db, who, member, isOffice } = await officeCtx(data.token);
    if (!member || !isOffice) return { ok: false as const, reason: "forbidden" as const };
    const { data: old } = await db.from("job_assignments").select("*").eq("packet_id", data.packetId).eq("company_id", member.company_id).maybeSingle();
    if (!old) return { ok: false as const, reason: "job" as const };
    const { error } = await db.from("job_assignments").delete().eq("packet_id", data.packetId).eq("company_id", member.company_id);
    if (error) throw new Error("save");
    const { error: ae } = await db.from("job_assignment_audit").insert({ company_id: old.company_id, packet_id: old.packet_id, tracking_no: old.tracking_no, action: "unassigned", actor: who.email, from_tech: old.technician_email, from_start: old.starts_at, from_end: old.ends_at });
    if (ae) throw new Error("audit");
    return { ok: true as const };
  });
