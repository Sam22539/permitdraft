import { Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { backend } from "../lib/backend";
import { useLang } from "../lib/lang";
import { assignJob, getRoster, unassignJob, type RosterEntry } from "../lib/dispatch";
import { AppPage } from "./app-shell";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "./ui/sheet";
import { AlertTriangle, CalendarClock, ChevronLeft, ChevronRight, MapPin, Plus, UserRound } from "lucide-react";

export type Assignment = { packet_id: string; company_id: string; technician_email: string; starts_at: string; ends_at: string; note: string | null; tracking_no: string; address: string | null; customer_name: string | null; assigned_by: string; updated_by: string; updated_at: string };
type Pk = { id: string; job_id: string; tracking_no: string; sent_at: string; captured_fields: { values?: Record<string, string>; formDefaults?: Record<string, string> } | null };
type Audit = { id: string; packet_id: string; tracking_no: string; action: string; actor: string; from_tech: string | null; to_tech: string | null; from_start: string | null; to_start: string | null; at: string };
type Me = { state: "loading" } | { state: "none" } | { state: "ok"; role: "admin" | "office" | "technician"; company: string; email: string };

/** The signed-in person's company membership, read under row level security (their own row only). */
export function useMe(): Me {
  const [s, setS] = useState<Me>({ state: "loading" });
  useEffect(() => {
    let live = true;
    (async () => {
      const { data: sess } = await backend.auth.getSession();
      const email = sess.session?.user.email?.toLowerCase();
      if (!email) { if (live) setS({ state: "none" }); return; }
      const { data: m } = await backend.from("company_members").select("role, company_id").eq("email", email).maybeSingle();
      if (!live) return;
      setS(m ? { state: "ok", role: m.role, company: m.company_id, email } : { state: "none" });
    })().catch(() => { if (live) setS({ state: "none" }); });
    return () => { live = false; };
  }, []);
  return s;
}

const isOfficeRole = (r: string) => r === "admin" || r === "office";
const startOfDay = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
const pad = (n: number) => String(n).padStart(2, "0");
const toDateInput = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const toTimeInput = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const overlaps = (a: { starts_at: string; ends_at: string }, b: { starts_at: string; ends_at: string }) => +new Date(a.starts_at) < +new Date(b.ends_at) && +new Date(b.starts_at) < +new Date(a.ends_at);

function useFmt() {
  const { lang } = useLang();
  const loc = lang === "es" ? "es" : "en-US";
  return {
    time: (iso: string) => new Date(iso).toLocaleTimeString(loc, { hour: "numeric", minute: "2-digit" }),
    day: (d: Date) => d.toLocaleDateString(loc, { weekday: "long", month: "short", day: "numeric" }),
    short: (iso: string) => new Date(iso).toLocaleString(loc, { dateStyle: "medium", timeStyle: "short" }),
  };
}

/** Pairs of assignments for one technician whose time windows overlap: packet id -> tracking numbers it overlaps. */
function conflictMap(list: Assignment[]): Map<string, string[]> {
  const m = new Map<string, string[]>();
  for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
    const a = list[i], b = list[j];
    if (a.technician_email === b.technician_email && overlaps(a, b)) {
      m.set(a.packet_id, [...(m.get(a.packet_id) ?? []), b.tracking_no]);
      m.set(b.packet_id, [...(m.get(b.packet_id) ?? []), a.tracking_no]);
    }
  }
  return m;
}

function useOfficeData(company: string) {
  const [data, setData] = useState<{ assignments: Assignment[]; packets: Pk[]; roster: RosterEntry[]; audit: Audit[] } | null>(null);
  const [err, setErr] = useState(false);
  const load = useCallback(async () => {
    const { data: sess } = await backend.auth.getSession();
    const token = sess.session?.access_token;
    if (!token) { setErr(true); return; }
    try {
      const [a, p, au, r] = await Promise.all([
        backend.from("job_assignments").select("packet_id, company_id, technician_email, starts_at, ends_at, note, tracking_no, address, customer_name, assigned_by, updated_by, updated_at").eq("company_id", company).order("starts_at").limit(1000),
        backend.from("office_packets").select("id, job_id, tracking_no, sent_at, captured_fields").eq("company_id", company).order("sent_at", { ascending: false }).limit(500),
        backend.from("job_assignment_audit").select("id, packet_id, tracking_no, action, actor, from_tech, to_tech, from_start, to_start, at").eq("company_id", company).order("at", { ascending: false }).limit(40),
        getRoster({ data: { token } }),
      ]);
      if (a.error || p.error || au.error || !r.ok) { setErr(true); return; }
      setErr(false);
      setData({ assignments: a.data as Assignment[], packets: p.data as Pk[], audit: au.data as Audit[], roster: r.roster });
    } catch { setErr(true); }
  }, [company]);
  useEffect(() => { void load(); }, [load]);
  return { data, err, load };
}

