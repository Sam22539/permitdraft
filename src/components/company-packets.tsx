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
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "./ui/sheet";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { AlertTriangle, ArrowRight, BellRing, CalendarClock, CheckCircle2, ChevronLeft, ChevronRight, ClipboardList, FilePlus2, FileSearch, Inbox, MailWarning, Search, Settings2, Stamp, ClipboardCheck, Archive, FileText } from "lucide-react";
import { useCorePath } from "./demo";
import { TodaysSchedule } from "./dispatch";

type Row = ReceiptRow & { id: string; job_id: string; sent_by_name: string; employee_id: string | null; sent_at: string; tracking_no: string; photo_links: unknown[] | null; captured_fields: { values?: Record<string, string>; formDefaults?: Record<string, string> } | null };
type Crm = { packet_id: string; stage: string; next_follow_up: string | null; note: string | null; permit_ref: string | null; updated_at: string; updated_by?: string | null };
type Corr = { packet_id: string; created_at: string; requested_by: string };

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
    onSaved({ packet_id: row.id, stage, next_follow_up: vals.next_follow_up, note: vals.note, permit_ref: vals.permit_ref, updated_at: vals.updated_at, updated_by: vals.updated_by });
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

const STAGE_ICON: Record<string, typeof Inbox> = { new: Inbox, preparing: ClipboardList, submitted: FileText, approved: Stamp, inspection: ClipboardCheck, closed: Archive };
type Sort = "newest" | "oldest" | "updated" | "followup" | "customer";
const PAGE = 10;
const nice = (k: string) => k.replace(/[_-]+/g, " ").replace(/^./, (c) => c.toUpperCase());

