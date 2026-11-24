import { Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { backend } from "../lib/backend";
import { useLang } from "../lib/lang";
import { equipFields } from "../lib/capture-fields";
import { DOC_CATEGORIES, DOC_TYPES, INSPECTION_STATUSES, MAX_UPLOAD, addEquipmentNote, documentLink, recordInspection, updateInspection, uploadDocument } from "../lib/records";
import { AppPage } from "./app-shell";
import { useMe } from "./dispatch";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

type Fields = { values?: Record<string, string>; formDefaults?: Record<string, string> } | null;
export type Pk = { id: string; job_id: string; tracking_no: string; sent_by_name: string; sent_at: string; captured_fields: Fields };
const vals = (p: Pk): Record<string, string> => ({ ...(p.captured_fields?.formDefaults ?? {}), ...(p.captured_fields?.values ?? {}) });
const siteOf = (p: Pk) => { const v = vals(p); return [v.addr, v.city].filter(Boolean).join(", "); };
const jobLabel = (p: Pk, jobWord: string) => `${p.tracking_no} · ${siteOf(p) || `${jobWord} ${p.job_id}`}`;
const pad = (n: number) => String(n).padStart(2, "0");
const dIn = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const tIn = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

function useFmt() {
  const { lang } = useLang();
  const loc = lang === "es" ? "es" : "en-US";
  return (iso: string) => new Date(iso).toLocaleString(loc, { dateStyle: "medium", timeStyle: "short" });
}

async function token() { const { data } = await backend.auth.getSession(); return data.session?.access_token ?? ""; }

/** The company's own packets, read under row level security. */
function usePackets(company: string) {
  const [rows, setRows] = useState<Pk[] | null>(null);
  const [err, setErr] = useState(false);
  useEffect(() => {
    let live = true;
    backend.from("office_packets").select("id, job_id, tracking_no, sent_by_name, sent_at, captured_fields").eq("company_id", company).order("sent_at", { ascending: false }).limit(500)
      .then(({ data, error }) => { if (!live) return; if (error) setErr(true); else setRows(data as Pk[]); }, () => { if (live) setErr(true); });
    return () => { live = false; };
  }, [company]);
  return { rows, err };
}

function Frame({ title, intro, children }: { title: string; intro: string; children: (company: string) => React.ReactNode }) {
  const { t } = useLang();
  const me = useMe();
  const ok = me.state === "ok" && (me.role === "admin" || me.role === "office");
  return (
    <AppPage bottom wide>
      <header className="jb-head">
        <div className="jb-title"><h1>{title}</h1></div>
        <p className="ap-muted">{intro}</p>
      </header>
      {me.state === "loading" ? <p className="ap-muted" role="status">{t("Loading…", "Cargando…")}</p>
        : !ok ? <p className="ap-muted" data-testid="rec-denied">{t("Only office reviewers and admins of your company can open this page. ", "Solo los revisores de oficina y administradores de su empresa pueden abrir esta página. ")}<Link to="/office-setup" className="underline font-semibold">{t("Office setup", "Configuración de oficina")}</Link></p>
        : children(me.state === "ok" ? me.company : "")}
    </AppPage>
  );
}

function JobSelect({ id, value, onChange, packets, none }: { id: string; value: string; onChange: (v: string) => void; packets: Pk[]; none?: string }) {
  const { t } = useLang();
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger id={id} className="oh-select" data-testid={id}><SelectValue placeholder={t("Choose a job", "Elija un trabajo")} /></SelectTrigger>
      <SelectContent>
        {none && <SelectItem value="none">{none}</SelectItem>}
        {packets.map((p) => <SelectItem key={p.id} value={p.id}>{jobLabel(p, t("Job", "Trabajo"))}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}

/* ───────────── Documents ───────────── */
type Doc = { id: string; packet_id: string | null; title: string; category: string; notes: string | null; file_name: string; mime: string; size_bytes: number; origin: string; uploaded_by: string; created_at: string };
const CAT: Record<string, [string, string]> = { permit: ["Permit", "Permiso"], plans: ["Plans", "Planos"], invoice: ["Invoice", "Factura"], warranty: ["Warranty", "Garantía"], correspondence: ["Correspondence", "Correspondencia"], other: ["Other", "Otro"] };
const kb = (n: number) => n >= 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`;

function toBase64(buf: ArrayBuffer) {
  let s = ""; const b = new Uint8Array(buf);
  for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode(...b.subarray(i, i + 0x8000));
  return btoa(s);
}

function DocumentsBody({ company }: { company: string }) {
  const { t } = useLang();
  const fmt = useFmt();
  const { rows: packets, err: perr } = usePackets(company);
  const [docs, setDocs] = useState<Doc[] | null>(null);
  const [err, setErr] = useState(false);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [title, setTitle] = useState(""); const [category, setCategory] = useState("permit"); const [job, setJob] = useState("none"); const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null); const [fileKey, setFileKey] = useState(0);
  const [msg, setMsg] = useState<string | null>(null); const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    const { data, error } = await backend.from("company_documents").select("id, packet_id, title, category, notes, file_name, mime, size_bytes, origin, uploaded_by, created_at").eq("company_id", company).order("created_at", { ascending: false }).limit(500);
    if (error) setErr(true); else { setErr(false); setDocs(data as Doc[]); }
  }, [company]);
  useEffect(() => { void load(); }, [load]);
  const byId = useMemo(() => new Map((packets ?? []).map((p) => [p.id, p])), [packets]);

  const upload = async () => {
    setMsg(null);
    if (!title.trim()) { setMsg(t("Enter a title.", "Escriba un título.")); return; }
    if (!file) { setMsg(t("Choose a file.", "Elija un archivo.")); return; }
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!DOC_TYPES[ext]) { setMsg(t("That file type is not allowed. Use PDF, JPG, PNG, WebP, TXT, DOCX or XLSX.", "Ese tipo de archivo no está permitido. Use PDF, JPG, PNG, WebP, TXT, DOCX o XLSX.")); return; }
    if (file.size === 0 || file.size > MAX_UPLOAD) { setMsg(t("The file must be between 1 byte and 5 MB.", "El archivo debe pesar entre 1 byte y 5 MB.")); return; }
    setBusy(true);
    try {
      const r = await uploadDocument({ data: { token: await token(), packetId: job === "none" ? null : job, title, category, notes, fileName: file.name, mime: DOC_TYPES[ext], base64: toBase64(await file.arrayBuffer()) } });
      if (!r.ok) setMsg(r.reason === "type" ? t("The file's contents do not match its type.", "El contenido del archivo no coincide con su tipo.") : t("Not saved. Check your role and the job.", "No se guardó. Revise su rol y el trabajo."));
      else { setTitle(""); setNotes(""); setFile(null); setFileKey((k) => k + 1); setMsg(t("Uploaded.", "Archivo subido.")); await load(); }
    } catch { setMsg(t("Not saved. Try again.", "No se guardó. Intente de nuevo.")); }
    setBusy(false);
  };
  const open = async (id: string) => {
    setMsg(null);
    try {
      const r = await documentLink({ data: { token: await token(), id } });
      if (r.ok) window.open(r.url, "_blank", "noopener"); else setMsg(t("Could not open the file.", "No se pudo abrir el archivo."));
    } catch { setMsg(t("Could not open the file.", "No se pudo abrir el archivo.")); }
  };
  const shown = (docs ?? []).filter((d) => {
    if (cat !== "all" && d.category !== cat) return false;
    const p = d.packet_id ? byId.get(d.packet_id) : null;
    const hay = [d.title, d.file_name, d.notes, d.uploaded_by, p?.tracking_no, p && siteOf(p), p && vals(p).name].filter(Boolean).join(" ").toLowerCase();
    return hay.includes(q.trim().toLowerCase());
  });
  if (err || perr) return <p className="ap-muted" role="alert">{t("Could not load documents.", "No se pudieron cargar los documentos.")}</p>;
  return (
    <div className="oh-queue crm" data-testid="documents">
      <section className="crm-panel" aria-labelledby="dc-up-h">
        <h2 id="dc-up-h" className="crm-h3">{t("Upload a document", "Subir un documento")}</h2>
        <p className="ap-muted">{t("Office uploads are stored privately and kept apart from the photos and fields technicians captured in the field, which stay in the job packet untouched.", "Los archivos de oficina se guardan de forma privada y aparte de las fotos y campos capturados en campo, que permanecen intactos en el paquete del trabajo.")}</p>
        <div className="oh-form" data-testid="doc-form">
          <div className="ap-field"><label htmlFor="dc-title">{t("Title", "Título")}</label><Input id="dc-title" value={title} maxLength={160} onChange={(e) => setTitle(e.target.value)} data-testid="dc-title" /></div>
          <div className="oh-form-grid">
            <div className="ap-field"><label htmlFor="dc-cat">{t("Category", "Categoría")}</label>
              <Select value={category} onValueChange={setCategory}><SelectTrigger id="dc-cat" className="oh-select"><SelectValue /></SelectTrigger>
                <SelectContent>{DOC_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{t(...CAT[c])}</SelectItem>)}</SelectContent></Select></div>
            <div className="ap-field"><label htmlFor="dc-job">{t("Linked job packet", "Paquete de trabajo vinculado")}</label>
              <JobSelect id="dc-job" value={job} onChange={setJob} packets={packets ?? []} none={t("Not linked to a job", "Sin vincular a un trabajo")} /></div>
          </div>
          <div className="ap-field"><label htmlFor="dc-file">{t("File (PDF, JPG, PNG, WebP, TXT, DOCX or XLSX, up to 5 MB)", "Archivo (PDF, JPG, PNG, WebP, TXT, DOCX o XLSX, hasta 5 MB)")}</label>
            <Input key={fileKey} id="dc-file" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,.txt,.docx,.xlsx" onChange={(e) => setFile(e.target.files?.[0] ?? null)} data-testid="dc-file" /></div>
          <div className="ap-field"><label htmlFor="dc-notes">{t("Note", "Nota")}</label><Textarea id="dc-notes" value={notes} maxLength={1000} onChange={(e) => setNotes(e.target.value)} /></div>
          <div className="oh-save"><Button type="button" onClick={upload} disabled={busy} data-testid="dc-upload">{t("Upload document", "Subir documento")}</Button>{msg && <span role="status" className="ap-muted" data-testid="dc-msg">{msg}</span>}</div>
        </div>
      </section>
      <section className="crm-panel" aria-labelledby="dc-list-h">
        <h2 id="dc-list-h" className="crm-h3">{t("Company documents", "Documentos de la empresa")}</h2>
        <div className="oh-filters crm-filters">
          <div className="ap-field"><label htmlFor="dc-q">{t("Search title, file, job, customer or site", "Buscar título, archivo, trabajo, cliente o sitio")}</label><Input id="dc-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" data-testid="dc-search" /></div>
          <div className="ap-field"><label htmlFor="dc-fc">{t("Category", "Categoría")}</label>
            <Select value={cat} onValueChange={setCat}><SelectTrigger id="dc-fc" className="oh-select"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">{t("All categories", "Todas las categorías")}</SelectItem>{DOC_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{t(...CAT[c])}</SelectItem>)}</SelectContent></Select></div>
        </div>
        {docs === null ? <p className="crm-note" role="status">{t("Loading…", "Cargando…")}</p>
          : shown.length === 0 ? <p className="crm-note" data-testid="dc-empty">{docs.length === 0 ? t("No documents yet. Upload the first one above.", "Aún no hay documentos. Suba el primero arriba.") : t("No documents match.", "Ningún documento coincide.")}</p>
          : <ul className="oh-rows">{shown.map((d) => {
            const p = d.packet_id ? byId.get(d.packet_id) : null;
            return (
              <li key={d.id} className="oh-row" data-testid="dc-item">
                <div className="oh-row-main">
                  <span className="jb-addr">{d.title}</span>
                  <span className="ap-muted">{t(...CAT[d.category])} · {d.file_name} · {kb(d.size_bytes)}</span>
                  <span className="ap-muted">{t("Uploaded by office", "Subido por la oficina")}: {d.uploaded_by} · {fmt(d.created_at)}</span>
                  {p && <span className="ap-muted">{t("Job packet", "Paquete")}: <Link to="/office-review/$id" params={{ id: p.id }} className="underline font-semibold">{jobLabel(p, t("Job", "Trabajo"))}</Link></span>}
                  {d.notes && <span className="ap-muted">{d.notes}</span>}
                </div>
                <div className="oh-row-actions"><Button type="button" variant="outline" className="oh-more" onClick={() => open(d.id)} data-testid="dc-open">{t("Open / download", "Abrir / descargar")}</Button></div>
              </li>);
          })}</ul>}
      </section>
    </div>
  );
}

export function DocumentsPage() {
  const { t } = useLang();
  return <Frame title={t("Documents", "Documentos")} intro={t("Permit paperwork, plans and other files your office keeps, linked to your job packets.", "Documentos de permisos, planos y otros archivos de su oficina, vinculados a sus paquetes de trabajo.")}>{(c) => <DocumentsBody company={c} />}</Frame>;
}

/* ───────────── Equipment ───────────── */
type Note = { id: string; packet_id: string; unit_label: string; note: string; created_by: string; created_at: string };
type Unit = { key: string; label: string; enLabel: string; maker: string; model: string; serial: string };

function unitsOf(p: Pk, lang: "en" | "es"): Unit[] {
  const v = vals(p);
  const fields = equipFields(v.type ?? "");
  const idx = lang === "es" ? 1 : 0;
  const groups = new Map<string, Unit>();
  for (const f of fields) {
    const m = /^(.*?)(maker|model|serial)$/.exec(f.key);
    if (!m) continue;
    const g = groups.get(m[1]) ?? { key: m[1] || "main", enLabel: f.label[0].replace(/ (manufacturer|model number|serial number)$/i, ""), label: f.label[idx].replace(/ (manufacturer|model number|serial number)$/i, "").replace(/^(Fabricante|Modelo|Serie):? ?/, ""), maker: "", model: "", serial: "" };
    g[m[2] === "maker" ? "maker" : m[2] === "model" ? "model" : "serial"] = (v[f.key] ?? "").trim();
    groups.set(m[1], g);
  }
  return [...groups.values()].filter((u) => u.maker || u.model || u.serial);
}

function NoteForm({ packetId, unit, onDone }: { packetId: string; unit: string; onDone: () => Promise<void> }) {
  const { t } = useLang();
  const [text, setText] = useState(""); const [msg, setMsg] = useState<string | null>(null); const [busy, setBusy] = useState(false);
  const save = async () => {
    if (!text.trim()) { setMsg(t("Write a note.", "Escriba una nota.")); return; }
    setBusy(true); setMsg(null);
    try {
      const r = await addEquipmentNote({ data: { token: await token(), packetId, unit, note: text } });
      if (!r.ok) setMsg(t("Not saved. Check your role.", "No se guardó. Revise su rol.")); else { setText(""); await onDone(); }
    } catch { setMsg(t("Not saved. Try again.", "No se guardó. Intente de nuevo.")); }
    setBusy(false);
  };
  return (
    <div className="oh-form">
      <div className="ap-field"><label>{t("Office note (kept separate from the captured evidence)", "Nota de oficina (separada de la evidencia capturada)")}<Textarea value={text} maxLength={1000} onChange={(e) => setText(e.target.value)} data-testid="eq-note" /></label></div>
      <div className="oh-save"><Button type="button" variant="outline" onClick={save} disabled={busy} data-testid="eq-save">{t("Add note", "Agregar nota")}</Button>{msg && <span role="status" className="ap-muted">{msg}</span>}</div>
    </div>
  );
}

function EquipmentBody({ company }: { company: string }) {
  const { t, lang } = useLang();
  const fmt = useFmt();
  const { rows: packets, err } = usePackets(company);
  const [notes, setNotes] = useState<Note[]>([]);
  const [q, setQ] = useState("");
  const [openKey, setOpenKey] = useState<string | null>(null);
  const loadNotes = useCallback(async () => {
    const { data } = await backend.from("equipment_notes").select("id, packet_id, unit_label, note, created_by, created_at").eq("company_id", company).order("created_at", { ascending: false }).limit(1000);
    setNotes((data as Note[] | null) ?? []);
  }, [company]);
  useEffect(() => { void loadNotes(); }, [loadNotes]);
  const items = useMemo(() => (packets ?? []).flatMap((p) => unitsOf(p, lang).map((u) => ({ p, u, k: `${p.id}:${u.key}` }))), [packets, lang]);
  const shown = items.filter(({ p, u }) => {
    const nn = notes.filter((n) => n.packet_id === p.id).map((n) => n.note).join(" ");
    return [u.maker, u.model, u.serial, u.label, p.tracking_no, siteOf(p), vals(p).name, nn].filter(Boolean).join(" ").toLowerCase().includes(q.trim().toLowerCase());
  });
  if (err) return <p className="ap-muted" role="alert">{t("Could not load equipment.", "No se pudo cargar el equipo.")}</p>;
  return (
    <div className="oh-queue crm" data-testid="equipment">
      <section className="crm-panel" aria-labelledby="eq-h">
        <h2 id="eq-h" className="crm-h3">{t("Equipment captured in the field", "Equipo capturado en campo")}</h2>
        <p className="ap-muted">{t("Manufacturer, model and serial numbers come from what technicians entered in each job packet. They are shown as captured and cannot be changed here; add an office note beside them instead.", "Fabricante, modelo y número de serie provienen de lo que los técnicos ingresaron en cada paquete. Se muestran tal como se capturaron y no se pueden cambiar aquí; agregue una nota de oficina junto a ellos.")}</p>
        <div className="ap-field"><label htmlFor="eq-q">{t("Search model, serial, manufacturer, job or customer", "Buscar modelo, serie, fabricante, trabajo o cliente")}</label><Input id="eq-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" data-testid="eq-search" /></div>
        {packets === null ? <p className="crm-note" role="status">{t("Loading…", "Cargando…")}</p>
          : shown.length === 0 ? <p className="crm-note" data-testid="eq-empty">{items.length === 0 ? t("No equipment has been captured in your job packets yet.", "Aún no se ha capturado equipo en sus paquetes de trabajo.") : t("No equipment matches.", "Ningún equipo coincide.")}</p>
          : <ul className="oh-rows">{shown.map(({ p, u, k }) => {
            const mine = notes.filter((n) => n.packet_id === p.id && n.unit_label === u.enLabel);
            return (
              <li key={k} className="oh-row" data-testid="eq-item">
                <div className="oh-row-main">
                  <span className="jb-addr">{u.label}</span>
                  <span className="ap-muted">{t("Manufacturer", "Fabricante")}: {u.maker || "—"} · {t("Model", "Modelo")}: {u.model || "—"} · {t("Serial", "Serie")}: {u.serial || "—"}</span>
                  <span className="ap-muted">{t("Captured in the field by", "Capturado en campo por")} {p.sent_by_name} · {fmt(p.sent_at)} · <Link to="/office-review/$id" params={{ id: p.id }} className="underline font-semibold">{jobLabel(p, t("Job", "Trabajo"))}</Link></span>
                  {mine.map((n) => <span key={n.id} className="ap-muted" data-testid="eq-office-note">{t("Office note", "Nota de oficina")} ({n.created_by}, {fmt(n.created_at)}): {n.note}</span>)}
                </div>
                <div className="oh-row-actions"><Button type="button" variant="outline" className="oh-more" onClick={() => setOpenKey(openKey === k ? null : k)} aria-expanded={openKey === k}>{t("Add office note", "Agregar nota de oficina")}</Button></div>
                {openKey === k && <NoteForm packetId={p.id} unit={u.enLabel} onDone={async () => { await loadNotes(); setOpenKey(null); }} />}
              </li>);
          })}</ul>}
      </section>
    </div>
  );
}

export function EquipmentPage() {
  const { t } = useLang();
  return <Frame title={t("Equipment", "Equipo")} intro={t("Search the model and serial numbers captured in your job packets.", "Busque los modelos y números de serie capturados en sus paquetes de trabajo.")}>{(c) => <EquipmentBody company={c} />}</Frame>;
}

/* ───────────── Inspections ───────────── */
export type Insp = { id: string; packet_id: string; tracking_no: string; kind: string; scheduled_at: string; status: string; notes: string | null; created_by: string; updated_by: string; updated_at: string };
type Aud = { id: string; inspection_id: string; action: string; actor: string; from_at: string | null; to_at: string | null; from_status: string | null; to_status: string | null; at: string };
const ST: Record<string, [string, string]> = { scheduled: ["Scheduled", "Programada"], passed: ["Passed", "Aprobada"], failed: ["Failed", "Reprobada"], cancelled: ["Cancelled", "Cancelada"] };
const AC: Record<string, [string, string]> = { recorded: ["Recorded", "Registrada"], rescheduled: ["Rescheduled", "Reprogramada"], outcome: ["Outcome set", "Resultado registrado"], edited: ["Notes edited", "Notas editadas"] };

function InspRow({ i, label, onDone }: { i: Insp; label: string; onDone: () => Promise<void> }) {
  const { t } = useLang();
  const fmt = useFmt();
  const d0 = new Date(i.scheduled_at);
  const [edit, setEdit] = useState(false);
  const [date, setDate] = useState(dIn(d0)); const [time, setTime] = useState(tIn(d0)); const [status, setStatus] = useState(i.status); const [notes, setNotes] = useState(i.notes ?? "");
  const [msg, setMsg] = useState<string | null>(null); const [busy, setBusy] = useState(false);
  const save = async () => {
    const at = new Date(`${date}T${time}`);
    if (isNaN(+at)) { setMsg(t("Choose a valid date and time.", "Elija una fecha y hora válidas.")); return; }
    setBusy(true); setMsg(null);
    try {
      const r = await updateInspection({ data: { token: await token(), id: i.id, at: at.toISOString(), status, notes } });
      if (!r.ok) setMsg(t("Not saved. Check your role.", "No se guardó. Revise su rol.")); else { setEdit(false); await onDone(); }
    } catch { setMsg(t("Not saved. Try again.", "No se guardó. Intente de nuevo.")); }
    setBusy(false);
  };
  return (
    <li className={`oh-row${i.status === "scheduled" ? " today" : i.status === "passed" ? " closed" : i.status === "failed" ? " overdue" : ""}`} data-testid="in-item">
      <div className="oh-row-main">
        <span className="jb-addr">{i.kind} · {fmt(i.scheduled_at)}</span>
        <span className="ap-muted" data-testid="in-status">{t(...ST[i.status])} · {label}</span>
        {i.notes && <span className="ap-muted">{i.notes}</span>}
        <span className="ap-muted">{t("Last changed by", "Último cambio por")} {i.updated_by} · {fmt(i.updated_at)}</span>
      </div>
      <div className="oh-row-actions"><Button type="button" variant="outline" className="oh-more" onClick={() => setEdit(!edit)} aria-expanded={edit} data-testid="in-edit">{t("Reschedule or set outcome", "Reprogramar o registrar resultado")}</Button></div>
      {edit && (
        <div className="oh-form">
          <div className="oh-form-grid">
            <div className="ap-field"><label htmlFor={`ie-d-${i.id}`}>{t("Date", "Fecha")}</label><Input id={`ie-d-${i.id}`} type="date" value={date} onChange={(e) => setDate(e.target.value)} data-testid="in-date" /></div>
            <div className="ap-field"><label htmlFor={`ie-t-${i.id}`}>{t("Time", "Hora")}</label><Input id={`ie-t-${i.id}`} type="time" value={time} onChange={(e) => setTime(e.target.value)} data-testid="in-time" /></div>
          </div>
          <div className="ap-field"><label htmlFor={`ie-s-${i.id}`}>{t("Outcome", "Resultado")}</label>
            <Select value={status} onValueChange={setStatus}><SelectTrigger id={`ie-s-${i.id}`} className="oh-select" data-testid="in-outcome"><SelectValue /></SelectTrigger>
              <SelectContent>{INSPECTION_STATUSES.map((s) => <SelectItem key={s} value={s}>{t(...ST[s])}</SelectItem>)}</SelectContent></Select></div>
          <div className="ap-field"><label htmlFor={`ie-n-${i.id}`}>{t("Note", "Nota")}</label><Textarea id={`ie-n-${i.id}`} value={notes} maxLength={1000} onChange={(e) => setNotes(e.target.value)} /></div>
          <div className="oh-save"><Button type="button" onClick={save} disabled={busy} data-testid="in-save">{t("Save changes", "Guardar cambios")}</Button>{msg && <span role="status" className="ap-muted">{msg}</span>}</div>
        </div>
      )}
    </li>
  );
}

function InspectionsBody({ company }: { company: string }) {
  const { t } = useLang();
  const fmt = useFmt();
  const { rows: packets, err: perr } = usePackets(company);
  const [list, setList] = useState<Insp[] | null>(null);
  const [audit, setAudit] = useState<Aud[]>([]);
  const [err, setErr] = useState(false);
  const [job, setJob] = useState(""); const [kind, setKind] = useState(""); const [date, setDate] = useState(""); const [time, setTime] = useState("09:00"); const [notes, setNotes] = useState("");
  const [msg, setMsg] = useState<string | null>(null); const [busy, setBusy] = useState(false); const [q, setQ] = useState("");
  const load = useCallback(async () => {
    const [a, b] = await Promise.all([
      backend.from("company_inspections").select("id, packet_id, tracking_no, kind, scheduled_at, status, notes, created_by, updated_by, updated_at").eq("company_id", company).order("scheduled_at").limit(500),
      backend.from("inspection_audit").select("id, inspection_id, action, actor, from_at, to_at, from_status, to_status, at").eq("company_id", company).order("at", { ascending: false }).limit(40),
    ]);
    if (a.error || b.error) setErr(true); else { setErr(false); setList(a.data as Insp[]); setAudit(b.data as Aud[]); }
  }, [company]);
  useEffect(() => { void load(); }, [load]);
  const byId = useMemo(() => new Map((packets ?? []).map((p) => [p.id, p])), [packets]);
  const labelOf = (i: Insp) => { const p = byId.get(i.packet_id); return p ? jobLabel(p, t("Job", "Trabajo")) : i.tracking_no; };
  const record = async () => {
    setMsg(null);
    const at = new Date(`${date}T${time}`);
    if (!job || !kind.trim() || !date || isNaN(+at)) { setMsg(t("Choose a job, enter the inspection type, date and time.", "Elija un trabajo e ingrese el tipo de inspección, la fecha y la hora.")); return; }
    setBusy(true);
    try {
      const r = await recordInspection({ data: { token: await token(), packetId: job, kind, at: at.toISOString(), notes } });
      if (!r.ok) setMsg(t("Not saved. Check your role and the job.", "No se guardó. Revise su rol y el trabajo.")); else { setKind(""); setNotes(""); setDate(""); setMsg(t("Recorded.", "Registrada.")); await load(); }
    } catch { setMsg(t("Not saved. Try again.", "No se guardó. Intente de nuevo.")); }
    setBusy(false);
  };
  const all = (list ?? []).filter((i) => [i.kind, i.tracking_no, labelOf(i), i.notes].filter(Boolean).join(" ").toLowerCase().includes(q.trim().toLowerCase()));
  const upcoming = all.filter((i) => i.status === "scheduled");
  const past = all.filter((i) => i.status !== "scheduled").reverse();
  if (err || perr) return <p className="ap-muted" role="alert">{t("Could not load inspections.", "No se pudieron cargar las inspecciones.")}</p>;
  return (
    <div className="oh-queue crm" data-testid="inspections">
      <p className="ap-muted">{t("These are inspections your company recorded by hand. They are not official city records and PermitDraft does not book them with any city.", "Estas son inspecciones que su empresa registró a mano. No son registros oficiales de la ciudad y PermitDraft no las agenda con ninguna ciudad.")}</p>
      <section className="crm-panel" aria-labelledby="in-new-h">
        <h2 id="in-new-h" className="crm-h3">{t("Record an inspection", "Registrar una inspección")}</h2>
        <div className="oh-form" data-testid="in-form">
          <div className="ap-field"><label htmlFor="in-job">{t("Job packet", "Paquete de trabajo")}</label><JobSelect id="in-job" value={job} onChange={setJob} packets={packets ?? []} /></div>
          <div className="ap-field"><label htmlFor="in-kind">{t("Inspection type (for example, final mechanical)", "Tipo de inspección (por ejemplo, mecánica final)")}</label><Input id="in-kind" value={kind} maxLength={120} onChange={(e) => setKind(e.target.value)} data-testid="in-kind" /></div>
          <div className="oh-form-grid">
            <div className="ap-field"><label htmlFor="in-date">{t("Date", "Fecha")}</label><Input id="in-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} data-testid="in-new-date" /></div>
            <div className="ap-field"><label htmlFor="in-time">{t("Time", "Hora")}</label><Input id="in-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} data-testid="in-new-time" /></div>
          </div>
          <div className="ap-field"><label htmlFor="in-notes">{t("Note", "Nota")}</label><Textarea id="in-notes" value={notes} maxLength={1000} onChange={(e) => setNotes(e.target.value)} /></div>
          <div className="oh-save"><Button type="button" onClick={record} disabled={busy} data-testid="in-record">{t("Record inspection", "Registrar inspección")}</Button>{msg && <span role="status" className="ap-muted" data-testid="in-msg">{msg}</span>}</div>
        </div>
      </section>
      <section className="crm-panel" aria-labelledby="in-up-h">
        <h2 id="in-up-h" className="crm-h3">{t("Upcoming (company-recorded)", "Próximas (registradas por la empresa)")}</h2>
        <div className="ap-field"><label htmlFor="in-q">{t("Search type, job or site", "Buscar tipo, trabajo o sitio")}</label><Input id="in-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" /></div>
        {list === null ? <p className="crm-note" role="status">{t("Loading…", "Cargando…")}</p>
          : upcoming.length === 0 ? <p className="crm-note" data-testid="in-empty">{t("No upcoming inspections recorded.", "No hay inspecciones próximas registradas.")}</p>
          : <ul className="oh-rows">{upcoming.map((i) => <InspRow key={i.id + i.updated_at} i={i} label={labelOf(i)} onDone={load} />)}</ul>}
      </section>
      <section className="crm-panel" aria-labelledby="in-past-h">
        <h2 id="in-past-h" className="crm-h3">{t("Completed and cancelled", "Completadas y canceladas")}</h2>
        {past.length === 0 ? <p className="crm-note">{t("None yet.", "Ninguna todavía.")}</p> : <ul className="oh-rows">{past.map((i) => <InspRow key={i.id + i.updated_at} i={i} label={labelOf(i)} onDone={load} />)}</ul>}
      </section>
      <section className="crm-panel" aria-labelledby="in-au-h">
        <h2 id="in-au-h" className="crm-h3">{t("Change history", "Historial de cambios")}</h2>
        {audit.length === 0 ? <p className="crm-note">{t("No changes recorded yet.", "Aún no hay cambios registrados.")}</p>
          : <ul className="oh-rows" data-testid="in-audit">{audit.map((a) => { const i = (list ?? []).find((x) => x.id === a.inspection_id); return (
            <li key={a.id} className="oh-row"><div className="oh-row-main"><span className="jb-addr">{t(...AC[a.action])}{i ? ` · ${i.kind}` : ""}</span>
              <span className="ap-muted">{a.actor} · {fmt(a.at)}{a.from_at && a.to_at && a.from_at !== a.to_at ? ` · ${fmt(a.from_at)} → ${fmt(a.to_at)}` : ""}{a.to_status && a.from_status !== a.to_status ? ` · ${a.from_status ? t(...ST[a.from_status]) + " → " : ""}${t(...ST[a.to_status])}` : ""}</span></div></li>); })}</ul>}
      </section>
    </div>
  );
}

export function InspectionsPage() {
  const { t } = useLang();
  return <Frame title={t("Inspections", "Inspecciones")} intro={t("Record, reschedule and update the outcome of inspections on your jobs.", "Registre, reprograme y actualice el resultado de las inspecciones de sus trabajos.")}>{(c) => <InspectionsBody company={c} />}</Frame>;
}