const pkAddress = (p: Pk) => { const v = { ...(p.captured_fields?.formDefaults ?? {}), ...(p.captured_fields?.values ?? {}) }; return [v.addr, v.city].filter(Boolean).join(", "); };

function Frame({ title, intro, children }: { title: string; intro: string; children: React.ReactNode }) {
  return (
    <AppPage bottom wide>
      <header className="jb-head">
        <div className="jb-title"><h1>{title}</h1></div>
        <p className="ap-muted">{intro}</p>
      </header>
      {children}
    </AppPage>
  );
}

function Status({ children }: { children: React.ReactNode }) { return <p className="ap-muted" role="status">{children}</p>; }

function JobLine({ a, conflict, onOpen, showTech }: { a: Assignment; conflict?: string[]; onOpen?: () => void; showTech?: boolean }) {
  const { t } = useLang();
  const f = useFmt();
  return (
    <li className={`oh-row${conflict?.length ? " overdue" : ""}`} data-testid="ds-item">
      <div className="oh-row-main">
        <span className="jb-addr">{f.time(a.starts_at)} – {f.time(a.ends_at)} · {a.tracking_no}</span>
        <span className="ap-muted"><MapPin size={14} aria-hidden className="inline mr-1" />{a.address || t("No address captured", "Sin dirección capturada")}{a.customer_name ? ` · ${a.customer_name}` : ""}</span>
        {showTech && <span className="ap-muted"><UserRound size={14} aria-hidden className="inline mr-1" />{a.technician_email}</span>}
        {a.note && <span className="ap-muted">{a.note}</span>}
        {conflict?.length ? <span className="ds-conflict" role="status"><AlertTriangle size={14} aria-hidden />{t("Conflict: overlaps", "Conflicto: se superpone con")} {conflict.join(", ")}</span> : null}
      </div>
      {onOpen && <div className="oh-row-actions"><Button type="button" variant="outline" className="oh-more" onClick={onOpen} data-testid="ds-edit">{t("Assign or reschedule", "Asignar o reprogramar")}</Button></div>}
    </li>
  );
}

