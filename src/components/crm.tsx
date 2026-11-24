import { Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { backend } from "../lib/backend";
import { useLang } from "../lib/lang";
import { AppPage } from "./app-shell";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "./ui/sheet";
import { Plus, Link2, Unlink } from "lucide-react";

type Customer = { id: string; name: string; company_name: string | null; contact_name: string | null; email: string | null; phone: string | null; notes: string | null; created_by: string | null; created_at: string; updated_by: string | null; updated_at: string };
type PLink = { packet_id: string; customer_id: string; linked_by: string | null; linked_at: string };
type Pk = { id: string; job_id: string; tracking_no: string; sent_at: string; captured_fields: { values?: Record<string, string>; formDefaults?: Record<string, string> } | null };
type Lead = { id: string; name: string; company_name: string | null; contact: string | null; stage: string; next_action: string | null; next_action_date: string | null; customer_id: string | null; converted_by: string | null; converted_at: string | null; updated_by: string | null; updated_at: string };

const LEAD_STAGES: [string, string, string][] = [["new", "New", "Nuevo"], ["contacted", "Contacted", "Contactado"], ["quoted", "Quoted", "Cotizado"], ["won", "Won", "Ganado"], ["lost", "Lost", "Perdido"]];

/** The signed-in person's company and role. Only admin and office may use Customers and Leads (the database enforces it too). */
function useOffice() {
  const [s, setS] = useState<{ state: "loading" } | { state: "no" } | { state: "ok"; company: string }>({ state: "loading" });
  useEffect(() => {
    let live = true;
    (async () => {
      const { data: sess } = await backend.auth.getSession();
      const email = sess.session?.user.email?.toLowerCase();
      if (!email) { if (live) setS({ state: "no" }); return; }
      const { data: m } = await backend.from("company_members").select("role, company_id").eq("email", email).maybeSingle();
      if (!live) return;
      setS(m && (m.role === "admin" || m.role === "office") ? { state: "ok", company: m.company_id } : { state: "no" });
    })().catch(() => { if (live) setS({ state: "no" }); });
    return () => { live = false; };
  }, []);
  return s;
}

export function Gate({ title, intro, children }: { title: string; intro: string; children: (company: string) => React.ReactNode }) {
  const { t } = useLang();
  const o = useOffice();
  return (
    <AppPage bottom wide>
      <header className="jb-head">
        <div className="jb-title"><h1>{title}</h1></div>
        <p className="ap-muted">{intro}</p>
      </header>
      {o.state === "loading" ? <p className="ap-muted" role="status">{t("Loading…", "Cargando…")}</p>
        : o.state === "no" ? <p className="ap-muted" data-testid="crm-denied">{t("Only office reviewers and admins of your company can open this page. ", "Solo los revisores de oficina y administradores de su empresa pueden abrir esta página. ")}<Link to="/office-setup" className="underline font-semibold">{t("Office setup", "Configuración de oficina")}</Link></p>
        : children(o.company)}
    </AppPage>
  );
}

const nm = (v: string) => v.trim() || null;

function Stamp({ by, at }: { by: string | null; at: string }) {
  const { t, lang } = useLang();
  return <p className="ap-muted" data-testid="crm-stamp">{t("Last changed by", "Último cambio por")} {by || "—"} · {new Date(at).toLocaleString(lang === "es" ? "es" : "en-US", { dateStyle: "medium", timeStyle: "short" })}</p>;
}

function CustomerForm({ company, c, onSaved }: { company: string; c: Customer | null; onSaved: (id: string) => void }) {
  const { t } = useLang();
  const [f, setF] = useState({ name: c?.name ?? "", company_name: c?.company_name ?? "", contact_name: c?.contact_name ?? "", email: c?.email ?? "", phone: c?.phone ?? "", notes: c?.notes ?? "" });
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  const save = async () => {
    if (!f.name.trim()) { setMsg(t("Enter a name.", "Escriba un nombre.")); return; }
    setBusy(true); setMsg(null);
    const vals = { name: f.name.trim(), company_name: nm(f.company_name), contact_name: nm(f.contact_name), email: nm(f.email), phone: nm(f.phone), notes: nm(f.notes) };
    const r = c ? await backend.from("customers").update(vals).eq("id", c.id).select("id").maybeSingle() : await backend.from("customers").insert({ company_id: company, ...vals }).select("id").maybeSingle();
    setBusy(false);
    if (r.error || !r.data) { setMsg(t("Not saved. Check your role and try again.", "No se guardó. Revise su rol e intente de nuevo.")); return; }
    setMsg(t("Saved.", "Guardado."));
    onSaved(r.data.id);
  };
  return (
    <div className="oh-form" data-testid="customer-form">
      <div className="ap-field"><label htmlFor="cu-name">{t("Name", "Nombre")}</label><Input id="cu-name" value={f.name} maxLength={120} onChange={set("name")} data-testid="cu-name" /></div>
      <div className="ap-field"><label htmlFor="cu-co">{t("Company", "Empresa")}</label><Input id="cu-co" value={f.company_name} maxLength={120} onChange={set("company_name")} data-testid="cu-company" /></div>
      <div className="oh-form-grid">
        <div className="ap-field"><label htmlFor="cu-ct">{t("Contact person", "Persona de contacto")}</label><Input id="cu-ct" value={f.contact_name} maxLength={120} onChange={set("contact_name")} data-testid="cu-contact" /></div>
        <div className="ap-field"><label htmlFor="cu-ph">{t("Phone", "Teléfono")}</label><Input id="cu-ph" value={f.phone} maxLength={40} onChange={set("phone")} data-testid="cu-phone" /></div>
      </div>
      <div className="ap-field"><label htmlFor="cu-em">{t("Email", "Correo")}</label><Input id="cu-em" type="email" value={f.email} maxLength={200} onChange={set("email")} data-testid="cu-email" /></div>
      <div className="ap-field"><label htmlFor="cu-nt">{t("Internal note", "Nota interna")}</label><Textarea id="cu-nt" value={f.notes} maxLength={2000} onChange={set("notes")} data-testid="cu-notes" /></div>
      <div className="oh-save">
        <Button type="button" onClick={save} disabled={busy} data-testid="cu-save">{c ? t("Save customer", "Guardar cliente") : t("Add customer", "Agregar cliente")}</Button>
        {msg && <span role="status" className="ap-muted">{msg}</span>}
      </div>
    </div>
  );
}

function CustomerDetail({ company, c, links, packets, reload }: { company: string; c: Customer; links: PLink[]; packets: Pk[]; reload: () => Promise<void> }) {
  const { t, lang } = useLang();
  const [pick, setPick] = useState("");
  const [confirm, setConfirm] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const mine = links.filter((l) => l.customer_id === c.id);
  const byId = useMemo(() => new Map(packets.map((p) => [p.id, p])), [packets]);
  const linkedIds = new Set(links.map((l) => l.packet_id));
  const free = packets.filter((p) => !linkedIds.has(p.id));
  const label = (p: Pk) => { const v = { ...(p.captured_fields?.formDefaults ?? {}), ...(p.captured_fields?.values ?? {}) }; return `${p.tracking_no} · ${t("Job", "Trabajo")} ${p.job_id}${v.addr ? " · " + v.addr : ""}`; };
  const link = async () => {
    if (!pick) return;
    setMsg(null);
    const { error } = await backend.from("customer_packets").insert({ packet_id: pick, customer_id: c.id, company_id: company });
    if (error) { setMsg(t("Not linked. It may already be linked to a customer.", "No se vinculó. Puede que ya esté vinculado a un cliente.")); return; }
    setPick(""); await reload();
  };
  const unlink = async (pid: string) => {
    const { error } = await backend.from("customer_packets").delete().eq("packet_id", pid).eq("customer_id", c.id);
    setConfirm(null);
    if (error) setMsg(t("Not unlinked.", "No se desvinculó.")); else { setMsg(null); await reload(); }
  };
  return (
    <div className="oh-details" data-testid="customer-detail">
      <Stamp by={c.updated_by} at={c.updated_at} />
      <h3 className="crm-h3">{t("Linked jobs", "Trabajos vinculados")}</h3>
      <p className="crm-note">{t("Linking only files a job under this customer. It never changes the captured job, its photos or its customer name.", "Vincular solo archiva un trabajo bajo este cliente. Nunca cambia el trabajo capturado, sus fotos ni el nombre del cliente.")}</p>
      {mine.length === 0 ? <p className="ap-muted" data-testid="cu-nojobs">{t("No jobs linked yet.", "Aún no hay trabajos vinculados.")}</p> : (
        <ul className="oh-rows" data-testid="cu-jobs">
          {mine.map((l) => { const p = byId.get(l.packet_id); return (
            <li key={l.packet_id} className="oh-row" data-testid="cu-job">
              <div className="oh-row-main">
                <span className="jb-addr">{p ? label(p) : l.packet_id}</span>
                <span className="ap-muted">{p ? new Date(p.sent_at).toLocaleDateString(lang === "es" ? "es" : "en-US", { dateStyle: "medium" }) : ""} · {t("Linked by", "Vinculado por")} {l.linked_by || "—"}</span>
              </div>
              <div className="oh-row-actions">
                <Link to="/office-review/$id" params={{ id: l.packet_id }} className="ap-btn primary oh-open" data-testid="cu-open">{t("Open packet", "Abrir paquete")}</Link>
                {confirm === l.packet_id
                  ? <Button type="button" variant="outline" className="oh-more" onClick={() => unlink(l.packet_id)} data-testid="cu-unlink-yes">{t("Confirm unlink", "Confirmar desvincular")}</Button>
                  : <Button type="button" variant="outline" className="oh-more" onClick={() => setConfirm(l.packet_id)} data-testid="cu-unlink"><Unlink size={16} aria-hidden />{t("Unlink", "Desvincular")}</Button>}
              </div>
            </li>
          ); })}
        </ul>
      )}
      <div className="ap-field">
        <label htmlFor="cu-pick">{t("Link a job packet (not yet linked to any customer)", "Vincular un paquete (aún sin cliente)")}</label>
        <Select value={pick} onValueChange={setPick}>
          <SelectTrigger id="cu-pick" className="oh-select" data-testid="cu-pick"><SelectValue placeholder={free.length ? t("Choose a job", "Elija un trabajo") : t("No unlinked jobs", "No hay trabajos sin vincular")} /></SelectTrigger>
          <SelectContent>{free.map((p) => <SelectItem key={p.id} value={p.id}>{label(p)}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="oh-save">
        <Button type="button" onClick={link} disabled={!pick} data-testid="cu-link"><Link2 size={16} aria-hidden />{t("Link job", "Vincular trabajo")}</Button>
        {msg && <span role="status" className="ap-muted">{msg}</span>}
      </div>
    </div>
  );
}

export function CustomersPage() {
  const { t } = useLang();
  return (
    <Gate title={t("Customers", "Clientes")} intro={t("Your company's customers. Link the jobs your technicians sent so each customer's history is in one place.", "Los clientes de su empresa. Vincule los trabajos que enviaron sus técnicos para ver el historial de cada cliente en un solo lugar.")}>
      {(company) => <Customers company={company} />}
    </Gate>
  );
}

function Customers({ company }: { company: string }) {
  const { t } = useLang();
  const [custs, setCusts] = useState<Customer[] | null>(null);
  const [links, setLinks] = useState<PLink[]>([]);
  const [packets, setPackets] = useState<Pk[]>([]);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<string | "new" | null>(null);
  const [err, setErr] = useState(false);
  const load = useCallback(async () => {
    const [a, b, c] = await Promise.all([
      backend.from("customers").select("id, name, company_name, contact_name, email, phone, notes, created_by, created_at, updated_by, updated_at").eq("company_id", company).order("name"),
      backend.from("customer_packets").select("packet_id, customer_id, linked_by, linked_at").eq("company_id", company),
      backend.from("office_packets").select("id, job_id, tracking_no, sent_at, captured_fields").eq("company_id", company).order("sent_at", { ascending: false }).limit(500),
    ]);
    if (a.error || b.error || c.error) { setErr(true); return; }
    setCusts(a.data as Customer[]); setLinks(b.data as PLink[]); setPackets(c.data as Pk[]);
  }, [company]);
  useEffect(() => { void load(); }, [load]);
  const shown = useMemo(() => {
    const n = q.trim().toLowerCase();
    return (custs ?? []).filter((c) => !n || [c.name, c.company_name, c.contact_name, c.email, c.phone].filter(Boolean).join(" ").toLowerCase().includes(n));
  }, [custs, q]);
  const cur = custs?.find((c) => c.id === sel) ?? null;
  const counts = useMemo(() => { const m: Record<string, number> = {}; links.forEach((l) => { m[l.customer_id] = (m[l.customer_id] ?? 0) + 1; }); return m; }, [links]);
  return (
    <section className="oh-queue crm" aria-label={t("Customers", "Clientes")} data-testid="customers">
      <div className="crm-head">
        <div className="ap-field" style={{ flex: "1 1 18rem" }}>
          <label htmlFor="cu-q">{t("Search customers", "Buscar clientes")}</label>
          <Input id="cu-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" placeholder={t("Name, company, email or phone", "Nombre, empresa, correo o teléfono")} data-testid="cu-search" />
        </div>
        <Button type="button" className="crm-track-btn" onClick={() => setSel("new")} data-testid="cu-new"><Plus size={18} aria-hidden />{t("Add customer", "Agregar cliente")}</Button>
      </div>
      {err ? <p className="ap-muted" role="alert">{t("Could not load customers.", "No se pudieron cargar los clientes.")}</p>
        : custs === null ? <p className="ap-muted" role="status">{t("Loading…", "Cargando…")}</p>
        : custs.length === 0 ? <div className="jb-empty" data-testid="cu-empty"><p>{t("No customers yet. Add the first one.", "Aún no hay clientes. Agregue el primero.")}</p></div>
        : shown.length === 0 ? <div className="jb-empty"><p>{t("No customers match this search.", "Ningún cliente coincide con la búsqueda.")}</p></div>
        : (
          <ul className="oh-rows" data-testid="cu-list">
            {shown.map((c) => (
              <li key={c.id} className="oh-row" data-testid="cu-row">
                <div className="oh-row-main">
                  <span className="jb-addr">{c.name}</span>
                  <span className="ap-muted">{[c.company_name, c.contact_name, c.email, c.phone].filter(Boolean).join(" · ") || "—"}</span>
                  <span className="ap-muted">{t(`${counts[c.id] ?? 0} linked job(s)`, `${counts[c.id] ?? 0} trabajo(s) vinculado(s)`)}</span>
                </div>
                <div className="oh-row-actions"><Button type="button" variant="outline" className="oh-more" onClick={() => setSel(c.id)} data-testid="cu-edit">{t("Open customer", "Abrir cliente")}</Button></div>
              </li>
            ))}
          </ul>
        )}
      <Sheet open={sel !== null} onOpenChange={(o) => !o && setSel(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto p-4">
          <SheetHeader>
            <SheetTitle>{sel === "new" ? t("Add customer", "Agregar cliente") : cur?.name ?? ""}</SheetTitle>
            <SheetDescription>{t("Name, company and contact details.", "Nombre, empresa y datos de contacto.")}</SheetDescription>
          </SheetHeader>
          {sel === "new" && <CustomerForm key="new" company={company} c={null} onSaved={async (id) => { await load(); setSel(id); }} />}
          {cur && <>
            <CustomerForm key={cur.id + cur.updated_at} company={company} c={cur} onSaved={() => load()} />
            <CustomerDetail company={company} c={cur} links={links} packets={packets} reload={load} />
          </>}
        </SheetContent>
      </Sheet>
    </section>
  );
}

export function LeadsPage() {
  const { t } = useLang();
  return (
    <Gate title={t("Leads", "Prospectos")} intro={t("Prospects your office is working. Move a lead along by hand, then turn it into a customer when it is won. Nothing is emailed.", "Prospectos que trabaja su oficina. Avance cada uno a mano y conviértalo en cliente al ganarlo. No se envía ningún correo.")}>
      {(company) => <Leads company={company} />}
    </Gate>
  );
}

function Leads({ company }: { company: string }) {
  const { t, lang } = useLang();
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [custs, setCusts] = useState<{ id: string; name: string; company_name: string | null }[]>([]);
  const [sel, setSel] = useState<string | "new" | null>(null);
  const [stageF, setStageF] = useState("all");
  const [err, setErr] = useState(false);
  const load = useCallback(async () => {
    const [a, b] = await Promise.all([
      backend.from("leads").select("id, name, company_name, contact, stage, next_action, next_action_date, customer_id, converted_by, converted_at, updated_by, updated_at").eq("company_id", company).order("updated_at", { ascending: false }),
      backend.from("customers").select("id, name, company_name").eq("company_id", company).order("name"),
    ]);
    if (a.error || b.error) { setErr(true); return; }
    setLeads(a.data as Lead[]); setCusts(b.data as typeof custs);
  }, [company]);
  useEffect(() => { void load(); }, [load]);
  const stageName = (k: string) => { const s = LEAD_STAGES.find((x) => x[0] === k) ?? LEAD_STAGES[0]; return t(s[1], s[2]); };
  const shown = (leads ?? []).filter((l) => stageF === "all" || l.stage === stageF);
  const cur = leads?.find((l) => l.id === sel) ?? null;
  return (
    <section className="oh-queue crm" aria-label={t("Leads", "Prospectos")} data-testid="leads">
      <div className="crm-head">
        <div className="jb-chips" role="group" aria-label={t("Lead stage", "Etapa del prospecto")}>
          {[["all", "All", "Todos"], ...LEAD_STAGES].map(([k, en, es]) => <button key={k} type="button" className="jb-chip" aria-pressed={stageF === k} onClick={() => setStageF(k)} data-testid={`ld-filter-${k}`}>{t(en, es)}</button>)}
        </div>
        <Button type="button" className="crm-track-btn" onClick={() => setSel("new")} data-testid="ld-new"><Plus size={18} aria-hidden />{t("Add lead", "Agregar prospecto")}</Button>
      </div>
      {err ? <p className="ap-muted" role="alert">{t("Could not load leads.", "No se pudieron cargar los prospectos.")}</p>
        : leads === null ? <p className="ap-muted" role="status">{t("Loading…", "Cargando…")}</p>
        : shown.length === 0 ? <div className="jb-empty" data-testid="ld-empty"><p>{t("No leads here yet.", "Aún no hay prospectos aquí.")}</p></div>
        : (
          <ul className="oh-rows" data-testid="ld-list">
            {shown.map((l) => (
              <li key={l.id} className="oh-row" data-testid="ld-row">
                <div className="oh-row-main">
                  <div className="jb-top"><span className="jb-addr">{l.name}</span><span className="oh-stage" data-testid="ld-stage">{stageName(l.stage)}</span></div>
                  <span className="ap-muted">{[l.company_name, l.contact].filter(Boolean).join(" · ") || "—"}</span>
                  <p className="oh-next"><strong>{l.next_action || t("No next action set", "Sin próxima acción")}</strong>{l.next_action_date && <span>{new Date(l.next_action_date + "T00:00:00").toLocaleDateString(lang === "es" ? "es" : "en-US", { dateStyle: "medium" })}</span>}</p>
                  {l.customer_id && <span className="ap-muted" data-testid="ld-converted">{t("Customer: ", "Cliente: ")}{custs.find((c) => c.id === l.customer_id)?.name ?? "—"}</span>}
                </div>
                <div className="oh-row-actions"><Button type="button" variant="outline" className="oh-more" onClick={() => setSel(l.id)} data-testid="ld-edit">{t("Open lead", "Abrir prospecto")}</Button></div>
              </li>
            ))}
          </ul>
        )}
      <Sheet open={sel !== null} onOpenChange={(o) => !o && setSel(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto p-4">
          <SheetHeader>
            <SheetTitle>{sel === "new" ? t("Add lead", "Agregar prospecto") : cur?.name ?? ""}</SheetTitle>
            <SheetDescription>{t("Stage and next action are saved for your whole office.", "La etapa y la próxima acción se guardan para toda su oficina.")}</SheetDescription>
          </SheetHeader>
          {sel === "new" && <LeadForm key="new" company={company} l={null} custs={custs} onSaved={async () => { await load(); setSel(null); }} />}
          {cur && <LeadForm key={cur.id + cur.updated_at} company={company} l={cur} custs={custs} onSaved={async () => { await load(); }} />}
        </SheetContent>
      </Sheet>
    </section>
  );
}

function LeadForm({ company, l, custs, onSaved }: { company: string; l: Lead | null; custs: { id: string; name: string; company_name: string | null }[]; onSaved: () => Promise<void> }) {
  const { t } = useLang();
  const [f, setF] = useState({ name: l?.name ?? "", company_name: l?.company_name ?? "", contact: l?.contact ?? "", stage: l?.stage ?? "new", next_action: l?.next_action ?? "", next_action_date: l?.next_action_date ?? "" });
  const [existing, setExisting] = useState("none");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  const save = async () => {
    if (!f.name.trim()) { setMsg(t("Enter a name.", "Escriba un nombre.")); return; }
    setBusy(true); setMsg(null);
    const vals = { name: f.name.trim(), company_name: nm(f.company_name), contact: nm(f.contact), stage: f.stage, next_action: nm(f.next_action), next_action_date: f.next_action_date || null };
    const r = l ? await backend.from("leads").update(vals).eq("id", l.id).select("id").maybeSingle() : await backend.from("leads").insert({ company_id: company, ...vals }).select("id").maybeSingle();
    setBusy(false);
    if (r.error || !r.data) { setMsg(t("Not saved. Check your role and try again.", "No se guardó. Revise su rol e intente de nuevo.")); return; }
    setMsg(t("Saved.", "Guardado.")); await onSaved();
  };
  const convert = async () => {
    if (!l) return;
    setBusy(true); setMsg(null);
    const { error } = await backend.rpc("convert_lead", { p_lead: l.id, p_customer: existing === "none" ? null : existing });
    setBusy(false);
    if (error) { setMsg(t("Not converted.", "No se convirtió.")); return; }
    await onSaved();
  };
  return (
    <div className="oh-form" data-testid="lead-form">
      <div className="ap-field"><label htmlFor="ld-name">{t("Name", "Nombre")}</label><Input id="ld-name" value={f.name} maxLength={120} onChange={set("name")} data-testid="ld-name" /></div>
      <div className="oh-form-grid">
        <div className="ap-field"><label htmlFor="ld-co">{t("Company", "Empresa")}</label><Input id="ld-co" value={f.company_name} maxLength={120} onChange={set("company_name")} data-testid="ld-company" /></div>
        <div className="ap-field"><label htmlFor="ld-ct">{t("Contact (phone or email)", "Contacto (teléfono o correo)")}</label><Input id="ld-ct" value={f.contact} maxLength={200} onChange={set("contact")} data-testid="ld-contact" /></div>
      </div>
      <div className="oh-form-grid">
        <div className="ap-field">
          <label htmlFor="ld-st">{t("Stage", "Etapa")}</label>
          <Select value={f.stage} onValueChange={(v) => setF({ ...f, stage: v })}>
            <SelectTrigger id="ld-st" className="oh-select" data-testid="ld-stage-select"><SelectValue /></SelectTrigger>
            <SelectContent>{LEAD_STAGES.map(([k, en, es]) => <SelectItem key={k} value={k}>{t(en, es)}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="ap-field"><label htmlFor="ld-nd">{t("Next action date", "Fecha de próxima acción")}</label><Input id="ld-nd" type="date" value={f.next_action_date} onChange={set("next_action_date")} data-testid="ld-date" /></div>
      </div>
      <div className="ap-field"><label htmlFor="ld-na">{t("Next action", "Próxima acción")}</label><Input id="ld-na" value={f.next_action} maxLength={300} onChange={set("next_action")} data-testid="ld-next" /></div>
      <div className="oh-save">
        <Button type="button" onClick={save} disabled={busy} data-testid="ld-save">{l ? t("Save lead", "Guardar prospecto") : t("Add lead", "Agregar prospecto")}</Button>
        {msg && <span role="status" className="ap-muted">{msg}</span>}
      </div>
      {l && <Stamp by={l.updated_by} at={l.updated_at} />}
      {l && (l.customer_id ? (
        <p className="ap-muted" data-testid="ld-done">{t("Converted to customer", "Convertido en cliente")} {custs.find((c) => c.id === l.customer_id)?.name ?? ""} · {l.converted_by || "—"}</p>
      ) : (
        <div className="oh-details" data-testid="ld-convert">
          <h3 className="crm-h3">{t("Convert to customer", "Convertir en cliente")}</h3>
          <p className="crm-note">{t("Choose an existing customer to attach this lead to, or leave it to create a new customer from the lead's details. Nothing is merged or sent.", "Elija un cliente existente para asociar este prospecto, o déjelo para crear un cliente nuevo con sus datos. No se fusiona ni se envía nada.")}</p>
          <div className="ap-field">
            <label htmlFor="ld-ex">{t("Customer", "Cliente")}</label>
            <Select value={existing} onValueChange={setExisting}>
              <SelectTrigger id="ld-ex" className="oh-select" data-testid="ld-existing"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t("Create a new customer", "Crear un cliente nuevo")}</SelectItem>
                {custs.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}{c.company_name ? ` · ${c.company_name}` : ""}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="oh-save"><Button type="button" variant="outline" onClick={convert} disabled={busy} data-testid="ld-convert-btn">{t("Convert lead", "Convertir prospecto")}</Button></div>
        </div>
      ))}
    </div>
  );
}
