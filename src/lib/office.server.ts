// Server-only helpers for company scoping and the office handoff email. Import only inside server handlers.
import type { SupabaseClient, User } from "@supabase/supabase-js";

export type Role = "admin" | "office" | "technician";
export type Member = { email: string; company_id: string; role: Role; employee_id?: string | null };

/** Who is asking: the signed-in account from its token, by its confirmed sign-in address. */
export async function whoIs(db: SupabaseClient, token: string): Promise<{ user: User; email: string }> {
  const { data, error } = await db.auth.getUser(token);
  if (error || !data.user || !data.user.email) throw new Error("auth");
  // Company access follows a confirmed address only: an account whose email is not yet confirmed is nobody's member.
  if (!data.user.email_confirmed_at) throw new Error("auth");
  return { user: data.user, email: data.user.email.toLowerCase() };
}

/** The asker's company membership, read on the server from their verified address, never from the page. */
export async function membership(db: SupabaseClient, email: string): Promise<Member | null> {
  const { data, error } = await db.from("company_members").select("email, company_id, role, employee_id").eq("email", email).maybeSingle();
  if (error) throw new Error("read");
  return (data as Member | null) ?? null;
}

/** Foundable's check people are never sent real email: their emails are stored as no-send receipts. */
export function isTestPerson(user: User): boolean {
  return (user.app_metadata as Record<string, unknown> | undefined)?.foundable_test_player === true;
}

const PACKET_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * The whole working address of one saved packet's office review page. Published, it is the live site's configured address
 * (FOUNDABLE_SITE_URL) plus /office-review/<id>; in a Foundable preview it is the preview's own page link for that path.
 * It is checked before use: https, and naming this packet's own page (as its path or the preview's page). Never the
 * request's origin. It throws where no such address exists, so the notice is not sent with a generic or wrong link.
 */
export async function packetLink(packetId: string): Promise<string> {
  if (!PACKET_ID.test(packetId)) throw new Error("packet id");
  const path = `/office-review/${packetId.toLowerCase()}`;
  const live = process.env.FOUNDABLE_SITE_URL, preview = process.env.FOUNDABLE_PREVIEW_PAGES_URL;
  let link: string;
  if (live && !preview) {
    const u = new URL(path, live);
    link = u.href;
  } else {
    const { pageLink } = await import("./email.server");
    link = pageLink(path);
  }
  const u = new URL(link);
  const names = u.pathname === path || u.searchParams.get("page") === path;
  if (u.protocol !== "https:" || !u.hostname.includes(".") || !names) throw new Error("This website has no working address for the packet page.");
  return link;
}

const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export type NoticeStatus = "saved" | "sending" | "accepted" | "failed" | "not_configured" | "legacy";

/**
 * Sends the one office notice for a packet, at most once: the database claims it atomically (office_notice_claim),
 * the email carries a fixed idempotency key so a retry after an unknown outcome replays the same receipt, and the outcome
 * is written back only onto the claim. Answers the packet's notice status.
 */
export async function sendOfficeNotice(db: SupabaseClient, packetId: string, sentAt: string, capture: boolean): Promise<NoticeStatus> {
  const { data: claim, error } = await db.rpc("office_notice_claim", { p_packet: packetId });
  if (error || !claim) { console.error("office notice claim failed", error?.message); return "failed"; }
  const c = claim as { action: string; status: NoticeStatus; to?: string; key?: string };
  if (c.action !== "send" || !c.to || !c.key) return c.status;
  const { sendEmail } = await import("./email.server");
  let link: string;
  try { link = await packetLink(packetId); } catch (e) {
    await db.rpc("office_notice_done", { p_packet: packetId, p_status: "failed", p_error: "This website has no page address yet.", p_receipt: null });
    console.error("office notice: no page link", e);
    return "failed";
  }
  const when = new Date(sentAt).toUTCString();
  const { data: pkRow } = await db.from("office_packets").select("sent_by_name, employee_id").eq("id", packetId).maybeSingle();
  const by = `${pkRow?.sent_by_name ?? "Technician"}${pkRow?.employee_id ? ` (ID ${pkRow.employee_id})` : ""}`;
  const sent = await sendEmail({
    to: c.to,
    subject: "A job packet is ready for office review",
    text: `A technician finished a job in PermitDraft Core and its packet is ready for office review.\n\nSubmitted by: ${by}\nSubmitted: ${when}\nPacket: ${packetId}\n\nOpen this packet, signed in with your company account:\n${link}\n\nThe packet is only shown to signed-in office reviewers of your company. Draft for office review only, not permit filing.`,
    html: `<p>A technician finished a job in PermitDraft Core and its packet is ready for office review.</p><p>Submitted by: ${esc(by)}<br>Submitted: ${esc(when)}<br>Packet: ${esc(packetId)}</p><p>Open this packet, signed in with your company account:<br><a href="${esc(link)}">${esc(link)}</a></p><p>The packet is only shown to signed-in office reviewers of your company. Draft for office review only, not permit filing.</p>`,
    idempotencyKey: c.key,
  }, { capture });
  const ok = sent.status === "queued" || sent.status === "captured";
  const receipt = sent.status === "captured" ? sent.id : null;
  const why = ok ? null : sent.status === "suppressed" ? "The office address unsubscribed from these emails." : "message" in sent ? sent.message : "Not sent.";
  if (!ok) console.error("office notice not accepted", sent.status, why);
  const { error: de } = await db.rpc("office_notice_done", { p_packet: packetId, p_status: ok ? "accepted" : "failed", p_error: why, p_receipt: receipt });
  if (de) console.error("office notice outcome not saved", de.message);
  return ok ? "accepted" : "failed";
}

export async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
