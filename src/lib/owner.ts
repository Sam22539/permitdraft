import { createServerFn } from "@tanstack/react-start";

export type OwnerCompany = {
  id: string;
  name: string;
  createdAt: string;
  members: number;
  admins: number;
  inbox: "verified" | "pending" | "none";
};
export type OwnerView = { ok: true; companies: OwnerCompany[] } | { ok: false };

/**
 * Read-only platform-owner overview. The asker is identified only by the verified account behind their session token;
 * owner status is read on the server from the admins table. Anything else, including any error, answers { ok: false }.
 */
export const getOwnerDashboard = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => {
    const t = String((d as { token?: unknown })?.token ?? "");
    if (!t || t.length > 4000) throw new Error("input");
    return { token: t };
  })
  .handler(async ({ data }): Promise<OwnerView> => {
    try {
      const { serverBackend } = await import("./backend.server");
      const db = serverBackend();
      const { data: u, error } = await db.auth.getUser(data.token);
      const email = u?.user?.email?.toLowerCase();
      if (error || !email) return { ok: false };
      const { data: owner, error: oe } = await db.from("admins").select("email").eq("email", email).maybeSingle();
      if (oe || !owner) return { ok: false };
      const { data: cos, error: ce } = await db
        .from("companies")
        .select("id, name, created_at, office_email_verified_at, pending_email, pending_expires_at")
        .order("name");
      if (ce) return { ok: false };
      const { data: mem, error: me } = await db.from("company_members").select("company_id, role");
      if (me) return { ok: false };
      const counts = new Map<string, { n: number; a: number }>();
      for (const m of (mem ?? []) as { company_id: string; role: string }[]) {
        const c = counts.get(m.company_id) ?? { n: 0, a: 0 };
        c.n++; if (m.role === "admin") c.a++;
        counts.set(m.company_id, c);
      }
      const now = Date.now();
      const companies = ((cos ?? []) as { id: string; name: string; created_at: string; office_email_verified_at: string | null; pending_email: string | null; pending_expires_at: string | null }[]).map((c): OwnerCompany => ({
        id: c.id,
        name: c.name,
        createdAt: c.created_at,
        members: counts.get(c.id)?.n ?? 0,
        admins: counts.get(c.id)?.a ?? 0,
        inbox: c.office_email_verified_at ? "verified" : c.pending_email && c.pending_expires_at && Date.parse(c.pending_expires_at) > now ? "pending" : "none",
      }));
      return { ok: true, companies };
    } catch {
      return { ok: false };
    }
  });
