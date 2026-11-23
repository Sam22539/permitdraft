import { useEffect, useState } from "react";
import { backend } from "../lib/backend";
import { useLang } from "../lib/lang";
import { useDemo } from "./demo";
import { useCaptured } from "../lib/captured";
import { Link } from "@tanstack/react-router";
import { retryOfficeNotice } from "../lib/packet";

type Notice = "saved" | "sending" | "accepted" | "failed" | "not_configured" | null;
type Row = { sent_by_name: string; sent_at: string; employee_id: string | null; photo_links: unknown[]; notify_status: Notice };

/** Office review: who sent this job's packet from the phone, and when. Core only; nothing in the demo. */
export function PacketInfo({ jobId }: { jobId: string }) {
  const { t, lang } = useLang();
  const demo = useDemo();
  const [row, setRow] = useState<Row | null | undefined>(undefined);
  const captured = useCaptured();
  const [busy, setBusy] = useState(false);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (demo) return;
    let live = true;
    backend.auth.getSession().then(({ data: sess }) => { const sessionUser = sess.session?.user.id; return Promise.resolve(backend.from("office_packets").select("sent_by_name, sent_at, employee_id, photo_links, notify_status").eq("user_id", sessionUser ?? "").eq("job_id", jobId).maybeSingle())
      .then(({ data }) => { if (live) setRow((data as Row | null) ?? null); }); }).catch(() => { if (live) setRow(null); });
    return () => { live = false; };
  }, [demo, jobId, tick]);
  // While the office email is being handed over, look again shortly.
  useEffect(() => {
    if (row?.notify_status !== "sending") return;
    const h = setTimeout(() => setTick((n) => n + 1), 4000);
    return () => clearTimeout(h);
  }, [row?.notify_status]);
  const retry = async () => {
    setBusy(true);
    try {
      const { data: sess } = await backend.auth.getSession();
      const token = sess.session?.access_token;
      if (token) await retryOfficeNotice({ data: { token, jobId } });
    } catch { /* the status read below says what stands */ }
    setBusy(false); setTick((n) => n + 1);
  };
  if (demo) {
    // Demo: the identifier entered before the final handoff, kept with the practice job in this browser.
    const by = captured.find((c) => c.id === jobId)?.submittedBy;
    if (!by) return null;
    return (
      <div className="jb-meta" data-testid="submitted-by">
        <p><strong>{t("Submitted by", "Enviado por")}</strong></p>
        <p>{t("Employee ID", "ID de empleado")} <span data-testid="submitted-by-id">{by}</span></p>
      </div>
    );
  }
  if (row === undefined) return null;
  if (!row) return <p className="jb-meta" data-testid="packet-none">{t("Packet: not sent from the phone yet.", "Paquete: todavía no enviado desde el teléfono.")}</p>;
  const when = new Date(row.sent_at).toLocaleString(lang === "es" ? "es" : "en-US");
  const n = row.notify_status;
  return (
    <>
    <p className="jb-meta" data-testid="packet-info">
      {t(`Packet sent by ${row.sent_by_name} on ${when}`, `Paquete enviado por ${row.sent_by_name} el ${when}`)}
      {row.employee_id ? ` · ${t("Employee ID", "ID de empleado")} ${row.employee_id}` : ""}
      {` · ${t(`${row.photo_links.length} photo(s) saved`, `${row.photo_links.length} foto(s) guardada(s)`)}`}
      {` · ${t("For office review only, not permit filing.", "Solo para revisión de oficina, no para presentar el permiso.")}`}
    </p>
    <p className="jb-meta" role="status" data-testid="office-email-status" data-status={n ?? "legacy"}>
      {n === null && t("Packet saved privately. No office email: it was saved before office emails started.", "Paquete guardado en privado. Sin correo a la oficina: se guardó antes de que empezaran los correos.")}
      {n === "saved" && t("Packet saved. Office email not sent yet.", "Paquete guardado. El correo a la oficina todavía no se envió.")}
      {n === "sending" && t("Packet saved. Sending the office email…", "Paquete guardado. Enviando el correo a la oficina…")}
      {n === "accepted" && t("Packet saved. Office email accepted for delivery to your company's verified office inbox.", "Paquete guardado. Correo a la oficina aceptado para entrega en el buzón verificado de su empresa.")}
      {n === "failed" && t("Packet saved. The office email failed, so the office has not been told.", "Paquete guardado. El correo a la oficina falló, así que la oficina no fue avisada.")}
      {n === "not_configured" && <>{t("Packet saved. Office email not sent: your company has no verified office inbox yet. ", "Paquete guardado. Correo a la oficina no enviado: su empresa todavía no tiene un buzón de oficina verificado. ")}<Link to="/office-setup" className="underline font-semibold">{t("Office setup", "Configuración de oficina")}</Link></>}
    </p>
    {(n === "failed" || n === "not_configured" || n === "saved") && (
      <button type="button" className="ap-btn ghost" disabled={busy} onClick={() => { void retry(); }} data-testid="office-email-retry">{busy ? t("Trying…", "Intentando…") : t("Try the office email again", "Intentar de nuevo el correo a la oficina")}</button>
    )}
    </>
  );
}
