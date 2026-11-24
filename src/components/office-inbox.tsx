import { Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Bell, MessageSquare } from "lucide-react";
import { backend } from "../lib/backend";
import { useLang } from "../lib/lang";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "./ui/sheet";

export type InboxPacket = { id: string; tracking_no: string; sent_at: string; sent_by_name: string; notify_status: string | null };
type Corr = { id: string; packet_id: string; created_at: string; requested_by: string; note: string };
type Kind = "packet" | "email_failed" | "correction";
type Notice = { key: string; kind: Kind; ref: string; packetId: string; at: string; title: string; body: string };
const WINDOW_DAYS = 30;

/** Greeting by the browser's local hour and the saved profile's first name; neutral when there is no name. Set after mount so the server and browser agree. */
export function OfficeGreeting() {
  const { t } = useLang();
  const [g, setG] = useState<{ hour: number; name: string } | null>(null);
  useEffect(() => {
    let live = true;
    (async () => {
      const { data: sess } = await backend.auth.getSession();
      const uid = sess.session?.user.id;
      let name = "";
      if (uid) {
        const { data } = await backend.from("profiles").select("display_name").eq("user_id", uid).maybeSingle();
        name = String(data?.display_name ?? "").trim().split(/\s+/)[0] ?? "";
      }
      if (live) setG({ hour: new Date().getHours(), name });
    })().catch(() => { if (live) setG({ hour: new Date().getHours(), name: "" }); });
    return () => { live = false; };
  }, []);
  if (!g) return null;
  const h = g.hour;
  const word = h < 12 ? t("Good morning", "Buenos días") : h < 18 ? t("Good afternoon", "Buenas tardes") : t("Good evening", "Buenas noches");
  return <p className="ap-h2" data-testid="cc-greeting">{g.name ? `${word}, ${g.name}` : word}</p>;
}

