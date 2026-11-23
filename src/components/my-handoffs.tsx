import { useEffect, useState } from "react";
import { backend } from "../lib/backend";
import { useLang } from "../lib/lang";

type Row = { id: string; job_id: string; sent_at: string; notify_status: string | null; office_received_at: string | null; corrections: number };

/** The signed-in person's own finished-job packets, newest first, with the office's real status (database rules show each person only their own). */
export function MyHandoffs({ limit }: { limit?: number }) {
  const { t, lang } = useLang();
  const [rows, setRows] = useState<Row[] | null>(null);
  useEffect(() => {
    let live = true;
    (async () => {
      const { data: s } = await backend.auth.getSession();
      const uid = s.session?.user.id;
      if (!uid) { if (live) setRows([]); return; }
      let q = backend.from("office_packets").select("id, job_id, sent_at, notify_status, office_received_at").eq("user_id", uid).order("sent_at", { ascending: false });
      if (limit) q = q.limit(limit);
      const { data } = await q;
      const list = (data ?? []) as Omit<Row, "corrections">[];
      const ids = list.map((r) => r.id);
      const { data: cr } = ids.length ? await backend.from("correction_requests").select("packet_id").in("packet_id", ids) : { data: [] };
      const count = new Map<string, number>();
      for (const c of (cr ?? []) as { packet_id: string }[]) count.set(c.packet_id, (count.get(c.packet_id) ?? 0) + 1);
      if (live) setRows(list.map((r) => ({ ...r, corrections: count.get(r.id) ?? 0 })));
    })().catch(() => { if (live) setRows([]); });
    return () => { live = false; };
  }, [limit]);
  const status = (r: Row) => r.corrections > 0 ? t("Office asked for a correction", "La oficina pidió una corrección")
    : r.office_received_at ? t("Opened by the office", "Abierto por la oficina")
    : r.notify_status === "accepted" ? t("Sent to the office", "Enviado a la oficina")
    : t("Saved · office not notified yet", "Guardado · oficina aún sin aviso");
  if (rows === null) return <p className="ap-muted" role="status">{t("Loading…", "Cargando…")}</p>;
  if (rows.length === 0) return <p className="ap-muted" data-testid="handoffs-empty">{t("No finished jobs sent yet.", "Todavía no ha enviado trabajos terminados.")}</p>;
  return (
    <ul className="grid gap-3" data-testid="my-handoffs">
      {rows.map((r) => (
        <li key={r.id} className="grid" data-testid="my-handoff">
          <strong>{t("Job", "Trabajo")} {r.job_id}</strong>
          <span className="ap-muted">{t("Sent", "Enviado")} {new Date(r.sent_at).toLocaleString(lang === "es" ? "es" : "en-US")}</span>
          <span data-testid="my-handoff-status">{status(r)}</span>
        </li>
      ))}
    </ul>
  );
}
