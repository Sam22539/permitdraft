import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { backend } from "../lib/backend";
import { useLang } from "../lib/lang";
import { HandoffReceipt, RECEIPT_COLUMNS, type ReceiptRow } from "./handoff-receipt";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

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

type View = "attention" | "all" | "closed";
/** What the office should do next, worked out only from the packet, its manual follow-up record and local calendar days. */
type Kind = "overdue" | "today" | "review" | "scheduled" | "nodate" | "closed";

/** Today's local calendar day as YYYY-MM-DD (not UTC). */
const localDay = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
/** Whole calendar days from a to b, both YYYY-MM-DD. */
const dayDiff = (a: string, b: string) => {
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86_400_000);
};

function kindOf(r: Row, c: Crm | undefined, today: string): Kind {
  const stage = c?.stage ?? "new";
  const fu = c?.next_follow_up ?? null;
  if (stage === "closed") return "closed";
  if (fu && fu < today) return "overdue";
  if (fu && fu === today) return "today";
  if (stage === "new" && !r.office_received_at && r.open_tracked) return "review";
  return fu ? "scheduled" : "nodate";
}

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
    <div className="oh-form" data-testid="crm-form">
      <p className="ap-muted">{t("Stages are recorded by your office by hand. They are not read from email or packet status, and not from any city system.", "Su oficina anota las etapas a mano. No se leen del correo ni del estado del paquete, ni de ningún sistema de la ciudad.")}</p>
      <div className="oh-form-grid">
        <div className="ap-field">
          <label htmlFor={`st-${row.id}`}>{t("Stage", "Etapa")}</label>
          <Select value={stage} onValueChange={setStage}>
            <SelectTrigger id={`st-${row.id}`} className="oh-select" data-testid="crm-stage"><SelectValue /></SelectTrigger>
            <SelectContent>{STAGES.map(([k, en, es]) => <SelectItem key={k} value={k}>{t(en, es)}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="ap-field">
          <label htmlFor={`fu-${row.id}`}>{t("Next follow-up date", "Próxima fecha de seguimiento")}</label>
          <Input id={`fu-${row.id}`} type="date" value={date} onChange={(e) => setDate(e.target.value)} data-testid="crm-date" />
        </div>
      </div>
      <div className="ap-field">
        <label htmlFor={`pr-${row.id}`}>{t("Permit reference (optional)", "Referencia del permiso (opcional)")}</label>
        <Input id={`pr-${row.id}`} value={ref} maxLength={80} onChange={(e) => setRef(e.target.value)} data-testid="crm-ref" />
      </div>
      <div className="ap-field">
        <label htmlFor={`nt-${row.id}`}>{t("Internal note (office and admins only)", "Nota interna (solo oficina y administradores)")}</label>
        <Textarea id={`nt-${row.id}`} value={note} maxLength={2000} onChange={(e) => setNote(e.target.value)} data-testid="crm-note" />
      </div>
      <div className="oh-save">
        <Button type="button" onClick={save} disabled={busy} data-testid="crm-save">{t("Save follow-up", "Guardar seguimiento")}</Button>
        {msg && <span role="status" className="ap-muted">{msg}</span>}
      </div>
    </div>
  );
}