/** Today's Schedule panel for the office workspace, from the same assignment records as Dispatch. */
export function TodaysSchedule({ company }: { company: string }) {
  const { t } = useLang();
  const [rows, setRows] = useState<Assignment[] | null>(null);
  const [err, setErr] = useState(false);
  const [insp, setInsp] = useState<{ id: string; kind: string; scheduled_at: string; tracking_no: string }[]>([]);
  useEffect(() => {
    let live = true;
    const d0 = startOfDay(new Date());
    backend.from("company_inspections").select("id, kind, scheduled_at, tracking_no").eq("company_id", company).eq("status", "scheduled")
      .gte("scheduled_at", d0.toISOString()).lt("scheduled_at", addDays(d0, 1).toISOString()).order("scheduled_at")
      .then(({ data }) => { if (live && data) setInsp(data); }, () => {});
    return () => { live = false; };
  }, [company]);
  useEffect(() => {
    let live = true;
    const a = startOfDay(new Date());
    backend.from("job_assignments").select("packet_id, company_id, technician_email, starts_at, ends_at, note, tracking_no, address, customer_name, assigned_by, updated_by, updated_at")
      .eq("company_id", company).gte("starts_at", a.toISOString()).lt("starts_at", addDays(a, 1).toISOString()).order("starts_at")
      .then(({ data, error }) => { if (!live) return; if (error) setErr(true); else setRows(data as Assignment[]); }, () => { if (live) setErr(true); });
    return () => { live = false; };
  }, [company]);
  const conf = useMemo(() => conflictMap(rows ?? []), [rows]);
  return (
    <section className="crm-panel" aria-labelledby="crm-ts-h" data-testid="todays-schedule">
      <h3 id="crm-ts-h" className="crm-h3">{t("Today's Schedule", "Agenda de hoy")}</h3>
      {err ? <p className="crm-note" role="alert">{t("Could not load today's schedule.", "No se pudo cargar la agenda de hoy.")}</p>
        : rows === null ? <p className="crm-note" role="status">{t("Loading…", "Cargando…")}</p>
        : rows.length === 0 && insp.length === 0 ? <p className="crm-note" data-testid="ts-empty">{t("Nothing is scheduled for today.", "No hay nada programado para hoy.")}</p>
        : <>
          {rows.length > 0 && <ul className="oh-rows">{rows.map((a) => <JobLine key={a.packet_id} a={a} conflict={conf.get(a.packet_id)} showTech />)}</ul>}
          {insp.length > 0 && <ul className="oh-rows" data-testid="ts-inspections" aria-label={t("Inspections today (company-recorded)", "Inspecciones de hoy (registradas por la empresa)")}>
            {insp.map((i) => <li key={i.id} className="oh-row today"><div className="oh-row-main"><span className="jb-addr">{new Date(i.scheduled_at).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })} · {t("Inspection", "Inspección")} · {i.tracking_no}</span><span className="ap-muted">{i.kind} · {t("company-recorded", "registrada por la empresa")}</span></div></li>)}
          </ul>}
        </>}
      <Link to="/dispatch" className="ap-btn oh-open" data-testid="ts-open">{t("Open Dispatch & Schedule", "Abrir despacho y agenda")}</Link>
    </section>
  );
}

