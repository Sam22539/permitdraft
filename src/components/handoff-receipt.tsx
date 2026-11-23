import { useLang } from "../lib/lang";

export type ReceiptRow = {
  notify_status: string | null;
  notify_accepted_at: string | null;
  notify_claimed_at: string | null;
  office_received_at: string | null;
  open_tracked: boolean;
};
export const RECEIPT_COLUMNS = "notify_status, notify_accepted_at, notify_claimed_at, office_received_at, open_tracked";

/** A send that claimed its turn but never reported back for this long has an unknown outcome. */
const STALE_MS = 2 * 60_000;

/** The Handoff receipt: two separate facts. The office notification (email service answer) and the packet opening (an authorised reviewer's intentional open). */
export function HandoffReceipt({ row, heading = true }: { row: ReceiptRow; heading?: boolean }) {
  const { t, lang } = useLang();
  const fmt = (v: string) => new Date(v).toLocaleString(lang === "es" ? "es" : "en-US");
  const n = row.notify_status;
  const stale = n === "sending" && (!row.notify_claimed_at || Date.now() - new Date(row.notify_claimed_at).getTime() > STALE_MS);
  const mail = n === "accepted" && row.notify_accepted_at ? ["sent", t(`Office notification sent · ${fmt(row.notify_accepted_at)}`, `Aviso a la oficina enviado · ${fmt(row.notify_accepted_at)}`)]
    : n === "accepted" ? ["sent", t("Office notification sent", "Aviso a la oficina enviado")]
    : n === "failed" ? ["failed", t("Send failed: the office has not been told", "Envío fallido: la oficina no fue avisada")]
    : stale ? ["unknown", t("Unknown: the send result was never confirmed", "Desconocido: el resultado del envío no se confirmó")]
    : n === "sending" ? ["sending", t("Sending the office notification…", "Enviando el aviso a la oficina…")]
    : n === "saved" ? ["saved", t("Saved, notification not sent yet", "Guardado, aviso aún no enviado")]
    : n === "not_configured" ? ["pending", t("Saved, notification pending: no verified office inbox yet", "Guardado, aviso pendiente: aún no hay buzón de oficina verificado")]
    : ["unknown", t("Unknown: saved before send results were recorded", "Desconocido: guardado antes de registrar los resultados de envío")];
  const open = row.office_received_at ? ["opened", t(`Opened by office · ${fmt(row.office_received_at)}`, `Abierto por la oficina · ${fmt(row.office_received_at)}`)]
    : row.open_tracked ? ["not-opened", t("Not opened yet", "Aún no abierto")]
    : ["unknown", t("Unknown: saved before openings were recorded", "Desconocido: guardado antes de registrar las aperturas")];
  return (
    <div className="grid gap-1" data-testid="handoff-receipt" role="group" aria-label={t("Handoff receipt", "Recibo de entrega")}>
      {heading && <strong>{t("Handoff receipt", "Recibo de entrega")}</strong>}
      <span role="status" data-testid="receipt-notify" data-state={mail[0]}>{t("Email to office: ", "Correo a la oficina: ")}{mail[1]}</span>
      <span role="status" data-testid="receipt-open" data-state={open[0]}>{t("Packet: ", "Paquete: ")}{open[1]}</span>
      <span className="ap-muted">{t("“Opened” means a signed-in office reviewer opened the packet here, not the email. “Sent” means the email service accepted it, not that it arrived or was read. Not permit filing.", "«Abierto» significa que un revisor de oficina con sesión abrió el paquete aquí, no el correo. «Enviado» significa que el servicio de correo lo aceptó, no que llegó o se leyó. No es presentación del permiso.")}</span>
    </div>
  );
}
