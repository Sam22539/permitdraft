import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { backend } from "../lib/backend";
import { useLang } from "../lib/lang";
import { usd } from "../lib/invoice-stats";

type Inv = { id: string; number: string; total_cents: number; paid_on: string | null };

/** Paid invoices recorded for one job's packet. Drafts are not listed; the database shows them only to the company's office. */
export function JobInvoices({ packetId, to = "/invoices" }: { packetId: string; to?: string }) {
  const { t } = useLang();
  const [rows, setRows] = useState<Inv[] | null>(null);
  useEffect(() => {
    let live = true;
    setRows(null);
    Promise.resolve(backend.from("invoices").select("id, number, total_cents, paid_on").eq("packet_id", packetId).eq("status", "paid").order("paid_on", { ascending: false })).then((r) => { if (live) setRows(r.error ? [] : (r.data as Inv[])); });
    return () => { live = false; };
  }, [packetId]);
  return (
    <div className="crm-drawer-sec" data-testid="job-invoices">
      <h3 className="crm-h3">{t("Invoices for this job", "Facturas de este trabajo")}</h3>
      {rows === null ? <p className="crm-note" role="status">{t("Loading…", "Cargando…")}</p>
        : rows.length === 0 ? <p className="crm-note" data-testid="job-invoices-none">{t("No paid invoice recorded for this job.", "No hay factura pagada registrada para este trabajo.")}</p>
        : <ul className="crm-note">{rows.map((i) => <li key={i.id} data-testid="job-invoice">{i.number} · {usd(i.total_cents)} · {t("paid", "pagada")} {i.paid_on}</li>)}</ul>}
      <p className="ap-muted"><Link to={to as never} className="underline font-semibold">{t("Open Invoices", "Abrir Facturas")}</Link></p>
    </div>
  );
}
