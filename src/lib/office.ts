import { createServerFn } from "@tanstack/react-start";

type Role = "admin" | "office" | "technician";
export type OfficeSetup = {
  me: string;
  company: { id: string; name: string; role: Role } | null;
  inbox: { email: string | null; verifiedAt: string | null; pending: string | null; pendingUntil: string | null } | null;
  members: { email: string; role: Role }[];
};

const tok = (d: unknown) => {
  const t = String((d as { token?: unknown })?.token ?? "");
  if (!t || t.length > 4000) throw new Error("input");
  return t;
};
const EMAIL = /^[a-z0-9._%+-]+@[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/;

async function ctx(token: string) {
  const { serverBackend } = await import("./backend.server");
  const office = await import("./office.server");
  const db = serverBackend();
  const who = await office.whoIs(db, token);
  const member = await office.membership(db, who.email);
  return { db, office, who, member };
}

async function readSetup(token: string): Promise<OfficeSetup> {
  const { db, who, member } = await ctx(token);
  if (!member) return { me: who.email, company: null, inbox: null, members: [] };
  const { data: co, error } = await db.from("companies").select("id, name, office_email, office_email_verified_at, pending_email, pending_expires_at").eq("id", member.company_id).single();
  if (error || !co) throw new Error("read");
  let members: OfficeSetup["members"] = [];
  if (member.role === "admin") {
    const { data } = await db.from("company_members").select("email, role").eq("company_id", member.company_id).order("added_at");
    members = (data ?? []) as OfficeSetup["members"];
  }
  return {
    me: who.email,
    company: { id: co.id, name: co.name, role: member.role },
    inbox: { email: co.office_email, verifiedAt: co.office_email_verified_at, pending: member.role === "admin" ? co.pending_email : null, pendingUntil: member.role === "admin" ? co.pending_expires_at : null },
    members,
  };
}

/** The signed-in person's company, role and the company's office inbox status. */
export const getOfficeSetup = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string }) => ({ token: tok(d) }))
  .handler(async ({ data }) => readSetup(data.token));

/** Makes a company for a signed-in person who has none; they become its admin. */
export const createCompany = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; name: string }) => {
    const name = String(d?.name ?? "").trim();
    if ([...name].length < 1 || [...name].length > 120) throw new Error("name");
    return { token: tok(d), name };
  })
  .handler(async ({ data }) => {
    const { db, who, member } = await ctx(data.token);
    if (member) return { ok: false as const, reason: "member" as const };
    const { data: co, error } = await db.from("companies").insert({ name: data.name }).select("id").single();
    if (error || !co) throw new Error("save");
    const { error: me } = await db.from("company_members").insert({ email: who.email, company_id: co.id, role: "admin" });
    if (me) { await db.from("companies").delete().eq("id", co.id); return { ok: false as const, reason: "member" as const }; }
    return { ok: true as const, setup: await readSetup(data.token) };
  });

/** Admin only: adds a person, by their sign-in address, to the admin's company as technician, office reviewer or admin. */
export const addMember = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; email: string; role: Role }) => {
    const email = String(d?.email ?? "").trim().toLowerCase();
    if (!EMAIL.test(email) || email.length > 254) throw new Error("email");
    const role = (["admin", "office", "technician"] as const).find((r) => r === d?.role);
    if (!role) throw new Error("role");
    return { token: tok(d), email, role };
  })
  .handler(async ({ data }) => {
    const { db, member } = await ctx(data.token);
    if (member?.role !== "admin") return { ok: false as const, reason: "admin" as const };
    const { error } = await db.from("company_members").insert({ email: data.email, company_id: member.company_id, role: data.role });
    if (error) return { ok: false as const, reason: error.code === "23505" ? ("taken" as const) : ("save" as const) };
    return { ok: true as const, setup: await readSetup(data.token) };
  });

/** Admin only: removes another person from the admin's own company. */
export const removeMember = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; email: string }) => ({ token: tok(d), email: String(d?.email ?? "").trim().toLowerCase().slice(0, 254) }))
  .handler(async ({ data }) => {
    const { db, who, member } = await ctx(data.token);
    if (member?.role !== "admin" || data.email === who.email) return { ok: false as const };
    const { error } = await db.from("company_members").delete().eq("email", data.email).eq("company_id", member.company_id);
    if (error) throw new Error("save");
    return { ok: true as const, setup: await readSetup(data.token) };
  });

