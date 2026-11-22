import { createServerFn } from "@tanstack/react-start";

/** Starts the signed-in account's one 14-day Core trial. Expiry is set by the database clock; a repeat changes nothing. */
export const startCoreTrial = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string }) => {
    const token = String(d?.token ?? "");
    if (!token || token.length > 4000) throw new Error("token");
    return { token };
  })
  .handler(async ({ data }) => {
    const { serverBackend } = await import("./backend.server");
    const db = serverBackend();
    const { data: u, error: ue } = await db.auth.getUser(data.token);
    if (ue || !u.user) throw new Error("auth");
    const { error } = await db.from("core_trials").upsert({ user_id: u.user.id }, { onConflict: "user_id", ignoreDuplicates: true });
    if (error) throw new Error("save");
    return { ok: true as const };
  });
