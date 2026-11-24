import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { backend } from "../lib/backend";
import { useLang } from "../lib/lang";
import { HandoffReceipt, RECEIPT_COLUMNS, type ReceiptRow } from "./handoff-receipt";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

type Row = ReceiptRow & { id: string; job_id: string; sent_by_name: string; employee_id: string | null; sent_at: string; captured_fields: { values?: Record<string, string>; formDefaults?: Record<string, string> } | null };
type Crm = { packet_id: string; stage: string; next_follow_up: string | null; note: string | null; permit_ref: string | null; updated_at: string };

const STAGES: [string, string, string][] = [
  ["new", "Not started", "Sin iniciar"],
  ["preparing", "Preparing paperwork", "Preparando documentos"],
  ["submitted", "Submitted (recorded by office)", "Presentado (anotado por la oficina)"],
  ["approved", "Approved (recorded by office)", "Aprobado (anotado por la oficina)"],
  ["inspection", "Inspection stage", "Etapa de inspección"],
  ["closed", "Closed", "Cerrado"],
];

function Follow({ row, crm, company, onSaved }: { row: Row; crm: Crm | undefined; company: string; onSaved: (c: Crm) => void }) {
  const { t } = useLang();
  const [stage, setStage] = useState(crm?.stage ?? "new");
  const [date, setDate] = useState(crm?.next_follow_up ?? "");
  const [note, setNote] = useState(crm?.note ?? "");
  const [ref, setRef] = useState(crm?.permit_ref ?? "");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const save = async () => {
    setBusy(true); setMsg(null);
    const { data: sess } = await backend.auth.getSession();
    const vals = { stage, next_follow_up: date || null, note: note.trim() || null, permit_ref: ref.trim() || null, updated_by: sess.session?.user.email ?? null, updated_at: new Date().toISOString() };
    const { error } = crm
      ? await backend.from("packet_crm").update(vals).eq("packet_id", row.id)
      : await backend.from("packet_crm").insert({ packet_id: row.id, company_id: company, ...vals });
    setBusy(false);
    if (error) { setMsg(t("Not saved. Check your role and try again.", "No se guardó. Revise su rol e intente de nuevo.")); return; }
    onSaved({ packet_id: row.id, stage, next_follow_up: vals.next_follow_up, note: vals.note, permit_ref: vals.permit_ref, updated_at: vals.updated_at });
    setMsg(t("Saved.", "Guardado."));
  };
  return (
    <div className="grid gap-2 mt-2" data-testid="crm-form">
      <p className="ap-muted">{t("Stages are recorded by your office by hand. They are not read from email or packet status, and not from any city system.", "Su oficina anota las etapas a mano. No se leen del correo ni del estado del paquete, ni de ningún sistema de la ciudad.")}</p>
      <label htmlFor={`st-${row.id}`}>{t("Stage", "Etapa")}</label>
      <Select value={stage} onValueChange={setStage}>
        <SelectTrigger id={`st-${row.id}`} data-testid="crm-stage"><SelectValue /></SelectTrigger>
        <SelectContent>{STAGES.map(([k, en, es]) => <SelectItem key={k} value={k}>{t(en, es)}</SelectItem>)}</SelectContent>
      </Select>
      <label htmlFor={`fu-${row.id}`}>{t("Next follow-up date", "Próxima fecha de seguimiento")}</label>
      <Input id={`fu-${row.id}`} type="date" value={date} onChange={(e) => setDate(e.target.value)} data-testid="crm-date" />
      <label htmlFor={`pr-${row.id}`}>{t("Permit reference (optional)", "Referencia del permiso (opcional)")}</label>
      <Input id={`pr-${row.id}`} value={ref} maxLength={80} onChange={(e) => setRef(e.target.value)} data-testid="crm-ref" />
      <label htmlFor={`nt-${row.id}`}>{t("Internal note (office and admins only)", "Nota interna (solo oficina y administradores)")}</label>
      <Textarea id={`nt-${row.id}`} value={note} maxLength={2000} onChange={(e) => setNote(e.target.value)} data-testid="crm-note" />
      <div>
        <Button type="button" onClick={save} disabled={busy} data-testid="crm-save">{t("Save follow-up", "Guardar seguimiento")}</Button>
        {msg && <span role="status" className="ap-muted"> {msg}</span>}
      </div>
    </div>
  );
}

