import { useEffect, useState } from "react";
import { backend } from "../lib/backend";
import { useLang } from "../lib/lang";
import { useDemo } from "./demo";

type Row = { sent_by_name: string; sent_at: string; employee_id: string | null; photo_links: unknown[] };

/** Office review: who sent this job's packet from the phone, and when. Core only; nothing in the demo. */
export function PacketInfo({ jobId }: { jobId: string }) {
  const { t, lang } = useLang();
  const demo = useDemo();
  const [row, setRow] = useState<Row | null | undefined>(undefined);
  useEffect(() => {
    if (demo) return;
    let live = true;
    Promise.resolve(backend.from("office_packets").select("sent_by_name, sent_at, employee_id, photo_links").eq("job_id", jobId).maybeSingle())
      .then(({ data }) => { if (live) setRow((data as Row | null) ?? null); }, () => { if (live) setRow(null); });
    return () => { live = false; };
  }, [demo, jobId]);
  if (demo || row === undefined) return null;
  if (!row) return <p className="jb-meta" data-testid="packet-none">{t("Packet: not sent from the phone yet.", "Paquete: todavía no enviado desde el teléfono.")}</p>;
  const when = new Date(row.sent_at).toLocaleString(lang === "es" ? "es" : "en-US");
  return (
    <p className="jb-meta" data-testid="packet-info">
      {t(`Packet sent by ${row.sent_by_name} on ${when}`, `Paquete enviado por ${row.sent_by_name} el ${when}`)}
      {row.employee_id ? ` · ${t("Employee ID", "ID de empleado")} ${row.employee_id}` : ""}
      {` · ${t(`${row.photo_links.length} photo(s) saved`, `${row.photo_links.length} foto(s) guardada(s)`)}`}
      {` · ${t("For office review only, not permit filing.", "Solo para revisión de oficina, no para presentar el permiso.")}`}
    </p>
  );
}