/** Core Office Handoff: the company's finished-job packets a signed-in office reviewer or admin may open, with a manual follow-up record (database rules decide). */
export function CompanyPackets() {
  const { t, lang } = useLang();
  const p = useCorePath();
  const locale = lang === "es" ? "es" : "en-US";
  const [rows, setRows] = useState<Row[] | null>(null);
  const [crm, setCrm] = useState<Record<string, Crm>>({});
  const [corrs, setCorrs] = useState<Corr[]>([]);
  const [company, setCompany] = useState("");
  const [role, setRole] = useState<string | null | undefined>(undefined);
  const [q, setQ] = useState("");
  const [fs, setFs] = useState("all");
  const [view, setView] = useState<View>("attention");
  const [sort, setSort] = useState<Sort>("newest");
  const [page, setPage] = useState(0);
  const [open, setOpen] = useState<string | null>(null);
  const [track, setTrack] = useState(false);
  const [tq, setTq] = useState("");
  const [tsel, setTsel] = useState<string | null>(null);
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
      const [{ data }, { data: c }, { data: cr }] = await Promise.all([
        backend.from("office_packets").select(`id, job_id, tracking_no, sent_by_name, employee_id, sent_at, captured_fields, photo_links, ${RECEIPT_COLUMNS}`).eq("company_id", m.company_id).order("sent_at", { ascending: false }).limit(500),
        backend.from("packet_crm").select("packet_id, stage, next_follow_up, note, permit_ref, updated_at, updated_by").eq("company_id", m.company_id),
        backend.from("correction_requests").select("packet_id, created_at, requested_by").eq("company_id", m.company_id).order("created_at"),
      ]);
      if (!live) return;
      setCrm(Object.fromEntries(((c as Crm[] | null) ?? []).map((x) => [x.packet_id, x])));
      setCorrs((cr as Corr[] | null) ?? []);
      setRows((data as Row[] | null) ?? []);
    })().catch(() => { if (live) setRole(null); });
    return () => { live = false; };
  }, []);

  const items = useMemo(() => (rows ?? []).map((r) => {
    const v: Record<string, string> = { ...(r.captured_fields?.formDefaults ?? {}), ...(r.captured_fields?.values ?? {}) };
    const c = crm[r.id];
    const last = [r.sent_at, r.office_received_at, c?.updated_at].filter((x): x is string => !!x).sort().pop() ?? r.sent_at;
    return { r, v, c, last, stage: c?.stage ?? "new", kind: kindOf(r, c, today), hay: [r.tracking_no, r.job_id, v.name, v.addr, v.city, c?.permit_ref].filter(Boolean).join(" ").toLowerCase() };
  }), [rows, crm, today]);
  type Item = (typeof items)[number];

  const inView = (k: Kind, w: View) => w === "all" || (w === "closed" ? k === "closed" : k === "overdue" || k === "today" || k === "review");
  const counts = useMemo(() => ({
    attention: items.filter((i) => inView(i.kind, "attention")).length,
    all: items.length,
    closed: items.filter((i) => i.kind === "closed").length,
  }), [items]);
  const byStage = useMemo(() => Object.fromEntries(STAGES.map(([k]) => [k, items.filter((i) => i.stage === k).length])) as Record<string, number>, [items]);
  const alerts = useMemo(() => ({
    overdue: items.filter((i) => i.kind === "overdue"),
    today: items.filter((i) => i.kind === "today"),
    unopened: items.filter((i) => i.r.open_tracked && !i.r.office_received_at && i.stage !== "closed"),
    failed: items.filter((i) => i.r.notify_status === "failed"),
  }), [items]);

  const shown = useMemo(() => {
    const n = q.trim().toLowerCase();
    const list = items.filter((i) => inView(i.kind, view) && (!n || i.hay.includes(n)) && (fs === "all" || i.stage === fs));
    const rank: Record<Kind, number> = { overdue: 0, today: 1, review: 2, scheduled: 3, nodate: 3, closed: 4 };
    const cmp: Record<Sort, (a: Item, b: Item) => number> = {
      newest: (a, b) => b.r.sent_at.localeCompare(a.r.sent_at),
      oldest: (a, b) => a.r.sent_at.localeCompare(b.r.sent_at),
      updated: (a, b) => b.last.localeCompare(a.last),
      followup: (a, b) => (a.c?.next_follow_up ?? "9999").localeCompare(b.c?.next_follow_up ?? "9999"),
      customer: (a, b) => String(a.v.name ?? "").localeCompare(String(b.v.name ?? ""), locale),
    };
    // Needs attention keeps its own order (overdue first, then due today, then unopened) unless the office picks a sort.
    return [...list].sort((a, b) => (view === "attention" && sort === "newest" ? rank[a.kind] - rank[b.kind] || (a.kind === "overdue" ? cmp.followup(a, b) : 0) || (a.kind === "review" ? cmp.oldest(a, b) : 0) : 0) || cmp[sort](a, b));
  }, [items, q, fs, view, sort, locale]);
  const pages = Math.max(1, Math.ceil(shown.length / PAGE));
  const pg = Math.min(page, pages - 1);
  const pageRows = shown.slice(pg * PAGE, pg * PAGE + PAGE);
  useEffect(() => setPage(0), [q, fs, view, sort]);

  if (role === undefined) return null;
  const stageName = (k: string) => { const s = STAGES.find((x) => x[0] === k) ?? STAGES[0]; return t(s[1], s[2]); };
  const fmtDay = (d: string) => { const [y, m, dd] = d.split("-").map(Number); return new Date(y, m - 1, dd).toLocaleDateString(locale, { month: "short", day: "numeric", year: "numeric" }); };
  const fmtWhen = (iso: string) => new Date(iso).toLocaleString(locale, { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
  const plural = (n: number, en: string, es: string) => t(`${n} ${en}${n === 1 ? "" : "s"}`, `${n} ${es}${n === 1 ? "" : "s"}`);
  const siteOf = (i: Item) => [i.v.addr, i.v.city].filter(Boolean).join(", ");

  const nextAction = (i: Item): [string, string] => {
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
  const pickStage = (k: string) => { setFs(fs === k ? "all" : k); setView("all"); };

  /** Recorded milestones only: each comes from a saved timestamp. The office stage is a separate, hand-recorded label. */
  const milestones = (i: Item) => {
    const ms: { at: string; label: string; who?: string; kind: "rec" | "corr" }[] = [
      { at: i.r.sent_at, label: t("Packet sent to office", "Paquete enviado a la oficina"), who: i.r.sent_by_name, kind: "rec" },
    ];
    if (i.r.notify_status === "accepted" && i.r.notify_accepted_at) ms.push({ at: i.r.notify_accepted_at, label: t("Office email notification accepted by the email service", "Aviso por correo aceptado por el servicio de correo"), kind: "rec" });
    if (i.r.office_received_at) ms.push({ at: i.r.office_received_at, label: t("Opened by a signed-in office reviewer", "Abierto por un revisor de oficina con sesión"), kind: "rec" });
    for (const c of corrs.filter((x) => x.packet_id === i.r.id)) ms.push({ at: c.created_at, label: t("Correction requested from the technician", "Corrección solicitada al técnico"), who: c.requested_by, kind: "corr" });
    if (i.c) ms.push({ at: i.c.updated_at, label: t(`Office label last set to “${stageName(i.stage)}”`, `Etiqueta de oficina fijada en «${stageName(i.stage)}»`), who: i.c.updated_by ?? undefined, kind: "rec" });
    return ms.sort((a, b) => a.at.localeCompare(b.at));
  };

  const drawerItem = items.find((i) => i.r.id === open) ?? null;
  const tn = tq.trim().toLowerCase();
  const tResults = tn ? items.filter((i) => i.hay.includes(tn)).slice(0, 8) : [];
  const tItem = items.find((i) => i.r.id === tsel) ?? null;

  const stageBadge = (i: Item) => <span className={`oh-stage${i.stage === "closed" ? " closed" : ""}`} data-testid="crm-summary">{stageName(i.stage)}</span>;
  const actions = (i: Item) => (
    <div className="crm-row-actions">
      <Link to="/office-review/$id" params={{ id: i.r.id }} className="ap-btn primary oh-open" data-testid="cp-open">{i.kind === "review" ? t("Review packet", "Revisar paquete") : t("Open packet", "Abrir paquete")}</Link>
      <Button type="button" variant="outline" className="oh-more" aria-expanded={open === i.r.id} onClick={() => setOpen(i.r.id)} data-testid="crm-open">{t("Details & follow-up", "Detalles y seguimiento")}</Button>
    </div>
  );

  const list = (w: View) => (
    <>
      {shown.length === 0 && (
        <div className="jb-empty" role="status" data-testid="cp-empty">
          <p>{filtered ? t("No packets match this search and stage.", "Ningún paquete coincide con esta búsqueda y etapa.") : empty[w]}</p>
          {filtered && <button type="button" className="ap-btn ghost" onClick={() => { setQ(""); setFs("all"); }}>{t("Clear search and stage", "Borrar búsqueda y etapa")}</button>}
        </div>
      )}
      {shown.length > 0 && (
        <>
          <div className="crm-table">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("Tracking no.", "N.º de seguimiento")}</TableHead>
                  <TableHead>{t("Customer & site", "Cliente y sitio")}</TableHead>
                  <TableHead>{t("Equipment", "Equipo")}</TableHead>
                  <TableHead>{t("Sent by", "Enviado por")}</TableHead>
                  <TableHead>{t("Office stage", "Etapa de oficina")}</TableHead>
                  <TableHead>{t("Next action", "Próxima acción")}</TableHead>
                  <TableHead>{t("Last update", "Última actualización")}</TableHead>
                  <TableHead><span className="sr-only">{t("Actions", "Acciones")}</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageRows.map((i) => {
                  const [act, why] = nextAction(i);
                  return (
                    <TableRow key={i.r.id} className={`crm-tr ${i.kind}`} data-testid="company-packet" data-kind={i.kind} data-state={open === i.r.id ? "selected" : undefined}>
                      <TableCell><button type="button" className="crm-trk" onClick={() => setOpen(i.r.id)} data-testid="cp-tracking">{i.r.tracking_no}</button><span className="crm-sub">{t("Job", "Trabajo")} {i.r.job_id}</span></TableCell>
                      <TableCell className="crm-wrap"><span className="crm-strong">{i.v.name || t("Customer not captured", "Cliente no capturado")}</span><span className="crm-sub">{siteOf(i) || t("Site address not captured", "Dirección del sitio no capturada")}</span></TableCell>
                      <TableCell className="crm-wrap">{i.v.type || "—"}</TableCell>
                      <TableCell className="crm-wrap">{i.r.sent_by_name}{i.r.employee_id ? <span className="crm-sub">{i.r.employee_id}</span> : null}</TableCell>
                      <TableCell>{stageBadge(i)}</TableCell>
                      <TableCell className="crm-wrap"><span className={`crm-act ${i.kind}`} data-testid="cp-next">{act}</span><span className="crm-sub">{why}</span></TableCell>
                      <TableCell className="crm-wrap crm-when">{fmtWhen(i.last)}</TableCell>
                      <TableCell>{actions(i)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <ul className="crm-cards">
            {pageRows.map((i) => {
              const [act, why] = nextAction(i);
              return (
                <li key={i.r.id} className={`oh-row ${i.kind}`} data-testid="company-packet-m" data-kind={i.kind}>
                  <div className="jb-top">
                    <button type="button" className="crm-trk" onClick={() => setOpen(i.r.id)}>{i.r.tracking_no}</button>
                    {stageBadge(i)}
                  </div>
                  <span className="jb-addr">{siteOf(i) || t("Site address not captured", "Dirección del sitio no capturada")}</span>
                  <p className="jb-meta"><span>{i.v.name || t("Customer not captured", "Cliente no capturado")}</span><span aria-hidden>·</span><span>{t("Job", "Trabajo")} {i.r.job_id}</span></p>
                  <p className="oh-next"><strong>{act}</strong> <span>{why}</span></p>
                  {actions(i)}
                </li>
              );
            })}
          </ul>
          <div className="crm-pager">
            <span className="ap-muted" role="status" data-testid="cp-range">{t(`${pg * PAGE + 1}–${pg * PAGE + pageRows.length} of ${shown.length}`, `${pg * PAGE + 1}–${pg * PAGE + pageRows.length} de ${shown.length}`)}</span>
            <div className="crm-pager-btns">
              <Button type="button" variant="outline" size="sm" disabled={pg === 0} onClick={() => setPage(pg - 1)} aria-label={t("Previous page", "Página anterior")}><ChevronLeft size={16} aria-hidden /></Button>
              <span className="ap-muted">{t(`Page ${pg + 1} of ${pages}`, `Página ${pg + 1} de ${pages}`)}</span>
              <Button type="button" variant="outline" size="sm" disabled={pg >= pages - 1} onClick={() => setPage(pg + 1)} aria-label={t("Next page", "Página siguiente")}><ChevronRight size={16} aria-hidden /></Button>
            </div>
          </div>
        </>
      )}
    </>
  );

  const isOffice = role === "admin" || role === "office";
  const kpis: { label: string; value: number; note: string; icon: typeof Inbox; dark?: boolean }[] = [
    { label: t("Packets received", "Paquetes recibidos"), value: items.length, note: t("Sent by your technicians", "Enviados por sus técnicos"), icon: Inbox, dark: true },
    { label: t("Needs attention", "Requiere atención"), value: counts.attention, note: t("Overdue, due today or unopened", "Vencidos, para hoy o sin abrir"), icon: BellRing },
    { label: t("Not opened yet", "Aún no abiertos"), value: alerts.unopened.length, note: t("Awaiting first office review", "Esperan la primera revisión"), icon: FileSearch, dark: true },
    { label: t("Overdue follow-ups", "Seguimientos vencidos"), value: alerts.overdue.length, note: t("Follow-up date has passed", "La fecha ya pasó"), icon: CalendarClock },
    { label: t("Marked submitted", "Marcados presentados"), value: byStage.submitted ?? 0, note: t("Office label, not city status", "Etiqueta de oficina, no estado de la ciudad"), icon: FileText, dark: true },
    { label: t("Closed", "Cerrados"), value: counts.closed, note: t("Recorded closed by your office", "Anotados como cerrados"), icon: CheckCircle2 },
  ];
  const alertGroups: { key: string; icon: typeof Inbox; tone: string; title: string; list: Item[] }[] = [
    { key: "overdue", icon: AlertTriangle, tone: "red", title: t("Overdue follow-ups", "Seguimientos vencidos"), list: alerts.overdue },
    { key: "today", icon: CalendarClock, tone: "orange", title: t("Follow up today", "Seguimiento hoy"), list: alerts.today },
    { key: "unopened", icon: Inbox, tone: "blue", title: t("New packets not opened", "Paquetes nuevos sin abrir"), list: alerts.unopened },
    { key: "failed", icon: MailWarning, tone: "red", title: t("Office email failed", "Falló el correo a la oficina"), list: alerts.failed },
  ];

  return (
    <section className="oh-queue crm" aria-labelledby="cp-h" data-testid="company-packets">
      <div className="crm-head">
        <div className="oh-sec-head">
          <h2 id="cp-h" className="ap-h2">{t("Your company's queue", "Cola de su empresa")}</h2>
          <p className="ap-muted">{t("Packets your technicians sent to your office.", "Paquetes que sus técnicos enviaron a su oficina.")}</p>
        </div>
        {isOffice && rows && rows.length > 0 && <Button type="button" className="crm-track-btn" onClick={() => setTrack(true)} data-testid="track-open"><Search size={18} aria-hidden />{t("Track permit", "Rastrear permiso")}</Button>}
      </div>
      {!isOffice ? (
        <p className="ap-muted">{t("Office reviewers and admins of your company see finished jobs' packets here. Company, people and office inbox: ", "Los revisores de oficina y administradores de su empresa ven aquí los paquetes de los trabajos terminados. Empresa, personas y buzón de oficina: ")}<Link to="/office-setup" className="underline font-semibold">{t("Office setup", "Configuración de oficina")}</Link></p>
      ) : rows === null ? (
        <p className="ap-muted" role="status">{t("Loading…", "Cargando…")}</p>
      ) : rows.length === 0 ? (
        <div className="jb-empty"><p>{t("No finished jobs from your company's technicians yet.", "Todavía no hay trabajos terminados de los técnicos de su empresa.")}</p></div>
      ) : (
        <div className="crm-grid">
          <div className="crm-center">
            <ul className="crm-kpis" aria-label={t("Queue counts", "Conteos de la cola")} data-testid="crm-kpis">
              {kpis.map((k) => (
                <li key={k.label} className={`crm-kpi${k.dark ? " dark" : ""}`}>
                  <span className="crm-kpi-top"><span>{k.label}</span><k.icon size={20} aria-hidden /></span>
                  <strong className="crm-kpi-val">{k.value}</strong>
                  <span className="crm-kpi-note">{k.note}</span>
                </li>
              ))}
            </ul>

            <section className="crm-panel" aria-labelledby="crm-pipe-h">
              <div className="crm-panel-head">
                <h3 id="crm-pipe-h" className="crm-h3">{t("Office stage pipeline", "Etapas de la oficina")}</h3>
                <p className="crm-note">{t("Stages your office records by hand, not official permit status. Pick a stage to filter the jobs below.", "Etapas que su oficina anota a mano, no el estado oficial del permiso. Elija una etapa para filtrar los trabajos.")}</p>
              </div>
              <ol className="crm-pipe" data-testid="crm-pipeline">
                {STAGES.map(([k, en, es], n) => {
                  const Icon = STAGE_ICON[k] ?? Inbox;
                  const c = byStage[k] ?? 0;
                  const pct = items.length ? Math.round((c / items.length) * 100) : 0;
                  return (
                    <li key={k}>
                      <button type="button" className={`crm-stage s-${k}`} aria-pressed={fs === k} onClick={() => pickStage(k)} data-testid={`crm-stage-${k}`}>
                        <span className="crm-stage-top"><Icon size={18} aria-hidden /><span className="crm-stage-n">{n + 1}</span></span>
                        <span className="crm-stage-name">{t(en, es)}</span>
                        <strong className="crm-stage-count">{c}</strong>
                        <span className="crm-stage-pct">{pct}% {t("of jobs", "de trabajos")}</span>
                        <span className="crm-bar" aria-hidden><span style={{ width: `${pct}%` }} /></span>
                      </button>
                      {n < STAGES.length - 1 && <ArrowRight className="crm-pipe-arrow" size={16} aria-hidden />}
                    </li>
                  );
                })}
              </ol>
            </section>

            <section className="crm-panel" aria-labelledby="crm-jobs-h">
              <h3 id="crm-jobs-h" className="crm-h3">{t("Jobs", "Trabajos")}</h3>
              <Tabs value={view} onValueChange={(x) => setView(x as View)} className="oh-tabs">
                <TabsList className="oh-tablist" aria-label={t("Queue view", "Vista de la cola")}>
                  <TabsTrigger value="attention" className="oh-tab" data-testid="cp-view-attention">{t("Needs attention", "Requiere atención")} <span className="oh-count">{counts.attention}</span></TabsTrigger>
                  <TabsTrigger value="all" className="oh-tab" data-testid="cp-view-all">{t("All jobs", "Todos")} <span className="oh-count">{counts.all}</span></TabsTrigger>
                  <TabsTrigger value="closed" className="oh-tab" data-testid="cp-view-closed">{t("Closed", "Cerrados")} <span className="oh-count">{counts.closed}</span></TabsTrigger>
                </TabsList>
                <div className="oh-filters crm-filters">
                  <div className="ap-field">
                    <label htmlFor="cp-q">{t("Search tracking no., customer, site, job or permit ref.", "Buscar n.º de seguimiento, cliente, sitio, trabajo o ref. de permiso")}</label>
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
                  <div className="ap-field">
                    <label htmlFor="cp-sort">{t("Sort", "Ordenar")}</label>
                    <Select value={sort} onValueChange={(x) => setSort(x as Sort)}>
                      <SelectTrigger id="cp-sort" className="oh-select" data-testid="cp-sort"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">{view === "attention" ? t("Most urgent first", "Lo más urgente primero") : t("Newest sent", "Enviados más recientes")}</SelectItem>
                        <SelectItem value="oldest">{t("Oldest sent", "Enviados más antiguos")}</SelectItem>
                        <SelectItem value="updated">{t("Last update", "Última actualización")}</SelectItem>
                        <SelectItem value="followup">{t("Follow-up date", "Fecha de seguimiento")}</SelectItem>
                        <SelectItem value="customer">{t("Customer A–Z", "Cliente A–Z")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <p className="ap-muted oh-legend">{t("Stage is what your office recorded by hand. “Opened” in a packet's receipt is a separate fact: a reviewer opened it here. Neither is permit filing.", "La etapa es lo que su oficina anotó a mano. «Abierto» en el recibo del paquete es otro dato: un revisor lo abrió aquí. Ninguno es presentación del permiso.")}</p>
                {(["attention", "all", "closed"] as View[]).map((w) => <TabsContent key={w} value={w} className="oh-panel">{view === w && list(w)}</TabsContent>)}
              </Tabs>
            </section>
          </div>

          <aside className="crm-aside" aria-label={t("Alerts and quick actions", "Alertas y acciones rápidas")}>
            <section className="crm-panel" aria-labelledby="crm-qa-h">
              <h3 id="crm-qa-h" className="crm-h3">{t("Quick actions", "Acciones rápidas")}</h3>
              <div className="crm-qa">
                <Button type="button" className="crm-qa-main" onClick={() => setTrack(true)}><Search size={18} aria-hidden />{t("Track permit", "Rastrear permiso")}</Button>
                <Link to={p("/new") as never} className="crm-qa-btn"><FilePlus2 size={18} aria-hidden />{t("New job", "Nuevo trabajo")}</Link>
                <Link to="/office-setup" className="crm-qa-btn"><Settings2 size={18} aria-hidden />{t("Office setup", "Configuración de oficina")}</Link>
              </div>
            </section>
            {company && <TodaysSchedule company={company} />}
            <section className="crm-panel" aria-labelledby="crm-al-h" data-testid="crm-alerts">
              <h3 id="crm-al-h" className="crm-h3">{t("Alerts", "Alertas")}</h3>
              {alertGroups.every((g) => g.list.length === 0) ? (
                <p className="crm-note">{t("No alerts from your packets right now.", "No hay alertas de sus paquetes ahora.")}</p>
              ) : (
                <div className="crm-alerts">
                  {alertGroups.filter((g) => g.list.length > 0).map((g) => (
                    <div key={g.key} className={`crm-alert ${g.tone}`}>
                      <p className="crm-alert-h"><g.icon size={16} aria-hidden /><span>{g.title}</span><span className="oh-count">{g.list.length}</span></p>
                      <ul>
                        {g.list.slice(0, 4).map((i) => (
                          <li key={i.r.id}>
                            <button type="button" onClick={() => setOpen(i.r.id)}>
                              <span className="crm-trk-txt">{i.r.tracking_no}</span>
                              <span className="crm-alert-site">{siteOf(i) || i.v.name || `${t("Job", "Trabajo")} ${i.r.job_id}`}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                      {g.list.length > 4 && <p className="crm-note">{t(`+${g.list.length - 4} more in the table`, `+${g.list.length - 4} más en la tabla`)}</p>}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </aside>
        </div>
      )}

      <Sheet open={!!drawerItem} onOpenChange={(o) => { if (!o) setOpen(null); }}>
        <SheetContent side="right" className="crm-drawer" data-testid="cp-details">
          {drawerItem && (() => {
            const i = drawerItem;
            const vals = Object.entries(i.v).filter(([, x]) => String(x ?? "").trim() !== "");
            const nPhotos = Array.isArray(i.r.photo_links) ? i.r.photo_links.length : 0;
            return (
              <>
                <SheetHeader className="crm-drawer-head">
                  <span className="crm-trk-txt">{i.r.tracking_no}</span>
                  <SheetTitle>{siteOf(i) || t("Site address not captured", "Dirección del sitio no capturada")}</SheetTitle>
                  <SheetDescription>{i.v.name || t("Customer not captured", "Cliente no capturado")} · {t("Job", "Trabajo")} {i.r.job_id}</SheetDescription>
                </SheetHeader>
                <div className="crm-drawer-body">
                  <dl className="oh-facts">
                    <div><dt>{t("Sent by", "Enviado por")}</dt><dd>{i.r.sent_by_name}{i.r.employee_id ? ` · ${i.r.employee_id}` : ""}</dd></div>
                    <div><dt>{t("Sent", "Enviado")}</dt><dd>{fmtWhen(i.r.sent_at)}</dd></div>
                    <div><dt>{t("Office stage", "Etapa de oficina")}</dt><dd>{stageName(i.stage)}</dd></div>
                    <div><dt>{t("Permit reference", "Referencia del permiso")}</dt><dd>{i.c?.permit_ref || t("None recorded", "Ninguna anotada")}</dd></div>
                    <div><dt>{t("Follow-up updated", "Seguimiento actualizado")}</dt><dd>{i.c ? fmtWhen(i.c.updated_at) : t("Never", "Nunca")}</dd></div>
                    <div><dt>{t("Photos in packet", "Fotos en el paquete")}</dt><dd>{nPhotos}</dd></div>
                  </dl>
                  <HandoffReceipt row={i.r} />
                  <div className="crm-drawer-sec">
                    <h3 className="crm-h3">{t("Captured fields", "Datos capturados")}</h3>
                    {vals.length === 0 ? <p className="crm-note">{t("No fields in this packet.", "No hay datos en este paquete.")}</p> : (
                      <dl className="crm-fields">{vals.map(([k, x]) => <div key={k}><dt>{nice(k)}</dt><dd>{String(x)}</dd></div>)}</dl>
                    )}
                    <p className="ap-muted"><Link to="/office-review/$id" params={{ id: i.r.id }} className="underline font-semibold">{t("See the packet's fields and photos", "Ver los datos y fotos del paquete")}</Link></p>
                  </div>
                  <Follow key={i.r.id} row={i.r} crm={i.c} company={company} onSaved={(n) => setCrm((prev) => ({ ...prev, [i.r.id]: n }))} />
                </div>
              </>
            );
          })()}
        </SheetContent>
      </Sheet>

      <Dialog open={track} onOpenChange={(o) => { setTrack(o); if (!o) { setTq(""); setTsel(null); } }}>
        <DialogContent className="crm-track" data-testid="track-dialog">
          <DialogHeader>
            <DialogTitle>{t("Track permit", "Rastrear permiso")}</DialogTitle>
            <DialogDescription>{t("Search your company's jobs. Shows only what PermitDraft recorded.", "Busque los trabajos de su empresa. Solo muestra lo que PermitDraft registró.")}</DialogDescription>
          </DialogHeader>
          <div className="ap-field">
            <label htmlFor="trk-q">{t("Tracking no., job, permit ref., address or customer", "N.º de seguimiento, trabajo, ref. de permiso, dirección o cliente")}</label>
            <Input id="trk-q" type="search" value={tq} autoComplete="off" onChange={(e) => { setTq(e.target.value); setTsel(null); }} placeholder="PD-2026-" data-testid="track-q" />
          </div>
          {tn && !tItem && (tResults.length === 0
            ? <p className="crm-note" role="status" data-testid="track-none">{t("No job of your company matches.", "Ningún trabajo de su empresa coincide.")}</p>
            : <ul className="crm-tres">{tResults.map((i) => (
                <li key={i.r.id}><button type="button" onClick={() => setTsel(i.r.id)} data-testid="track-result"><span className="crm-trk-txt">{i.r.tracking_no}</span><span className="crm-tres-site">{siteOf(i) || i.v.name || `${t("Job", "Trabajo")} ${i.r.job_id}`}</span>{stageBadge(i)}</button></li>
              ))}</ul>)}
          {tItem && (
            <div className="crm-tl-wrap" data-testid="track-detail">
              <div className="crm-tl-head">
                <span className="crm-trk-txt">{tItem.r.tracking_no}</span>
                <strong>{siteOf(tItem) || t("Site address not captured", "Dirección del sitio no capturada")}</strong>
                <span className="crm-sub">{tItem.v.name || t("Customer not captured", "Cliente no capturado")} · {t("Job", "Trabajo")} {tItem.r.job_id}{tItem.c?.permit_ref ? ` · ${t("Permit ref.", "Ref. de permiso")} ${tItem.c.permit_ref}` : ""}</span>
              </div>
              <dl className="crm-status2">
                <div><dt>{t("Office label (manual)", "Etiqueta de oficina (manual)")}</dt><dd>{stageName(tItem.stage)}</dd></div>
                <div><dt>{t("Official building department status", "Estado oficial del departamento de construcción")}</dt><dd data-testid="track-official">{t("Not recorded in PermitDraft", "No registrado en PermitDraft")}</dd></div>
              </dl>
              <h3 className="crm-h3">{t("Recorded milestones", "Hitos registrados")}</h3>
              <ol className="crm-tl" data-testid="track-timeline">
                {milestones(tItem).map((m, n) => (
                  <li key={n} className={m.kind}><span className="crm-tl-dot" aria-hidden /><div><strong>{m.label}</strong><span className="crm-sub">{fmtWhen(m.at)}{m.who ? ` · ${m.who}` : ""}</span></div></li>
                ))}
              </ol>
              <div className="crm-tl-actions">
                <Button type="button" variant="outline" onClick={() => setTsel(null)}>{t("Back to results", "Volver a resultados")}</Button>
                <Button type="button" onClick={() => { const id = tItem.r.id; setTrack(false); setTq(""); setTsel(null); setOpen(id); }} data-testid="track-details">{t("Open details", "Abrir detalles")}</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