/** Core Office Handoff: the company's finished-job packets a signed-in office reviewer or admin may open, with a manual follow-up record (database rules decide). */
export function CompanyPackets() {
  const { t, lang } = useLang();
  const locale = lang === "es" ? "es" : "en-US";
  const [rows, setRows] = useState<Row[] | null>(null);
  const [crm, setCrm] = useState<Record<string, Crm>>({});
  const [company, setCompany] = useState("");
  const [role, setRole] = useState<string | null | undefined>(undefined);
  const [q, setQ] = useState("");
  const [fs, setFs] = useState("all");
  const [view, setView] = useState<View>("attention");
  const [open, setOpen] = useState<string | null>(null);
  const [today, setToday] = useState(() => localDay());
  useEffect(() => {
    // Keep "today" on the local calendar even if the page stays open past midnight.
    const id = setInterval(() => setToday(localDay()), 60_000);
    return () => clearInterval(id);
  }, []);
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

  const items = useMemo(() => (rows ?? []).map((r) => {
    const v = { ...(r.captured_fields?.formDefaults ?? {}), ...(r.captured_fields?.values ?? {}) };
    const c = crm[r.id];
    return { r, v, c, kind: kindOf(r, c, today), hay: [r.job_id, v.name, v.addr, v.city].filter(Boolean).join(" ").toLowerCase() };
  }), [rows, crm, today]);

  const inView = (k: Kind, w: View) => w === "all" || (w === "closed" ? k === "closed" : k === "overdue" || k === "today" || k === "review");
  const counts = useMemo(() => ({
    attention: items.filter((i) => inView(i.kind, "attention")).length,
    all: items.length,
    closed: items.filter((i) => i.kind === "closed").length,
  }), [items]);

  const shown = useMemo(() => {
    const n = q.trim().toLowerCase();
    // The open row stays put after a save, so the office sees its "Saved." even when the save moves it to another view.
    const list = items.filter((i) => (inView(i.kind, view) || i.r.id === open) && (!n || i.hay.includes(n)) && (fs === "all" || (i.c?.stage ?? "new") === fs));
    if (view !== "attention") return list;
    const rank: Record<Kind, number> = { overdue: 0, today: 1, review: 2, scheduled: 3, nodate: 3, closed: 4 };
    return [...list].sort((a, b) => rank[a.kind] - rank[b.kind]
      || (a.kind === "overdue" ? (a.c!.next_follow_up! < b.c!.next_follow_up! ? -1 : a.c!.next_follow_up! > b.c!.next_follow_up! ? 1 : 0) : 0)
      || (a.kind === "review" ? a.r.sent_at.localeCompare(b.r.sent_at) : 0));
  }, [items, q, fs, view, open]);

  if (role === undefined) return null;
  const stageName = (k: string) => { const s = STAGES.find((x) => x[0] === k) ?? STAGES[0]; return t(s[1], s[2]); };
  const fmtDay = (d: string) => { const [y, m, dd] = d.split("-").map(Number); return new Date(y, m - 1, dd).toLocaleDateString(locale, { month: "short", day: "numeric", year: "numeric" }); };
  const fmtWhen = (iso: string) => new Date(iso).toLocaleString(locale, { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
  const plural = (n: number, en: string, es: string) => t(`${n} ${en}${n === 1 ? "" : "s"}`, `${n} ${es}${n === 1 ? "" : "s"}`);

  const nextAction = (i: (typeof items)[number]): [string, string] => {
    const fu = i.c?.next_follow_up ?? null;
    switch (i.kind) {
      case "closed": return [t("No action: closed", "Sin acción: cerrado"), t("Your office recorded this job as closed.", "Su oficina anotó este trabajo como cerrado.")];
      case "overdue": { const d = dayDiff(fu!, today); return [t("Follow up: overdue", "Seguimiento: vencido"), t(`Was due ${fmtDay(fu!)}, ${plural(d, "day", "día")} ago.`, `Vencía el ${fmtDay(fu!)}, hace ${plural(d, "day", "día")}.`)]; }
      case "today": return [t("Follow up today", "Seguimiento hoy"), t(`Follow-up date is today, ${fmtDay(fu!)}.`, `La fecha de seguimiento es hoy, ${fmtDay(fu!)}.`)];
      case "review": return [t("Review the new packet", "Revisar el paquete nuevo"), t(`Not opened by your office yet. Sent ${fmtWhen(i.r.sent_at)}.`, `Su oficina aún no lo abrió. Enviado ${fmtWhen(i.r.sent_at)}.`)];
      case "scheduled": { const d = dayDiff(today, fu!); return [t(`Next follow-up ${fmtDay(fu!)}`, `Próximo seguimiento ${fmtDay(fu!)}`), t(`In ${plural(d, "day", "día")}.`, `En ${plural(d, "day", "día")}.`)]; }
      default: return [t("Set a follow-up date", "Fije una fecha de seguimiento"), !i.r.open_tracked && !i.r.office_received_at
        ? t("No follow-up date yet. Whether the office opened this packet was not recorded.", "Aún no hay fecha de seguimiento. No se registró si la oficina abrió este paquete.")
        : t("No follow-up date recorded yet.", "Aún no hay fecha de seguimiento anotada.")];
    }
  };

  const empty: Record<View, string> = {
    attention: t("Nothing needs attention: no overdue or due-today follow-ups, and no new packets waiting to be opened.", "Nada requiere atención: no hay seguimientos vencidos ni para hoy, ni paquetes nuevos sin abrir."),
    all: t("No packets match.", "Ningún paquete coincide."),
    closed: t("No jobs recorded as closed yet.", "Todavía no hay trabajos anotados como cerrados."),
  };
  const filtered = q.trim() !== "" || fs !== "all";

  const list = (w: View) => (
    <>
      {shown.length === 0 && (
        <div className="jb-empty" role="status" data-testid="cp-empty">
          <p>{filtered ? t("No packets match this search and stage.", "Ningún paquete coincide con esta búsqueda y etapa.") : empty[w]}</p>
          {filtered && <button type="button" className="ap-btn ghost" onClick={() => { setQ(""); setFs("all"); }}>{t("Clear search and stage", "Borrar búsqueda y etapa")}</button>}
        </div>
      )}
      <ul className="oh-rows">
        {shown.map((i) => {
          const { r, v, c, kind } = i;
          const site = [v.addr, v.city].filter(Boolean).join(", ");
          const [act, why] = nextAction(i);
          const isOpen = open === r.id;
          return (
            <li key={r.id} className={`oh-row ${kind}`} data-testid="company-packet" data-kind={kind}>
              <div className="oh-row-main">
                <div className="jb-top">
                  <span className="jb-addr">{site || t("Site address not captured", "Dirección del sitio no capturada")}</span>
                  <span className={`oh-stage${(c?.stage ?? "new") === "closed" ? " closed" : ""}`} data-testid="crm-summary">{stageName(c?.stage ?? "new")}</span>
                </div>
                <p className="jb-meta"><span>{v.name || t("Customer not captured", "Cliente no capturado")}</span><span aria-hidden>·</span><span>{t("Job", "Trabajo")} {r.job_id}</span></p>
                <p className="oh-next" data-testid="cp-next"><strong>{act}</strong> <span>{why}</span></p>
              </div>
              <div className="oh-row-actions">
                <Link to="/office-review/$id" params={{ id: r.id }} className="ap-btn primary oh-open" data-testid="cp-open">{kind === "review" ? t("Review packet", "Revisar paquete") : t("Open packet", "Abrir paquete")}</Link>
                <Button type="button" variant="outline" className="oh-more" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : r.id)} data-testid="crm-open">{isOpen ? t("Close details", "Cerrar detalles") : t("Details & follow-up", "Detalles y seguimiento")}</Button>
              </div>
              {isOpen && (
                <div className="oh-details" data-testid="cp-details">
                  <dl className="oh-facts">
                    <div><dt>{t("Sent by", "Enviado por")}</dt><dd>{r.sent_by_name}{r.employee_id ? ` · ${r.employee_id}` : ""}</dd></div>
                    <div><dt>{t("Sent", "Enviado")}</dt><dd>{fmtWhen(r.sent_at)}</dd></div>
                    <div><dt>{t("Permit reference", "Referencia del permiso")}</dt><dd>{c?.permit_ref || t("None recorded", "Ninguna anotada")}</dd></div>
                    <div><dt>{t("Follow-up updated", "Seguimiento actualizado")}</dt><dd>{c ? fmtWhen(c.updated_at) : t("Never", "Nunca")}</dd></div>
                  </dl>
                  <HandoffReceipt row={r} />
                  <p className="ap-muted"><Link to="/office-review/$id" params={{ id: r.id }} className="underline font-semibold">{t("See the packet's fields and photos", "Ver los datos y fotos del paquete")}</Link></p>
                  <Follow row={r} crm={c} company={company} onSaved={(n) => setCrm((p) => ({ ...p, [r.id]: n }))} />
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );

  return (
    <section className="oh-queue" aria-labelledby="cp-h" data-testid="company-packets">
      <div className="oh-sec-head">
        <h2 id="cp-h" className="ap-h2">{t("Your company's queue", "Cola de su empresa")}</h2>
        <p className="ap-muted">{t("Packets your technicians sent to your office.", "Paquetes que sus técnicos enviaron a su oficina.")}</p>
      </div>
      {role !== "admin" && role !== "office" ? (
        <p className="ap-muted">{t("Office reviewers and admins of your company see finished jobs' packets here. Company, people and office inbox: ", "Los revisores de oficina y administradores de su empresa ven aquí los paquetes de los trabajos terminados. Empresa, personas y buzón de oficina: ")}<Link to="/office-setup" className="underline font-semibold">{t("Office setup", "Configuración de oficina")}</Link></p>
      ) : rows === null ? (
        <p className="ap-muted" role="status">{t("Loading…", "Cargando…")}</p>
      ) : rows.length === 0 ? (
        <div className="jb-empty"><p>{t("No finished jobs from your company's technicians yet.", "Todavía no hay trabajos terminados de los técnicos de su empresa.")}</p></div>
      ) : (
        <Tabs value={view} onValueChange={(x) => { setView(x as View); setOpen(null); }} className="oh-tabs">
          <TabsList className="oh-tablist" aria-label={t("Queue view", "Vista de la cola")}>
            <TabsTrigger value="attention" className="oh-tab" data-testid="cp-view-attention">{t("Needs attention", "Requiere atención")} <span className="oh-count">{counts.attention}</span></TabsTrigger>
            <TabsTrigger value="all" className="oh-tab" data-testid="cp-view-all">{t("All jobs", "Todos")} <span className="oh-count">{counts.all}</span></TabsTrigger>
            <TabsTrigger value="closed" className="oh-tab" data-testid="cp-view-closed">{t("Closed", "Cerrados")} <span className="oh-count">{counts.closed}</span></TabsTrigger>
          </TabsList>
          <div className="oh-filters">
            <div className="ap-field">
              <label htmlFor="cp-q">{t("Search customer, site or job number", "Buscar cliente, sitio o número de trabajo")}</label>
              <Input id="cp-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" data-testid="cp-search" />
            </div>
            <div className="ap-field">
              <label htmlFor="cp-fs">{t("Stage", "Etapa")}</label>
              <Select value={fs} onValueChange={setFs}>
                <SelectTrigger id="cp-fs" className="oh-select" data-testid="cp-filter"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("All stages", "Todas las etapas")}</SelectItem>
                  {STAGES.map(([k, en, es]) => <SelectItem key={k} value={k}>{t(en, es)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <p className="ap-muted oh-legend">{t("Stage is what your office recorded by hand. “Opened” in a packet's receipt is a separate fact: a reviewer opened it here. Neither is permit filing.", "La etapa es lo que su oficina anotó a mano. «Abierto» en el recibo del paquete es otro dato: un revisor lo abrió aquí. Ninguno es presentación del permiso.")}</p>
          {(["attention", "all", "closed"] as View[]).map((w) => <TabsContent key={w} value={w} className="oh-panel">{view === w && list(w)}</TabsContent>)}
        </Tabs>
      )}
    </section>
  );
}
