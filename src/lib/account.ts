import { createServerFn } from "@tanstack/react-start";

const tok = (d: unknown) => {
  const t = String((d as { token?: unknown })?.token ?? "");
  if (!t || t.length > 4000) throw new Error("input");
  return t;
};
const PHONE = /^[0-9+()\-.\s]{7,30}$/;
const EMP = /^[A-Za-z0-9][A-Za-z0-9-]{0,39}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const clip = (v: unknown, n: number) => String(v ?? "").trim().slice(0, n);

async function ctx(token: string) {
  const { serverBackend } = await import("./backend.server");
  const office = await import("./office.server");
  const db = serverBackend();
  const who = await office.whoIs(db, token);
  const member = await office.membership(db, who.email);
  return { db, office, who, member };
}

export type Prefs = { displayName: string; workPhone: string; notifyCorrection: boolean; notifyReceipt: boolean; language: "en" | "es" | null };

/** The signed-in person's own profile settings, with the employee ID/unit their company admin assigned (read-only). */
export const getMyAccount = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string }) => ({ token: tok(d) }))
  .handler(async ({ data }) => {
    const { db, who, member } = await ctx(data.token);
    const { data: p } = await db.from("profiles").select("display_name, work_phone, notify_correction, notify_receipt, language").eq("user_id", who.user.id).maybeSingle();
    const prefs: Prefs = {
      displayName: p?.display_name ?? "", workPhone: p?.work_phone ?? "", notifyCorrection: p?.notify_correction ?? true, notifyReceipt: p?.notify_receipt ?? true,
      language: p?.language === "es" ? "es" : p?.language === "en" ? "en" : null,
    };
    return { prefs, employeeId: (member as { employee_id?: string | null } | null)?.employee_id ?? null };
  });

/** Saves the signed-in person's own profile: name, optional work phone, the two notification choices and language. */
export const saveMyAccount = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; displayName?: string; workPhone?: string; notifyCorrection?: boolean; notifyReceipt?: boolean; language?: string }) => {
    const out: { token: string; displayName?: string; workPhone?: string; notifyCorrection?: boolean; notifyReceipt?: boolean; language?: "en" | "es" } = { token: tok(d) };
    if (d.displayName !== undefined) { const n = clip(d.displayName, 80); if ([...n].length < 1) throw new Error("name"); out.displayName = n; }
    if (d.workPhone !== undefined) { const p = clip(d.workPhone, 30); if (p && !PHONE.test(p)) throw new Error("phone"); out.workPhone = p; }
    if (typeof d.notifyCorrection === "boolean") out.notifyCorrection = d.notifyCorrection;
    if (typeof d.notifyReceipt === "boolean") out.notifyReceipt = d.notifyReceipt;
    if (d.language === "en" || d.language === "es") out.language = d.language;
    return out;
  })
  .handler(async ({ data }) => {
    const { serverBackend } = await import("./backend.server");
    const db = serverBackend();
    const { data: u, error } = await db.auth.getUser(data.token);
    if (error || !u.user) throw new Error("auth");
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (data.displayName !== undefined) patch.display_name = data.displayName;
    if (data.workPhone !== undefined) patch.work_phone = data.workPhone || null;
    if (data.notifyCorrection !== undefined) patch.notify_correction = data.notifyCorrection;
    if (data.notifyReceipt !== undefined) patch.notify_receipt = data.notifyReceipt;
    if (data.language !== undefined) patch.language = data.language;
    const up = await db.from("profiles").update(patch).eq("user_id", u.user.id).select("user_id");
    if (up.error) throw new Error("save");
    if (!up.data?.length) {
      const fallback = String((u.user.user_metadata as Record<string, unknown>)?.full_name ?? u.user.email ?? "Technician").slice(0, 80);
      const ins = await db.from("profiles").insert({ user_id: u.user.id, display_name: data.displayName ?? fallback, ...patch, ...(data.displayName === undefined ? {} : {}) });
      if (ins.error) throw new Error("save");
    }
    return { ok: true as const };
  });

