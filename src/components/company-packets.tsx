import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { backend } from "../lib/backend";
import { useLang } from "../lib/lang";
import { HandoffReceipt, RECEIPT_COLUMNS, type ReceiptRow } from "./handoff-receipt";

type Row = ReceiptRow & { id: string; job_id: string; sent_by_name: string; employee_id: string | null; sent_at: string };

/** Core Office Handoff: the company's finished-job packets a signed-in office reviewer or admin may open (database rules decide). */
export function CompanyPackets() {
  const { t, lang } = useLang();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [role, setRole] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    let live = true;
    (async () => {
      const { data: sess } = await backend.auth.getSession();
      const email = sess.session?.user.email?.toLowerCase();
      if (!email) { if (live) setRole(null); return; }
      const { data: m } = await backend.from("company_members").select("role, company_id").eq("email", email).maybeSingle();
      if (!live) return;
      setRole(m?.role ?? null);
      if (!m || (m.role !== "admin" && m.role !== "office")) return;
      const { data } = await backend.from("office_packets").select(`id, job_id, sent_by_name, employee_id, sent_at, ${RECEIPT_COLUMNS}`).eq("company_id", m.company_id).order("sent_at", { ascending: false }).limit(50);
      if (live) setRows((data as Row[] | null) ?? []);
    })().catch(() => { if (live) setRole(null); });
    return () => { live = false; };
  }, []);
  if (role === undefined) return null;
  return (
    <section className="ap-card" aria-labelledby="cp-h" data-testid="company-packets">
      <h2 id="cp-h" className="ap-h2">{t("Packets sent to your office", "Paquetes enviados a su oficina")}</h2>
      {role !== "admin" && role !== "office" ? (
        <p className="ap-muted">{t("Office reviewers and admins of your company see finished jobs' packets here. Company, people and office inbox: ", "Los revisores de oficina y administradores de su empresa ven aquí los paquetes de los trabajos terminados. Empresa, personas y buzón de oficina: ")}<Link to="/office-setup" className="underline font-semibold">{t("Office setup", "Configuración de oficina")}</Link></p>
      ) : rows === null ? (
        <p className="ap-muted" role="status">{t("Loading…", "Cargando…")}</p>
      ) : rows.length === 0 ? (
        <p className="ap-muted">{t("No finished jobs from your company's technicians yet.", "Todavía no hay trabajos terminados de los técnicos de su empresa.")}</p>
      ) : (
        <ul className="grid gap-2">
          {rows.map((r) => (
            <li key={r.id} data-testid="company-packet">
              <Link to="/office-review/$id" params={{ id: r.id }} className="underline font-semibold">{t("Job", "Trabajo")} {r.job_id}</Link>
              <span className="ap-muted"> · {r.sent_by_name}{r.employee_id ? ` · ${r.employee_id}` : ""} · {new Date(r.sent_at).toLocaleString(lang === "es" ? "es" : "en-US")}</span>
              <div className="mt-1"><HandoffReceipt row={r} heading={false} /></div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