/** Core Office Handoff: the company's finished-job packets a signed-in office reviewer or admin may open, with a manual follow-up record (database rules decide). */
export function CompanyPackets() {
  const { t, lang } = useLang();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [crm, setCrm] = useState<Record<string, Crm>>({});
  const [company, setCompany] = useState("");
  const [role, setRole] = useState<string | null | undefined>(undefined);
  const [q, setQ] = useState("");
  const [fs, setFs] = useState("all");
  const [open, setOpen] = useState<string | null>(null);
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
      setCompany(m.company_id);
      const { data } = await backend.from("office_packets").select(`id, job_id, sent_by_name, employee_id, sent_at, captured_fields, ${RECEIPT_COLUMNS}`).eq("company_id", m.company_id).order("sent_at", { ascending: false }).limit(200);
      const { data: c } = await backend.from("packet_crm").select("packet_id, stage, next_follow_up, note, permit_ref, updated_at").eq("company_id", m.company_id);
      if (!live) return;
      setCrm(Object.fromEntries(((c as Crm[] | null) ?? []).map((x) => [x.packet_id, x])));
      setRows((data as Row[] | null) ?? []);
    })().catch(() => { if (live) setRole(null); });
    return () => { live = false; };
  }, []);
  const shown = useMemo(() => {
    const n = q.trim().toLowerCase();
    return (rows ?? []).filter((r) => {
      const v = { ...(r.captured_fields?.formDefaults ?? {}), ...(r.captured_fields?.values ?? {}) };
      const hay = [r.job_id, v.name, v.addr, v.city].filter(Boolean).join(" ").toLowerCase();
      return (!n || hay.includes(n)) && (fs === "all" || (crm[r.id]?.stage ?? "new") === fs);
    });
  }, [rows, q, fs, crm]);
  if (role === undefined) return null;
  const stageName = (k: string) => { const s = STAGES.find((x) => x[0] === k) ?? STAGES[0]; return t(s[1], s[2]); };
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
        <>
          <label htmlFor="cp-q">{t("Search customer, site or job number", "Buscar cliente, sitio o número de trabajo")}</label>
          <Input id="cp-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" data-testid="cp-search" />
          <label htmlFor="cp-fs">{t("Stage", "Etapa")}</label>
          <Select value={fs} onValueChange={setFs}>
            <SelectTrigger id="cp-fs" data-testid="cp-filter"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("All stages", "Todas las etapas")}</SelectItem>
              {STAGES.map(([k, en, es]) => <SelectItem key={k} value={k}>{t(en, es)}</SelectItem>)}
            </SelectContent>
          </Select>
          {shown.length === 0 && <p className="ap-muted" role="status">{t("No packets match.", "Ningún paquete coincide.")}</p>}
          <ul className="grid gap-3">
            {shown.map((r) => {
              const v = { ...(r.captured_fields?.formDefaults ?? {}), ...(r.captured_fields?.values ?? {}) };
              const c = crm[r.id];
              return (
                <li key={r.id} data-testid="company-packet">
                  <Link to="/office-review/$id" params={{ id: r.id }} className="underline font-semibold">{t("Job", "Trabajo")} {r.job_id}</Link>
                  <span className="ap-muted"> · {[v.name, [v.addr, v.city].filter(Boolean).join(", ")].filter(Boolean).join(" · ")}{v.name || v.addr ? " · " : ""}{r.sent_by_name}{r.employee_id ? ` · ${r.employee_id}` : ""} · {new Date(r.sent_at).toLocaleString(lang === "es" ? "es" : "en-US")}</span>
                  <div className="ap-muted" data-testid="crm-summary">{stageName(c?.stage ?? "new")}{c?.next_follow_up ? ` · ${t("Follow up", "Seguimiento")} ${c.next_follow_up}` : ""}{c?.permit_ref ? ` · ${t("Permit ref", "Ref. permiso")} ${c.permit_ref}` : ""}</div>
                  <div className="mt-1"><HandoffReceipt row={r} heading={false} /></div>
                  <Button type="button" variant="outline" className="mt-1" aria-expanded={open === r.id} onClick={() => setOpen(open === r.id ? null : r.id)} data-testid="crm-open">{open === r.id ? t("Close follow-up", "Cerrar seguimiento") : t("Follow-up", "Seguimiento")}</Button>
                  {open === r.id && <Follow row={r} crm={c} company={company} onSaved={(n) => setCrm((p) => ({ ...p, [r.id]: n }))} />}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}