/** Admin only: renames the admin's own company. */
export const setCompanyName = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; name: string }) => {
    const name = clip(d?.name, 120);
    if (!name) throw new Error("name");
    return { token: tok(d), name };
  })
  .handler(async ({ data }) => {
    const { db, member } = await ctx(data.token);
    if (member?.role !== "admin") return { ok: false as const };
    const { error } = await db.from("companies").update({ name: data.name }).eq("id", member.company_id);
    return { ok: !error };
  });

/** Admin only: the company's billing address (never card details). */
export const setBillingAddress = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; line1: string; line2?: string; city: string; state: string; zip: string }) => ({
    token: tok(d), line1: clip(d?.line1, 200), line2: clip(d?.line2, 200), city: clip(d?.city, 100), state: clip(d?.state, 60), zip: clip(d?.zip, 20),
  }))
  .handler(async ({ data }) => {
    const { db, member } = await ctx(data.token);
    if (member?.role !== "admin") return { ok: false as const };
    const { error } = await db.from("companies").update({
      billing_line1: data.line1 || null, billing_line2: data.line2 || null, billing_city: data.city || null, billing_state: data.state || null, billing_zip: data.zip || null,
    }).eq("id", member.company_id);
    return { ok: !error };
  });

export const getBilling = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string }) => ({ token: tok(d) }))
  .handler(async ({ data }) => {
    const { db, member } = await ctx(data.token);
    if (member?.role !== "admin") return null;
    const { data: c } = await db.from("companies").select("billing_line1, billing_line2, billing_city, billing_state, billing_zip").eq("id", member.company_id).single();
    return { line1: c?.billing_line1 ?? "", line2: c?.billing_line2 ?? "", city: c?.billing_city ?? "", state: c?.billing_state ?? "", zip: c?.billing_zip ?? "" };
  });

/** Admin only: changes another member's role inside the admin's own company. Never one's own role. */
export const setMemberRole = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; email: string; role: string }) => {
    const role = (["admin", "office", "technician"] as const).find((r) => r === d?.role);
    if (!role) throw new Error("role");
    return { token: tok(d), email: clip(d?.email, 254).toLowerCase(), role };
  })
  .handler(async ({ data }) => {
    const { db, who, member } = await ctx(data.token);
    if (member?.role !== "admin" || data.email === who.email) return { ok: false as const, reason: "self" as const };
    const { data: rows, error } = await db.from("company_members").update({ role: data.role }).eq("email", data.email).eq("company_id", member.company_id).select("email");
    return { ok: !error && !!rows?.length, reason: "save" as const };
  });

/** Admin only: assigns (or clears) the Employee ID of a member of the admin's own company. */
export const setEmployeeId = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; email: string; employeeId: string }) => {
    const id = clip(d?.employeeId, 40);
    if (id && !EMP.test(id)) throw new Error("id");
    return { token: tok(d), email: clip(d?.email, 254).toLowerCase(), id };
  })
  .handler(async ({ data }) => {
    const { db, member } = await ctx(data.token);
    if (member?.role !== "admin") return { ok: false as const, reason: "admin" as const };
    const { data: rows, error } = await db.from("company_members").update({ employee_id: data.id || null }).eq("email", data.email).eq("company_id", member.company_id).select("email");
    if (error) return { ok: false as const, reason: error.code === "23505" ? ("taken" as const) : ("save" as const) };
    return { ok: !!rows?.length, reason: "save" as const };
  });

/** Admin or office: work phone, employee ID and name of the people in their own company only. Homeowners and the public never get it. */
export const getTeamDetails = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string }) => ({ token: tok(d) }))
  .handler(async ({ data }) => {
    const { db, member } = await ctx(data.token);
    if (!member || (member.role !== "admin" && member.role !== "office")) return { people: [] as { email: string; role: string; employeeId: string | null; phone: string; name: string }[] };
    const { data: ms } = await db.from("company_members").select("email, role, employee_id").eq("company_id", member.company_id).order("added_at");
    const list = await db.auth.admin.listUsers({ perPage: 1000 });
    const byEmail = new Map((list.data?.users ?? []).filter((u) => u.email).map((u) => [u.email!.toLowerCase(), u.id]));
    const ids = (ms ?? []).map((m) => byEmail.get(String(m.email))).filter(Boolean) as string[];
    const { data: ps } = ids.length ? await db.from("profiles").select("user_id, display_name, work_phone").in("user_id", ids) : { data: [] };
    const pm = new Map((ps ?? []).map((p) => [p.user_id as string, p]));
    return { people: (ms ?? []).map((m) => { const p = pm.get(byEmail.get(String(m.email)) ?? ""); return { email: String(m.email), role: String(m.role), employeeId: (m.employee_id as string | null) ?? null, phone: p?.work_phone ?? "", name: p?.display_name ?? "" }; }) };
  });