function AssignForm({ company, jobs, techs, assignments, initial, onDone }: { company: string; jobs: Pk[]; techs: RosterEntry[]; assignments: Assignment[]; initial: Assignment | null; onDone: () => Promise<void> }) {
  const { t } = useLang();
  const base = initial ? new Date(initial.starts_at) : (() => { const d = new Date(); d.setHours(d.getHours() + 1, 0, 0, 0); return d; })();
  const baseEnd = initial ? new Date(initial.ends_at) : new Date(+base + 2 * 3600000);
  const [job, setJob] = useState(initial?.packet_id ?? "");
  const [tech, setTech] = useState(initial?.technician_email ?? "");
  const [date, setDate] = useState(toDateInput(base));
  const [from, setFrom] = useState(toTimeInput(base));
  const [to, setTo] = useState(toTimeInput(baseEnd));
  const [note, setNote] = useState(initial?.note ?? "");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const start = new Date(`${date}T${from}`), end = new Date(`${date}T${to}`);
  const valid = !isNaN(+start) && !isNaN(+end) && end > start;
  const clash = valid && tech ? assignments.filter((a) => a.packet_id !== job && a.technician_email === tech && overlaps({ starts_at: start.toISOString(), ends_at: end.toISOString() }, a)) : [];
  const save = async () => {
    if (!job || !tech) { setMsg(t("Choose a job and a technician.", "Elija un trabajo y un técnico.")); return; }
    if (!valid) { setMsg(t("The end time must be after the start time.", "La hora de fin debe ser posterior a la de inicio.")); return; }
    setBusy(true); setMsg(null);
    try {
      const { data: sess } = await backend.auth.getSession();
      const r = await assignJob({ data: { token: sess.session?.access_token ?? "", packetId: job, tech, start: start.toISOString(), end: end.toISOString(), note } });
      if (!r.ok) { setMsg(t("Not saved. Check your role, the technician and the time window.", "No se guardó. Revise su rol, el técnico y el horario.")); setBusy(false); return; }
      await onDone();
    } catch { setMsg(t("Not saved. Try again.", "No se guardó. Intente de nuevo.")); }
    setBusy(false);
  };
  void company;
  return (
    <div className="oh-form" data-testid="assign-form">
      <div className="ap-field">
        <label htmlFor="as-job">{t("Job", "Trabajo")}</label>
        <Select value={job} onValueChange={setJob} disabled={!!initial}>
          <SelectTrigger id="as-job" className="oh-select" data-testid="as-job"><SelectValue placeholder={t("Choose a job", "Elija un trabajo")} /></SelectTrigger>
          <SelectContent>{jobs.map((p) => <SelectItem key={p.id} value={p.id}>{p.tracking_no}{pkAddress(p) ? ` · ${pkAddress(p)}` : ` · ${t("Job", "Trabajo")} ${p.job_id}`}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="ap-field">
        <label htmlFor="as-tech">{t("Technician", "Técnico")}</label>
        <Select value={tech} onValueChange={setTech}>
          <SelectTrigger id="as-tech" className="oh-select" data-testid="as-tech"><SelectValue placeholder={t("Choose a technician", "Elija un técnico")} /></SelectTrigger>
          <SelectContent>{techs.map((m) => <SelectItem key={m.email} value={m.email}>{m.email}{m.employeeId ? ` · ${m.employeeId}` : ""}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="oh-form-grid">
        <div className="ap-field"><label htmlFor="as-date">{t("Date", "Fecha")}</label><Input id="as-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} data-testid="as-date" /></div>
        <div className="ap-field"><label htmlFor="as-from">{t("Start", "Inicio")}</label><Input id="as-from" type="time" value={from} onChange={(e) => setFrom(e.target.value)} data-testid="as-from" /></div>
        <div className="ap-field"><label htmlFor="as-to">{t("End", "Fin")}</label><Input id="as-to" type="time" value={to} onChange={(e) => setTo(e.target.value)} data-testid="as-to" /></div>
      </div>
      <div className="ap-field"><label htmlFor="as-note">{t("Note for the technician", "Nota para el técnico")}</label><Textarea id="as-note" value={note} maxLength={500} onChange={(e) => setNote(e.target.value)} data-testid="as-note" /></div>
      {clash.length > 0 && <p className="ds-conflict" role="status" data-testid="as-conflict"><AlertTriangle size={14} aria-hidden />{t("This technician already has", "Este técnico ya tiene")} {clash.map((c) => c.tracking_no).join(", ")} {t("in that window. You can still save it.", "en ese horario. Aun así puede guardarlo.")}</p>}
      <div className="oh-save">
        <Button type="button" onClick={save} disabled={busy} data-testid="as-save">{initial?.technician_email ? t("Save changes", "Guardar cambios") : t("Assign job", "Asignar trabajo")}</Button>
        {msg && <span role="status" className="ap-muted">{msg}</span>}
      </div>
    </div>
  );
}

const ACTION: Record<string, [string, string]> = { assigned: ["Assigned", "Asignado"], reassigned: ["Reassigned", "Reasignado"], rescheduled: ["Rescheduled", "Reprogramado"], reassigned_rescheduled: ["Reassigned and rescheduled", "Reasignado y reprogramado"], unassigned: ["Unassigned", "Desasignado"] };

type Win = "day" | "week" | "month";

function OfficeDispatch({ company }: { company: string }) {
  const { t, lang } = useLang();
  const f = useFmt();
  const { data, err, load } = useOfficeData(company);
  const [win, setWin] = useState<Win>("day");
  const [anchor, setAnchor] = useState(() => startOfDay(new Date()));
  const [sheet, setSheet] = useState<null | "new" | Assignment>(null);
  const [confirm, setConfirm] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [techFilter, setTechFilter] = useState("all");
  const loc = lang === "es" ? "es" : "en-US";

  const range = useMemo(() => {
    if (win === "day") return [anchor, addDays(anchor, 1)] as const;
    if (win === "week") { const s = addDays(anchor, -anchor.getDay()); return [s, addDays(s, 7)] as const; }
    const s = new Date(anchor.getFullYear(), anchor.getMonth(), 1); return [s, new Date(anchor.getFullYear(), anchor.getMonth() + 1, 1)] as const;
  }, [win, anchor]);
  const techs = useMemo(() => (data?.roster ?? []).filter((m) => m.role === "technician"), [data]);
  const all = data?.assignments ?? [];
  const conf = useMemo(() => conflictMap(all), [all]);
  const inWin = all.filter((a) => +new Date(a.starts_at) >= +range[0] && +new Date(a.starts_at) < +range[1] && (techFilter === "all" || a.technician_email === techFilter));
  const byDay = useMemo(() => { const m = new Map<string, Assignment[]>(); inWin.forEach((a) => { const k = dayKey(new Date(a.starts_at)); m.set(k, [...(m.get(k) ?? []), a]); }); return m; }, [inWin]);
  const days: Date[] = []; for (let d = range[0]; +d < +range[1]; d = addDays(d, 1)) days.push(d);
  const assignedIds = new Set(all.map((a) => a.packet_id));
  const unassigned = (data?.packets ?? []).filter((p) => !assignedIds.has(p.id));
  const conflictCount = inWin.filter((a) => conf.has(a.packet_id)).length;

  const step = (dir: number) => setAnchor((a) => win === "day" ? addDays(a, dir) : win === "week" ? addDays(a, 7 * dir) : new Date(a.getFullYear(), a.getMonth() + dir, 1));
  const label = win === "day" ? f.day(anchor) : win === "week" ? `${range[0].toLocaleDateString(loc, { month: "short", day: "numeric" })} – ${addDays(range[1], -1).toLocaleDateString(loc, { month: "short", day: "numeric" })}` : anchor.toLocaleDateString(loc, { month: "long", year: "numeric" });
  const remove = async (id: string) => {
    setConfirm(null); setMsg(null);
    try {
      const { data: sess } = await backend.auth.getSession();
      const r = await unassignJob({ data: { token: sess.session?.access_token ?? "", packetId: id } });
      if (!r.ok) { setMsg(t("Could not unassign.", "No se pudo desasignar.")); return; }
      await load();
    } catch { setMsg(t("Could not unassign.", "No se pudo desasignar.")); }
  };

  if (err) return <p className="ap-muted" role="alert">{t("Could not load the schedule.", "No se pudo cargar la agenda.")}</p>;
  if (!data) return <Status>{t("Loading…", "Cargando…")}</Status>;
  return (
    <section className="oh-queue crm" aria-label={t("Dispatch & Schedule", "Despacho y agenda")} data-testid="dispatch">
      <div className="crm-head">
        <div className="jb-chips" role="group" aria-label={t("Schedule window", "Ventana de agenda")}>
          {(["day", "week", "month"] as Win[]).map((w) => <button key={w} type="button" className="jb-chip" aria-pressed={win === w} onClick={() => setWin(w)} data-testid={`win-${w}`}>{w === "day" ? t("Day", "Día") : w === "week" ? t("Week", "Semana") : t("Month", "Mes")}</button>)}
        </div>
        <Button type="button" className="crm-track-btn" onClick={() => setSheet("new")} data-testid="ds-new"><Plus size={18} aria-hidden />{t("Assign a job", "Asignar un trabajo")}</Button>
      </div>
      <div className="ds-nav">
        <Button type="button" variant="outline" onClick={() => step(-1)} aria-label={t("Previous", "Anterior")}><ChevronLeft size={18} aria-hidden /></Button>
        <strong data-testid="ds-label">{label}</strong>
        <Button type="button" variant="outline" onClick={() => step(1)} aria-label={t("Next", "Siguiente")}><ChevronRight size={18} aria-hidden /></Button>
        <Button type="button" variant="outline" onClick={() => setAnchor(startOfDay(new Date()))}>{t("Today", "Hoy")}</Button>
        <div className="ds-filter">
          <Select value={techFilter} onValueChange={setTechFilter}>
            <SelectTrigger className="oh-select" aria-label={t("Filter by technician", "Filtrar por técnico")} data-testid="ds-tech-filter"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">{t("All technicians", "Todos los técnicos")}</SelectItem>{techs.map((m) => <SelectItem key={m.email} value={m.email}>{m.email}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <p className="ap-muted" role="status" data-testid="ds-summary">
        {t(`${inWin.length} scheduled in this window`, `${inWin.length} programado(s) en esta ventana`)}{conflictCount > 0 ? ` · ${t(`${conflictCount} with a conflict`, `${conflictCount} con conflicto`)}` : ""}
      </p>
      {msg && <p className="ap-muted" role="alert">{msg}</p>}

      {win === "month" && (
        <div className="ds-month" role="grid" aria-label={label}>
          {days.map((d) => { const n = byDay.get(dayKey(d))?.length ?? 0; return (
            <button key={dayKey(d)} type="button" className={`ds-cell${n ? " has" : ""}`} onClick={() => { setAnchor(startOfDay(d)); setWin("day"); }} aria-label={`${d.toLocaleDateString(loc, { dateStyle: "medium" })}: ${n}`}>
              <span>{d.getDate()}</span>{n > 0 && <b>{n}</b>}
            </button>
          ); })}
        </div>
      )}
      {win !== "month" && (
        <div className="oh-panel">
          {days.map((d) => { const list = byDay.get(dayKey(d)) ?? []; if (win === "week" && list.length === 0) return null; return (
            <div key={dayKey(d)} className="oh-panel">
              {win === "week" && <h3 className="crm-h3">{f.day(d)}</h3>}
              {list.length === 0
                ? <div className="jb-empty" data-testid="ds-empty"><p><CalendarClock size={16} aria-hidden className="inline mr-1" />{t("Nothing is scheduled for this day.", "No hay nada programado para este día.")}</p></div>
                : <ul className="oh-rows">{list.map((a) => <JobLine key={a.packet_id} a={a} showTech conflict={conf.get(a.packet_id)} onOpen={() => setSheet(a)} />)}</ul>}
            </div>
          ); })}
          {win === "week" && inWin.length === 0 && <div className="jb-empty" data-testid="ds-empty"><p>{t("Nothing is scheduled this week.", "No hay nada programado esta semana.")}</p></div>}
        </div>
      )}

      <section className="crm-panel" aria-labelledby="ds-un-h">
        <h2 id="ds-un-h" className="crm-h3">{t("Jobs waiting for a technician", "Trabajos esperando técnico")}</h2>
        {unassigned.length === 0 ? <p className="crm-note" data-testid="ds-none-un">{t("Every job sent to the office has been assigned.", "Todos los trabajos enviados a la oficina están asignados.")}</p>
          : <ul className="oh-rows" data-testid="ds-unassigned">{unassigned.slice(0, 25).map((p) => (
            <li key={p.id} className="oh-row"><div className="oh-row-main"><span className="jb-addr">{p.tracking_no}</span><span className="ap-muted">{pkAddress(p) || `${t("Job", "Trabajo")} ${p.job_id}`}</span></div>
              <div className="oh-row-actions"><Button type="button" variant="outline" className="oh-more" onClick={() => setSheet({ packet_id: p.id, company_id: company, technician_email: "", starts_at: "", ends_at: "", note: null, tracking_no: p.tracking_no, address: null, customer_name: null, assigned_by: "", updated_by: "", updated_at: "" })} data-testid="ds-assign-row">{t("Assign", "Asignar")}</Button></div></li>
          ))}</ul>}
      </section>

      <section className="crm-panel" aria-labelledby="ds-au-h">
        <h2 id="ds-au-h" className="crm-h3">{t("Assignment history", "Historial de asignaciones")}</h2>
        {data.audit.length === 0 ? <p className="crm-note">{t("No assignment changes yet.", "Aún no hay cambios de asignación.")}</p>
          : <ul className="ds-audit" data-testid="ds-audit">{data.audit.map((e) => (
            <li key={e.id}><strong>{t(...ACTION[e.action] ?? [e.action, e.action])}</strong> · {e.tracking_no} · {e.from_tech && e.to_tech && e.from_tech !== e.to_tech ? `${e.from_tech} → ${e.to_tech}` : e.to_tech ?? e.from_tech}{e.to_start ? ` · ${f.short(e.to_start)}` : ""}
              <span className="ap-muted"> — {e.actor}, {f.short(e.at)}</span></li>
          ))}</ul>}
      </section>

      <Sheet open={sheet !== null} onOpenChange={(o) => !o && setSheet(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto p-4">
          <SheetHeader>
            <SheetTitle>{sheet && typeof sheet !== "string" && sheet.technician_email ? t("Reassign or reschedule", "Reasignar o reprogramar") : t("Assign a job", "Asignar un trabajo")}</SheetTitle>
            <SheetDescription>{t("Pick the job, the technician and the time window.", "Elija el trabajo, el técnico y el horario.")}</SheetDescription>
          </SheetHeader>
          {sheet && (() => {
            const cur = typeof sheet === "string" ? null : sheet;
            const existing = cur && cur.technician_email ? cur : null;
            const key = cur ? cur.packet_id + cur.updated_at : "new";
            return <>
              <AssignForm key={key} company={company} jobs={data.packets} techs={techs} assignments={all} initial={existing ?? (cur ? { ...cur, technician_email: "", starts_at: new Date(Date.now() + 3600000).toISOString(), ends_at: new Date(Date.now() + 3 * 3600000).toISOString() } : null)} onDone={async () => { await load(); setSheet(null); }} />
              {existing && (confirm === existing.packet_id
                ? <Button type="button" variant="outline" onClick={() => remove(existing.packet_id).then(() => setSheet(null))} data-testid="ds-unassign-yes">{t("Confirm unassign", "Confirmar desasignar")}</Button>
                : <Button type="button" variant="outline" onClick={() => setConfirm(existing.packet_id)} data-testid="ds-unassign">{t("Unassign this job", "Desasignar este trabajo")}</Button>)}
            </>;
          })()}
        </SheetContent>
      </Sheet>
    </section>
  );
}

/** A technician's own assignments only (row level security returns nothing else). */
function MySchedule({ email }: { email: string }) {
  const { t } = useLang();
  const f = useFmt();
  const [rows, setRows] = useState<Assignment[] | null>(null);
  const [err, setErr] = useState(false);
  useEffect(() => {
    let live = true;
    backend.from("job_assignments").select("packet_id, company_id, technician_email, starts_at, ends_at, note, tracking_no, address, customer_name, assigned_by, updated_by, updated_at")
      .eq("technician_email", email).gte("ends_at", startOfDay(new Date()).toISOString()).order("starts_at").limit(200)
      .then(({ data, error }) => { if (!live) return; if (error) setErr(true); else setRows(data as Assignment[]); }, () => { if (live) setErr(true); });
    return () => { live = false; };
  }, [email]);
  if (err) return <p className="ap-muted" role="alert">{t("Could not load your assignments.", "No se pudieron cargar sus asignaciones.")}</p>;
  if (!rows) return <Status>{t("Loading…", "Cargando…")}</Status>;
  const today = startOfDay(new Date());
  const groups = new Map<string, { d: Date; list: Assignment[] }>();
  rows.forEach((a) => { const d = startOfDay(new Date(a.starts_at)); const k = dayKey(d); groups.set(k, { d, list: [...(groups.get(k)?.list ?? []), a] }); });
  return (
    <section className="oh-queue crm" aria-label={t("My assignments", "Mis asignaciones")} data-testid="my-schedule">
      {rows.length === 0 ? <div className="jb-empty" data-testid="my-empty"><p>{t("You have no assignments scheduled. Your office will assign jobs here.", "No tiene asignaciones programadas. Su oficina le asignará trabajos aquí.")}</p></div>
        : [...groups.values()].map(({ d, list }) => (
          <div key={dayKey(d)} className="oh-panel">
            <h2 className="crm-h3">{+d === +today ? `${t("Today", "Hoy")} · ${f.day(d)}` : f.day(d)}</h2>
            <ul className="oh-rows">{list.map((a) => <JobLine key={a.packet_id} a={a} />)}</ul>
          </div>
        ))}
    </section>
  );
}

export function DispatchPage() {
  const { t } = useLang();
  const me = useMe();
  const tech = me.state === "ok" && me.role === "technician";
  return (
    <Frame title={tech ? t("My schedule", "Mi agenda") : t("Dispatch & Schedule", "Despacho y agenda")}
      intro={tech ? t("Only the jobs your office assigned to you.", "Solo los trabajos que su oficina le asignó.") : t("Assign jobs to your technicians, set the time and see conflicts by day, week or month.", "Asigne trabajos a sus técnicos, fije la hora y vea los conflictos por día, semana o mes.")}>
      {me.state === "loading" ? <Status>{t("Loading…", "Cargando…")}</Status>
        : me.state === "none" ? <p className="ap-muted" data-testid="ds-denied">{t("Dispatch is for members of a company. ", "El despacho es para miembros de una empresa. ")}<Link to="/office-setup" className="underline font-semibold">{t("Office setup", "Configuración de oficina")}</Link></p>
        : isOfficeRole(me.role) ? <OfficeDispatch company={me.company} />
        : <MySchedule email={me.email} />}
    </Frame>
  );
}

export function TechniciansPage() {
  const { t } = useLang();
  const f = useFmt();
  const me = useMe();
  const company = me.state === "ok" && isOfficeRole(me.role) ? me.company : null;
  const { data, err } = useOfficeData(company ?? "00000000-0000-0000-0000-000000000000");
  const body = () => {
    if (me.state === "loading") return <Status>{t("Loading…", "Cargando…")}</Status>;
    if (me.state === "none" || !company) return <p className="ap-muted" data-testid="tech-denied">{me.state === "ok" ? <>{t("Only office staff and admins can see the technician roster. ", "Solo el personal de oficina y los administradores ven la lista de técnicos. ")}<Link to="/dispatch" className="underline font-semibold">{t("My schedule", "Mi agenda")}</Link></> : <>{t("Technicians are for members of a company. ", "Los técnicos son para miembros de una empresa. ")}<Link to="/office-setup" className="underline font-semibold">{t("Office setup", "Configuración de oficina")}</Link></>}</p>;
    if (err) return <p className="ap-muted" role="alert">{t("Could not load technicians.", "No se pudieron cargar los técnicos.")}</p>;
    if (!data) return <Status>{t("Loading…", "Cargando…")}</Status>;
    const techs = data.roster.filter((m) => m.role === "technician");
    if (techs.length === 0) return <div className="jb-empty" data-testid="tech-empty"><p>{t("No technicians are on your roster yet. Add them in Office setup.", "Aún no hay técnicos en su lista. Agréguelos en la configuración de oficina.")}</p><Link to="/office-setup" className="ap-btn primary">{t("Office setup", "Configuración de oficina")}</Link></div>;
    const now = Date.now(), today = startOfDay(new Date());
    return (
      <section className="oh-queue crm" aria-label={t("Technicians", "Técnicos")} data-testid="technicians">
        <ul className="oh-rows">
          {techs.map((m) => {
            const mine = data.assignments.filter((a) => a.technician_email === m.email);
            const todayN = mine.filter((a) => +new Date(a.starts_at) >= +today && +new Date(a.starts_at) < +addDays(today, 1)).length;
            const next = mine.find((a) => +new Date(a.ends_at) > now);
            const cur = mine.find((a) => +new Date(a.starts_at) <= now && +new Date(a.ends_at) > now);
            return (
              <li key={m.email} className="oh-row" data-testid="tech-row">
                <div className="oh-row-main">
                  <span className="jb-addr">{m.email}</span>
                  <span className="ap-muted">{m.employeeId ? `${t("Employee ID", "ID de empleado")} ${m.employeeId}` : t("No employee ID set", "Sin ID de empleado")}</span>
                  <span className="ap-muted">{cur ? t(`On a job now: ${cur.tracking_no}`, `En un trabajo ahora: ${cur.tracking_no}`) : t("Not on a job right now", "Sin trabajo en este momento")} · {t(`${todayN} scheduled today`, `${todayN} programado(s) hoy`)}</span>
                  <span className="ap-muted">{next ? `${t("Next", "Siguiente")}: ${next.tracking_no} · ${f.short(next.starts_at)}${next.address ? " · " + next.address : ""}` : t("Nothing upcoming", "Nada próximo")}</span>
                </div>
                <div className="oh-row-actions"><Link to="/dispatch" className="ap-btn primary oh-open">{t("Open Dispatch", "Abrir despacho")}</Link></div>
              </li>
            );
          })}
        </ul>
      </section>
    );
  };
  return <Frame title={t("Technicians", "Técnicos")} intro={t("The field technicians on your company roster and what each has scheduled.", "Los técnicos de campo de su empresa y lo que cada uno tiene programado.")}>{body()}</Frame>;
}