/** Private notification and message counters for the signed-in reviewer. Read state is saved per reviewer in the database. */
export function OfficeInbox({ company, packets }: { company: string; packets: InboxPacket[] }) {
  const { t, lang } = useLang();
  const [me, setMe] = useState("");
  const [corrs, setCorrs] = useState<Corr[] | null>(null);
  const [read, setRead] = useState<Set<string> | null>(null);
  const [panel, setPanel] = useState<"notes" | "msgs" | null>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    let live = true;
    (async () => {
      const { data: sess } = await backend.auth.getSession();
      const email = sess.session?.user.email?.toLowerCase() ?? "";
      const [c, r] = await Promise.all([
        backend.from("correction_requests").select("id, packet_id, created_at, requested_by, note").eq("company_id", company).order("created_at", { ascending: false }).limit(200),
        backend.from("office_notice_reads").select("kind, ref_id").eq("company_id", company).eq("reviewer", email).limit(5000),
      ]);
      if (!live) return;
      setMe(email);
      if (c.error || r.error) { setErr(true); return; }
      setCorrs((c.data as Corr[]) ?? []);
      setRead(new Set(((r.data as { kind: string; ref_id: string }[]) ?? []).map((x) => `${x.kind}:${x.ref_id}`)));
    })().catch(() => { if (live) setErr(true); });
    return () => { live = false; };
  }, [company]);

  const locale = lang === "es" ? "es" : "en-US";
  const when = (iso: string) => new Date(iso).toLocaleString(locale, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  const { notes, msgs } = useMemo(() => {
    const since = Date.now() - WINDOW_DAYS * 86_400_000;
    const notes: Notice[] = [];
    for (const p of packets) {
      if (+new Date(p.sent_at) < since) continue;
      notes.push({ key: `packet:${p.id}`, kind: "packet", ref: p.id, packetId: p.id, at: p.sent_at, title: t(`Packet ${p.tracking_no} received`, `Paquete ${p.tracking_no} recibido`), body: t(`Sent by ${p.sent_by_name}.`, `Enviado por ${p.sent_by_name}.`) });
      if (p.notify_status === "failed") notes.push({ key: `email_failed:${p.id}`, kind: "email_failed", ref: p.id, packetId: p.id, at: p.sent_at, title: t(`Office email failed for ${p.tracking_no}`, `Falló el correo a la oficina de ${p.tracking_no}`), body: t("The packet is in your queue, but its email notice did not go out.", "El paquete está en su cola, pero no salió el aviso por correo.") });
    }
    const track = new Map(packets.map((p) => [p.id, p.tracking_no]));
    const msgs: Notice[] = (corrs ?? []).filter((c) => +new Date(c.created_at) >= since && c.requested_by.toLowerCase() !== me).map((c) => ({ key: `correction:${c.id}`, kind: "correction" as const, ref: c.id, packetId: c.packet_id, at: c.created_at, title: t(`Correction requested on ${track.get(c.packet_id) ?? "a packet"}`, `Corrección solicitada en ${track.get(c.packet_id) ?? "un paquete"}`), body: t(`${c.requested_by} asked the technician: ${c.note}`, `${c.requested_by} pidió al técnico: ${c.note}`) }));
    const byAt = (a: Notice, b: Notice) => b.at.localeCompare(a.at);
    return { notes: notes.sort(byAt), msgs: msgs.sort(byAt) };
  }, [packets, corrs, me, t]);

  const unread = (l: Notice[]) => read ? l.filter((n) => !read.has(n.key)) : [];
  const markRead = useCallback(async (l: Notice[]) => {
    const fresh = l.filter((n) => !read?.has(n.key));
    if (!fresh.length) return;
    const { error } = await backend.from("office_notice_reads").upsert(fresh.map((n) => ({ company_id: company, reviewer: me, kind: n.kind, ref_id: n.ref })), { onConflict: "company_id,reviewer,kind,ref_id", ignoreDuplicates: true });
    if (error) { setErr(true); return; }
    setErr(false);
    setRead((prev) => new Set([...(prev ?? []), ...fresh.map((n) => n.key)]));
  }, [read, company, me]);

  if (!read || !corrs) return err ? <p className="ap-muted" role="status">{t("Notifications could not be loaded.", "No se pudieron cargar las notificaciones.")}</p> : null;
  const nUnread = unread(notes).length, mUnread = unread(msgs).length;
  const list = panel === "notes" ? notes : msgs;
  const empty = panel === "notes" ? t("No packets or email problems in the last 30 days.", "No hay paquetes ni problemas de correo en los últimos 30 días.") : t("No correction requests from your teammates in the last 30 days.", "No hay solicitudes de corrección de sus compañeros en los últimos 30 días.");

  return (
    <>
      <div className="flex items-center gap-2" data-testid="cc-counters">
        <Button type="button" variant="outline" onClick={() => setPanel("notes")} aria-label={t(`Notifications, ${nUnread} unread`, `Notificaciones, ${nUnread} sin leer`)} data-testid="cc-notes-btn">
          <Bell size={18} aria-hidden /><span>{t("Notifications", "Notificaciones")}</span><span className="oh-count" data-testid="cc-notes-count">{nUnread}</span>
        </Button>
        <Button type="button" variant="outline" onClick={() => setPanel("msgs")} aria-label={t(`Messages, ${mUnread} unread`, `Mensajes, ${mUnread} sin leer`)} data-testid="cc-msgs-btn">
          <MessageSquare size={18} aria-hidden /><span>{t("Messages", "Mensajes")}</span><span className="oh-count" data-testid="cc-msgs-count">{mUnread}</span>
        </Button>
      </div>
      <Sheet open={panel !== null} onOpenChange={(o) => !o && setPanel(null)}>
        <SheetContent className="overflow-y-auto" data-testid="cc-panel">
          <SheetHeader>
            <SheetTitle>{panel === "notes" ? t("Notifications", "Notificaciones") : t("Messages", "Mensajes")}</SheetTitle>
            <SheetDescription>{panel === "notes" ? t("New packets from your technicians and failed office emails, last 30 days. Read marks are private to you.", "Paquetes nuevos de sus técnicos y correos a la oficina fallidos, últimos 30 días. Las marcas de lectura son solo suyas.") : t("Correction requests your teammates sent to technicians, last 30 days. Read marks are private to you.", "Solicitudes de corrección que sus compañeros enviaron a técnicos, últimos 30 días. Las marcas de lectura son solo suyas.")}</SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-4 grid gap-3">
            <Button type="button" variant="outline" disabled={unread(list).length === 0} onClick={() => markRead(list)} data-testid="cc-mark-all">{t("Mark all as read", "Marcar todo como leído")}</Button>
            {err && <p role="alert" className="ap-muted">{t("Could not save that. Nothing was changed.", "No se pudo guardar. No se cambió nada.")}</p>}
            {list.length === 0 && <p className="ap-muted" role="status">{empty}</p>}
            <ul className="grid gap-2" aria-label={panel === "notes" ? t("Notification list", "Lista de notificaciones") : t("Message list", "Lista de mensajes")}>
              {list.map((n) => {
                const isRead = read.has(n.key);
                return (
                  <li key={n.key} className="jb-job draft" data-testid="cc-item" data-read={isRead}>
                    <p className="jb-meta"><strong>{n.title}</strong>{!isRead && <span className="oh-count" aria-label={t("Unread", "Sin leer")}>{t("New", "Nuevo")}</span>}</p>
                    <p className="jb-meta">{n.body}</p>
                    <p className="jb-meta">{when(n.at)}</p>
                    <div className="flex flex-wrap gap-2">
                      <Link to="/office-review/$id" params={{ id: n.packetId }} className="ap-btn primary" onClick={() => markRead([n])} data-testid="cc-open">{t("Open packet", "Abrir paquete")}</Link>
                      {!isRead && <Button type="button" variant="outline" onClick={() => markRead([n])} data-testid="cc-mark">{t("Mark as read", "Marcar como leído")}</Button>}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