async function packetFor(db: Awaited<ReturnType<typeof ctx>>["db"], member: { company_id: string; role: string } | null, packetId: string) {
  if (!UUID.test(packetId) || !member || (member.role !== "admin" && member.role !== "office")) return null;
  const { data: pk } = await db.from("office_packets").select("id, job_id, user_id, company_id, sent_by_name, office_received_at").eq("id", packetId).maybeSingle();
  if (!pk || pk.company_id !== member.company_id) return null; // never across companies
  return pk;
}

async function mailSubmitter(db: Awaited<ReturnType<typeof ctx>>["db"], office: Awaited<ReturnType<typeof ctx>>["office"], userId: string, pref: "notify_correction" | "notify_receipt", subject: string, text: string, key: string) {
  const { data: p } = await db.from("profiles").select(pref).eq("user_id", userId).maybeSingle();
  if ((p as Record<string, boolean> | null)?.[pref] === false) return "off" as const;
  const { data: au } = await db.auth.admin.getUserById(userId);
  if (!au.user?.email) return "failed" as const;
  const { sendEmail } = await import("./email.server");
  // Test accounts get a no-send receipt, never a real email.
  const sent = await sendEmail({ to: au.user.email, subject, text, idempotencyKey: key }, { capture: office.isTestPerson(au.user) });
  return sent.status === "queued" || sent.status === "captured" ? ("sent" as const) : ("failed" as const);
}

/** Office reviewer or admin of the packet's company opens it: records the first receipt and tells the submitter if they chose that. */
export const markPacketReceived = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; packetId: string }) => ({ token: tok(d), packetId: clip(d?.packetId, 60) }))
  .handler(async ({ data }) => {
    const { db, office, who, member } = await ctx(data.token);
    const pk = await packetFor(db, member, data.packetId);
    if (!pk) return { ok: false as const };
    if (pk.office_received_at) return { ok: true as const, first: false };
    const { data: upd } = await db.from("office_packets").update({ office_received_at: new Date().toISOString(), office_received_by: who.email }).eq("id", pk.id).is("office_received_at", null).select("id");
    if (!upd?.length) return { ok: true as const, first: false };
    const r = await mailSubmitter(db, office, pk.user_id, "notify_receipt", "Your PermitDraft packet was received by the office",
      `The office opened the packet for job ${pk.job_id}. You can see its status under My recent handoffs in your PermitDraft profile.`, `packet-received-${pk.id}`);
    return { ok: true as const, first: true, notice: r };
  });

/** Office reviewer or admin asks the technician for a correction on a packet of their own company. */
export const requestCorrection = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; packetId: string; note: string }) => {
    const note = clip(d?.note, 1000);
    if (!note) throw new Error("note");
    return { token: tok(d), packetId: clip(d?.packetId, 60), note };
  })
  .handler(async ({ data }) => {
    const { db, office, who, member } = await ctx(data.token);
    const pk = await packetFor(db, member, data.packetId);
    if (!pk || !member) return { ok: false as const };
    const { data: row, error } = await db.from("correction_requests").insert({ packet_id: pk.id, user_id: pk.user_id, company_id: member.company_id, requested_by: who.email, note: data.note }).select("id").single();
    if (error || !row) return { ok: false as const };
    const r = await mailSubmitter(db, office, pk.user_id, "notify_correction", "The office asked for a correction on your job packet",
      `The office asked for a correction on the packet for job ${pk.job_id}:\n\n${data.note}\n\nSee it under My recent handoffs in your PermitDraft profile.`, `correction-${row.id}`);
    await db.from("correction_requests").update({ notify_status: r }).eq("id", row.id);
    return { ok: true as const, notice: r };
  });