/** Admin only: emails a one-time code to the office inbox to prove the company receives mail there. */
export const requestInboxCode = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; email: string }) => {
    const email = String(d?.email ?? "").trim().toLowerCase();
    if (!EMAIL.test(email) || email.length > 254) throw new Error("email");
    return { token: tok(d), email };
  })
  .handler(async ({ data }) => {
    const { db, office, who, member } = await ctx(data.token);
    if (member?.role !== "admin") return { ok: false as const, reason: "admin" as const };
    const { data: co } = await db.from("companies").select("name, pending_sent_at").eq("id", member.company_id).single();
    if (co?.pending_sent_at && Date.now() - new Date(co.pending_sent_at).getTime() < 60_000) return { ok: false as const, reason: "wait" as const };
    const digits = crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000;
    const code = String(digits).padStart(6, "0");
    const hash = await office.sha256(`${member.company_id}:${data.email}:${code}`);
    const { error } = await db.from("companies").update({
      pending_email: data.email, pending_code_hash: hash, pending_sent_at: new Date().toISOString(),
      pending_expires_at: new Date(Date.now() + 30 * 60_000).toISOString(), pending_attempts: 0,
    }).eq("id", member.company_id);
    if (error) throw new Error("save");
    const { sendEmail } = await import("./email.server");
    const sent = await sendEmail({
      to: data.email,
      subject: "Your PermitDraft office inbox code",
      text: `${who.email} asked to send PermitDraft Core job handoffs for ${co?.name ?? "your company"} to this address.\n\nYour code: ${code}\n\nIt works for 30 minutes. If you did not expect this, ignore this email and nothing changes.`,
      idempotencyKey: `office-inbox-${member.company_id}-${hash.slice(0, 16)}`,
    }, { capture: office.isTestPerson(who.user) });
    if (sent.status !== "queued" && sent.status !== "captured") {
      console.error("office inbox code not sent", sent.status, "message" in sent ? sent.message : "");
      await db.from("companies").update({ pending_email: null, pending_code_hash: null, pending_expires_at: null, pending_sent_at: null }).eq("id", member.company_id);
      return { ok: false as const, reason: "email" as const };
    }
    return { ok: true as const, setup: await readSetup(data.token) };
  });

/** Admin only: the code from the inbox makes it the company's verified office inbox. */
export const confirmInboxCode = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; code: string }) => ({ token: tok(d), code: String(d?.code ?? "").replace(/\s+/g, "").slice(0, 20) }))
  .handler(async ({ data }) => {
    const { db, office, who, member } = await ctx(data.token);
    if (member?.role !== "admin") return { ok: false as const, reason: "admin" as const };
    const { data: co } = await db.from("companies").select("pending_email, pending_code_hash, pending_expires_at, pending_attempts").eq("id", member.company_id).single();
    if (!co?.pending_email || !co.pending_code_hash || !co.pending_expires_at || new Date(co.pending_expires_at).getTime() < Date.now() || co.pending_attempts >= 5)
      return { ok: false as const, reason: "expired" as const };
    const hash = await office.sha256(`${member.company_id}:${co.pending_email}:${data.code}`);
    if (hash !== co.pending_code_hash) {
      await db.from("companies").update({ pending_attempts: co.pending_attempts + 1 }).eq("id", member.company_id);
      return { ok: false as const, reason: "wrong" as const };
    }
    const { error } = await db.from("companies").update({
      office_email: co.pending_email, office_email_verified_at: new Date().toISOString(), office_email_set_by: who.email,
      pending_email: null, pending_code_hash: null, pending_expires_at: null, pending_sent_at: null, pending_attempts: 0,
    }).eq("id", member.company_id).eq("pending_code_hash", co.pending_code_hash);
    if (error) throw new Error("save");
    return { ok: true as const, setup: await readSetup(data.token) };
  });
