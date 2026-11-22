import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppTop } from "../components/app-shell";
import { Image } from "../image";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import "../permit.css";
import { usePhotos } from "../lib/photos";
import { useInsp } from "../lib/inspection";
import { useLang } from "../lib/lang";
import { CopyRequest } from "../components/copy-request";
import { copyRequest } from "../lib/copy-requests";

const BUNDLE = "https://www.cityofsacramento.gov/community-development/building/building-forms/minor-permit-application-form-bundles";
const FORM_NOTE_ES: Record<string, string> = {
  "CDD-0200": "Dirección y alcance del proyecto. La dirección está en el encabezado del trabajo arriba; este borrador no tiene campo de dirección ni de alcance.",
  "CDD-0184": "El propietario firma si se usa cuando el inspector no ha obtenido acceso normal al interior. Este borrador no tiene campo de detectores de humo/CO.",
  "CDD-0035": "Reemplazo equivalente; propiedad no histórica según el paquete de la ciudad. Se relaciona con el campo de ubicación de la unidad exterior. El estado de la propiedad no se registra en este borrador, por lo que es una referencia condicional.",
  "CDD-0031": "Solo propiedades históricas. Se relaciona con el campo de ubicación de la unidad exterior. El estado de la propiedad no se registra en este borrador, por lo que es una referencia condicional; no se elige ninguno de los dos formularios.",
};
const FORMS = [
  { code: "CDD-0200", name: "Building Permit Application", url: "https://www.cityofsacramento.gov/content/dam/portal/cdd/Building/Forms/CDD-0200_Application-for-Building-Permit_Part-I.pdf", note: "Project address and scope. The address is in the job header above; this draft has no address or scope field." },
  { code: "CDD-0184", name: "Smoke/Carbon Monoxide Detector Installation Guidelines and Owner Certification of Compliance", url: "https://www.cityofsacramento.gov/content/dam/portal/cdd/Building/Forms/CDD-0184_Smoke-and-Carbon-Monoxide-Detector-Installation-Guidelines-Owner-Cert-of-Compliance.pdf", note: "Owner signs if used when the inspector has not obtained normal interior access. This draft has no smoke/CO field." },
  { code: "CDD-0035", name: "Planning Exemption Form - Express", url: "https://www.cityofsacramento.gov/content/dam/portal/cdd/Planning/planning-forms/CDD-0035_Planning-Exemption-Form-Express.pdf", note: "Like-for-like replacement; non-historic property per the city bundle. Relates to the Outdoor unit location field. Property status is not recorded in this draft, so this is a conditional reference." },
  { code: "CDD-0031", name: "HVAC/Electrical/Solar Equipment for Historic Properties", url: "https://www.cityofsacramento.gov/content/dam/portal/cdd/Planning/planning-forms/CDD-0031-Exemption-HVAC-Equipment-Historic-Properties.pdf", note: "Historic properties only. Relates to the Outdoor unit location field. Property status is not recorded in this draft, so this is a conditional reference; neither form is picked." },
];

export const Route = createFileRoute("/sample-job")({
  head: () => ({ meta: [{ title: "Heat-pump change-out permit draft" }, { name: "description", content: "Heat-pump change-out permit draft for Job #HP-1187 with every value traced to its source." }] }),
  component: Page,
});

type Field = {
  id: string;
  label: string;
  value: string;
  status: "Confirmed" | "NEEDED";
  source: string;
  evidence: string;
  conflict?: { value: string; source: string; note: string; origValue: string; origSource: string };
};

type Entry = {
  id: string;
  fieldId: string;
  action: "Flagged conflict" | "Confirmed value" | "Resolved conflict";
  priorValue: string;
  resultValue: string;
  proposedValue?: string;
  resultStatus: string;
  editor: string;
  at: string;
};

const EDITOR = "Practice reviewer (named practice role, not a verified identity)";

const EDITOR_ES = "Revisor de práctica (rol de práctica con nombre, no una identidad verificada)";
function fmt(iso: string, lang: "en" | "es" = "en") {
  return new Date(iso).toLocaleString(lang === "es" ? "es-US" : "en-US", { dateStyle: "medium", timeStyle: "medium" });
}

const SOURCES = ["Equipment photo", "Dictated note", "Meter reading", "Office entry"];

const initial: Field[] = [
  { id: "model", label: "Equipment model", value: "Carrier 25HPB536A003", status: "Confirmed", source: "Equipment photo", evidence: "Photo IMG_2041 (outdoor unit data plate), taken Nov 18, 2026 9:42 AM by Marcus Reyes. Label reads: “MODEL NO. 25HPB536A003”." },
  { id: "serial", label: "Serial number", value: "2819E04417", status: "Confirmed", source: "Equipment photo", evidence: "Photo IMG_2041 (outdoor unit data plate), taken Nov 18, 2026 9:42 AM by Marcus Reyes. Label reads: “SERIAL NO. 2819E04417”." },
  { id: "refrigerant", label: "Refrigerant type", value: "R-410A", status: "Confirmed", source: "Equipment photo", evidence: "Photo IMG_2042 (refrigerant line of the data plate), Nov 18, 2026 9:43 AM, Marcus Reyes. Label reads: “REFRIGERANT R-410A, FACTORY CHARGE 8 LB 4 OZ”." },
  { id: "location", label: "Outdoor unit location", value: "Left side yard, 36 in. from the property line", status: "Confirmed", source: "Dictated note", evidence: "Voice note 0:21, Nov 18, 2026 10:05 AM, Marcus Reyes: “New outdoor unit goes on the left side yard, same pad, about three feet off the fence.”" },
  { id: "panel", label: "Panel size", value: "", status: "NEEDED", source: "None yet", evidence: "No evidence on file. Ask the tech for a photo of the main panel label, or have the office enter the amperage." },
  { id: "duct", label: "Duct sealing answer", value: "", status: "NEEDED", source: "None yet", evidence: "No evidence on file. The tech has not dictated whether existing ducts were tested or sealed." },
  { id: "charge", label: "Refrigerant charge reading", value: "Subcooling 10.5°F, superheat 12°F", status: "Confirmed", source: "Meter reading", evidence: "Gauge reading logged Nov 18, 2026 1:17 PM by Marcus Reyes: subcooling 10.5°F, superheat 12°F, outdoor ambient 71°F." },
];

const ES_LABEL: Record<string, string> = { model: "Modelo del equipo", serial: "Número de serie", refrigerant: "Tipo de refrigerante", location: "Ubicación de la unidad exterior", panel: "Tamaño del panel", duct: "Respuesta de sellado de ductos", charge: "Lectura de carga de refrigerante" };
const ES_VALUE: Record<string, string> = { "Left side yard, 36 in. from the property line": "Patio lateral izquierdo, a 36 pulg. del límite de la propiedad", "Subcooling 10.5°F, superheat 12°F": "Subenfriamiento 10.5°F, sobrecalentamiento 12°F" };
const ES_SOURCE: Record<string, string> = { "Equipment photo": "Foto del equipo", "Dictated note": "Nota dictada", "Meter reading": "Lectura del medidor", "Office entry": "Entrada de la oficina", "None yet": "Ninguna todavía" };
const ES_EVIDENCE: Record<string, string> = {
  model: "Foto IMG_2041 (placa de datos de la unidad exterior), tomada el 18 nov 2026, 9:42 AM por Marcus Reyes. La etiqueta dice: “MODEL NO. 25HPB536A003”.",
  serial: "Foto IMG_2041 (placa de datos de la unidad exterior), tomada el 18 nov 2026, 9:42 AM por Marcus Reyes. La etiqueta dice: “SERIAL NO. 2819E04417”.",
  refrigerant: "Foto IMG_2042 (línea de refrigerante de la placa), 18 nov 2026, 9:43 AM, Marcus Reyes. La etiqueta dice: “REFRIGERANT R-410A, FACTORY CHARGE 8 LB 4 OZ”.",
  location: "Nota de voz 0:21, 18 nov 2026, 10:05 AM, Marcus Reyes: “New outdoor unit goes on the left side yard, same pad, about three feet off the fence.”",
  panel: "Sin evidencia. Pida al técnico una foto de la etiqueta del panel principal, o que la oficina ingrese el amperaje.",
  duct: "Sin evidencia. El técnico no ha dictado si los ductos existentes se probaron o sellaron.",
  charge: "Lectura del manómetro registrada el 18 nov 2026, 1:17 PM por Marcus Reyes: subenfriamiento 10.5°F, sobrecalentamiento 12°F, ambiente exterior 71°F.",
};

function Page() {
  const { t, lang } = useLang();
  const es = lang === "es";
  const fl = (f: { id: string; label: string }) => (es ? ES_LABEL[f.id] ?? f.label : f.label);
  const HA = (a: string) => (es ? ({ "Flagged conflict": "Conflicto marcado", "Confirmed value": "Valor confirmado", "Resolved conflict": "Conflicto resuelto" } as Record<string, string>)[a] ?? a : a);
  const HS = (a: string) => (es ? ({ Confirmed: "Confirmado", NEEDED: "NECESARIO", "NEEDED (blocks Ready)": "NECESARIO (impide Listo)" } as Record<string, string>)[a] ?? a : a);
  const fv = (v: string) => (es ? ES_VALUE[v] ?? v : v);
  const fs_ = (v: string) => (es ? ES_SOURCE[v] ?? v : v);
  const fe = (f: { id: string; evidence: string }) => (es && initial.find((i) => i.id === f.id)?.evidence === f.evidence ? ES_EVIDENCE[f.id] : f.evidence);
  const [fields, setFields] = useState<Field[]>(initial);
  const [selId, setSelId] = useState("model");
  const [value, setValue] = useState("");
  const [source, setSource] = useState(SOURCES[3]);
  const [note, setNote] = useState("");
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState("");
  const [flagOpen, setFlagOpen] = useState(false);
  const [cv, setCv] = useState("");
  const [cs, setCs] = useState(SOURCES[0]);
  const [cn, setCn] = useState("");
  const [cerr, setCerr] = useState("");
  const [history, setHistory] = useState<Entry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [pid, setPid] = useState("");
  const { photos } = usePhotos();
  const insp = useInsp();
  const isSac = insp.juris === "sacramento-city";

  useEffect(() => {
    try {
      let id = localStorage.getItem("pd-participant");
      if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem("pd-participant", id);
      }
      setPid(id);
      const raw = localStorage.getItem(`pd-hp1187:${id}`);
      if (raw) {
        const d = JSON.parse(raw);
        if (Array.isArray(d.fields)) setFields(d.fields);
        if (Array.isArray(d.history)) setHistory(d.history);
      }
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded || !pid) return;
    try {
      localStorage.setItem(`pd-hp1187:${pid}`, JSON.stringify({ fields, history }));
    } catch {}
  }, [fields, history, loaded, pid]);

  function log(e: Omit<Entry, "id" | "editor" | "at">) {
    const at = new Date().toISOString();
    setHistory((h) => [{ ...e, id: `${at}-${h.length}`, editor: EDITOR, at }, ...h]);
  }

  const [focusReq, setFocusReq] = useState(0);

  function hashToId(h: string) {
    if (h === "#panel-size") return "panel";
    if (h.startsWith("#field-")) return h.slice(7);
    return "";
  }

  function goTo(id: string) {
    pick(id);
    setFocusReq((n) => n + 1);
  }

  useEffect(() => {
    const apply = () => {
      const id = hashToId(window.location.hash);
      if (id) goTo(id);
    };
    apply();
    window.addEventListener("hashchange", apply);
    return () => window.removeEventListener("hashchange", apply);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!focusReq || !loaded) return;
    const t = setTimeout(() => {
      const el = document.getElementById("v") as HTMLInputElement | null;
      const target = el ?? document.getElementById("field-" + selId);
      target?.scrollIntoView({ block: "center" });
      (el ?? (document.querySelector(`#field-${selId} button`) as HTMLElement | null))?.focus({ preventScroll: true });
    }, 60);
    return () => clearTimeout(t);
  }, [focusReq, loaded, selId]);

  const sel = fields.find((f) => f.id === selId) ?? fields[0];
  const blockers = fields.filter((f) => f.status !== "Confirmed");
  const canReady = blockers.length === 0;

  function pick(id: string) {
    setSelId(id);
    setValue("");
    setNote("");
    setErr("");
    setFlagOpen(false);
    setCv("");
    setCn("");
    setCerr("");
  }

  function flag(e: React.FormEvent) {
    e.preventDefault();
    if (!cv.trim()) return setCerr("Enter the conflicting value.");
    if (!cs) return setCerr("Choose a source.");
    log({ fieldId: sel.id, action: "Flagged conflict", priorValue: sel.value, resultValue: sel.value, proposedValue: cv.trim(), resultStatus: "NEEDED (blocks Ready)" });
    setFields((fs) =>
      fs.map((f) =>
        f.id === sel.id
          ? { ...f, status: "NEEDED", conflict: { value: cv.trim(), source: cs, note: cn.trim(), origValue: f.value, origSource: f.source } }
          : f,
      ),
    );
    setReady(false);
    setFlagOpen(false);
    setCv("");
    setCn("");
    setCerr("");
  }

  function confirm(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim()) return setErr("Enter the value.");
    if (!source) return setErr("Choose a source.");
    log({ fieldId: sel.id, action: sel.conflict ? "Resolved conflict" : "Confirmed value", priorValue: sel.value, resultValue: value.trim(), proposedValue: sel.conflict?.value, resultStatus: "Confirmed" });
    const when = new Date().toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
    setFields((fs) =>
      fs.map((f) =>
        f.id === sel.id
          ? {
              ...f,
              value: value.trim(),
              status: "Confirmed",
              source,
              conflict: undefined,
              evidence: `${source} entered by the office reviewer, ${when}.${note.trim() ? ` Note: “${note.trim()}”` : ""}${f.conflict ? ` Resolved conflict. Original value: ${f.conflict.origValue} (${f.conflict.origSource}). Conflicting value: ${f.conflict.value} (${f.conflict.source}).${f.conflict.note ? ` Conflict note: “${f.conflict.note}”` : ""}` : ""}`,
            }
          : f,
      ),
    );
    setReady(false);
    setValue("");
    setNote("");
    setErr("");
  }


  return (
    <div className="pd">
      <AppTop />
      <header className="pd-top">
        <Image src="/generated-assets/company-logo.png" alt="PermitDraft logo" width={44} height={44} priority />
        <div>
          <p className="pd-brand">PermitDraft</p>
          <p className="pd-practice">{t("Practice job — not connected to real permit filing", "Trabajo de práctica: no conectado a la presentación real de permisos")}</p>
        </div>
      </header>

      <main className="pd-main">
        <section className="pd-head">
          <div>
            <h1>{t("Heat-pump change-out permit draft", "Borrador de permiso: cambio de bomba de calor")}</h1>
            <p className="pd-job">{t("Single-family home", "Casa unifamiliar")}, 4412 Alder Court, Sacramento · {t("Job", "Trabajo")} #HP-1187 · {t("Tech", "Técnico")}: Marcus Reyes</p>
          </div>
          <div className={`pd-status ${ready ? "ok" : "no"}`} role="status">
            <span>{t("Packet status", "Estado del paquete")}</span>
            <strong>{ready ? t("Ready for office review", "Listo para revisión de oficina") : t("Not ready", "No está listo")}</strong>
          </div>
        </section>

        <section className={`pd-block ${canReady ? "clear" : ""}`} aria-live="polite">
          <div>
            {canReady ? (
              <p><strong>{t("Nothing is blocking.", "Nada lo bloquea.")}</strong> {t("Every required field is Confirmed.", "Cada campo obligatorio está confirmado.")}</p>
            ) : (
              <p>
                <strong>{t(`Blocked by ${blockers.length} required ${blockers.length === 1 ? "field" : "fields"}:`, `Bloqueado por ${blockers.length} campo(s) obligatorio(s):`)}</strong>{" "}
                {blockers.map((b) => fl(b)).join(", ")}.
              </p>
            )}
          </div>
          <Button size="lg" className="pd-ready" disabled={!canReady || ready} onClick={() => setReady(true)}>
            {ready ? t("Marked ready for office review", "Marcado listo para revisión de oficina") : t("Mark ready for office review", "Marcar listo para revisión de oficina")}
          </Button>
        </section>

        <section className="pd-fu" aria-labelledby="fu" aria-live="polite" data-testid="followup">
          <h2 id="fu">{t("Office follow-up list", "Lista de seguimiento de la oficina")}: <span data-testid="followup-count">{blockers.length}</span> {t(blockers.length === 1 ? "item to confirm" : "items to confirm", "por confirmar")}</h2>
          {canReady ? (
            <p className="pd-fu-empty">{t("All clear. No office follow-up is needed.", "Todo claro. No se necesita seguimiento de la oficina.")}</p>
          ) : (
            <ul className="pd-fu-list">
              {blockers.map((b) => (
                <li key={b.id}>
                  <a
                    className="pd-fu-link"
                    href={`#field-${b.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      window.history.replaceState(null, "", `#field-${b.id}`);
                      goTo(b.id);
                    }}
                  >
                    <span>{fl(b)}{b.conflict ? t(" (conflict)", " (conflicto)") : ""}</span>
                    <span className="pd-fu-go">{t("Enter answer →", "Ingresar respuesta →")}</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="pd-grid">
          <section aria-labelledby="fl">
            <h2 id="fl">{t("Draft fields", "Campos del borrador")}</h2>
            <ul className="pd-list">
              {fields.map((f) => (
                <li key={f.id} id={`field-${f.id}`}>
                  {f.id === "panel" && <span id="panel-size" />}
                  <button type="button" className={`pd-row ${f.id === sel.id ? "on" : ""}`} aria-pressed={f.id === sel.id} onClick={() => pick(f.id)}>
                    <span className="pd-label">{fl(f)}</span>
                    <span className="pd-value">{fv(f.value) || "—"}</span>
                    <span className={`pd-badge ${f.status === "NEEDED" ? "needed" : "conf"}`}>{f.status === "NEEDED" ? t("NEEDED", "NECESARIO") : t("Confirmed", "Confirmado")}</span>
                    <span className="pd-src">{t("Source", "Fuente")}: {fs_(f.source)}</span>
                  </button>
                  {f.status === "NEEDED" && (
                    <div className="pd-copy">
                      <CopyRequest text={copyRequest(f.id, [f.label, ES_LABEL[f.id] ?? f.label], ["Job #HP-1187, heat-pump change-out", "Trabajo #HP-1187, cambio de bomba de calor"], !!f.conflict)} field={fl(f)} testId={`copy-${f.id}`} />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>

          <aside className="pd-side">
            <div className="pd-card">
              <h2>{t("Evidence", "Evidencia")}</h2>
              <p className="pd-ev-label">{fl(sel)}</p>
              <p className="pd-ev-value">{fv(sel.value) || t("No value yet", "Sin valor todavía")}</p>
              <p className="pd-ev-text">{fe(sel)}</p>
              <p className="pd-ev-src">{t("Source", "Fuente")}: {fs_(sel.source)}</p>
              {sel.source === "Equipment photo" && photos.plate && (
                <div className="ph-ev" data-testid="permit-plate">
                  <Image src={photos.plate.url} alt="Saved data plate photo" width={240} height={240} />
                  <p className="pd-ev-text">{t("Photo saved on this device · Waiting to upload. Shown for reference only; it does not confirm any value.", "Foto guardada en este dispositivo · Esperando para subir. Solo como referencia; no confirma ningún valor.")}</p>
                </div>
              )}
              {isSac && sel.id === "location" && (
                <p className="pd-ev-text" data-testid="loc-forms">{t("City of Sacramento forms that may relate (conditional on property status)", "Formularios de la Ciudad de Sacramento que pueden relacionarse (según el estado de la propiedad)")}: <a className="underline font-semibold" href={FORMS[2].url} target="_blank" rel="noopener noreferrer">Planning Exemption Form - Express – CDD-0035</a> or <a className="underline font-semibold" href={FORMS[3].url} target="_blank" rel="noopener noreferrer">HVAC/Electrical/Solar Equipment for Historic Properties – CDD-0031</a>.</p>
              )}
              {sel.conflict && (
                <div className="pd-conflict" role="alert">
                  <p className="pd-ev-label">{t("Conflict: resolve before Ready", "Conflicto: resuélvalo antes de marcar listo")}</p>
                  <p className="pd-ev-text">{t("Original value", "Valor original")}: <strong>{sel.conflict.origValue || t("No value yet", "Sin valor todavía")}</strong> ({t("Source", "Fuente")}: {fs_(sel.conflict.origSource)})</p>
                  <p className="pd-ev-text">{t("Conflicting value", "Valor en conflicto")}: <strong>{sel.conflict.value}</strong> ({t("Source", "Fuente")}: {fs_(sel.conflict.source)})</p>
                  {sel.conflict.note && <p className="pd-ev-text">Conflict note: “{sel.conflict.note}”</p>}
                </div>
              )}
              {!sel.conflict && sel.value && !flagOpen && (
                <Button type="button" variant="outline" size="sm" onClick={() => setFlagOpen(true)}>{t("Flag a conflict", "Marcar un conflicto")}</Button>
              )}
            </div>

            <div className="pd-card" aria-labelledby="hist">
              <h2 id="hist">{t("History", "Historial")}: {fl(sel)}</h2>
              <p className="pd-ev-src">{t("Newest first. Practice entries only, kept in this browser for this participant.", "Lo más reciente primero. Solo entradas de práctica, guardadas en este navegador.")}</p>
              {history.filter((h) => h.fieldId === sel.id).length === 0 ? (
                <p className="pd-ev-text">{t("No changes recorded for this field yet.", "Aún no hay cambios registrados para este campo.")}</p>
              ) : (
                <ol className="pd-hist">
                  {history.filter((h) => h.fieldId === sel.id).map((h) => (
                    <li key={h.id}>
                      <p><strong>{HA(h.action)}</strong> · <time dateTime={h.at}>{fmt(h.at, lang)}</time></p>
                      <p>{t("Prior value", "Valor anterior")}: {h.priorValue || t("No value yet", "Sin valor todavía")}</p>
                      {h.proposedValue !== undefined && <p className="pd-prop">{t("Proposed conflicting value (not the actual value)", "Valor en conflicto propuesto (no es el valor real)")}: {h.proposedValue}</p>}
                      <p>{t("Resulting actual value", "Valor real resultante")}: {h.resultValue || t("No value yet", "Sin valor todavía")} · {HS(h.resultStatus)}</p>
                      <p className="pd-ev-src">{t("Editor", "Editor")}: {h.editor === EDITOR ? t(EDITOR, EDITOR_ES) : h.editor}</p>
                    </li>
                  ))}
                </ol>
              )}
            </div>

            {flagOpen && !sel.conflict && (
              <form className="pd-card" onSubmit={flag}>
                <h2>{t("Flag a conflict on", "Marcar un conflicto en")} {fl(sel).toLowerCase()}</h2>
                <Label htmlFor="cv">{t("Conflicting value", "Valor en conflicto")}</Label>
                <Input id="cv" className="pd-in" value={cv} onChange={(e) => setCv(e.target.value)} />
                <Label htmlFor="cs">{t("Source of conflicting value", "Fuente del valor en conflicto")}</Label>
                <select id="cs" className="pd-in pd-select" value={cs} onChange={(e) => setCs(e.target.value)}>
                  {SOURCES.map((s) => (<option key={s} value={s}>{fs_(s)}</option>))}
                </select>
                <Label htmlFor="cn">{t("Note", "Nota")}</Label>
                <Textarea id="cn" value={cn} onChange={(e) => setCn(e.target.value)} placeholder="What does not match, and where you saw it" />
                {cerr && <p className="pd-err" role="alert">{cerr}</p>}
                <div className="pd-actions">
                  <Button type="submit" size="lg">{t("Flag conflict", "Marcar conflicto")}</Button>
                  <Button type="button" variant="outline" size="lg" onClick={() => setFlagOpen(false)}>{t("Cancel", "Cancelar")}</Button>
                </div>
              </form>
            )}

            {sel.status === "NEEDED" ? (
              <form className="pd-card" onSubmit={confirm}>
                <h2>{t("Confirm", "Confirmar")} {fl(sel).toLowerCase()}</h2>
                <Label htmlFor="v">{t("Value", "Valor")}</Label>
                <Input id="v" className="pd-in" value={value} onChange={(e) => setValue(e.target.value)} placeholder={sel.id === "panel" ? "e.g. 200 A" : "e.g. Tested and sealed, 6% leakage"} />
                <Label htmlFor="s">{t("Source", "Fuente")}</Label>
                <select id="s" className="pd-in pd-select" value={source} onChange={(e) => setSource(e.target.value)}>
                  {SOURCES.map((s) => (<option key={s} value={s}>{fs_(s)}</option>))}
                </select>
                <Label htmlFor="n">{t("Evidence note (optional)", "Nota de evidencia (opcional)")}</Label>
                <Textarea id="n" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Photo name, who said it, when" />
                {err && <p className="pd-err" role="alert">{err}</p>}
                <Button type="submit" size="lg">{t("Confirm field", "Confirmar campo")}</Button>
              </form>
            ) : (
              <div className="pd-card pd-done"><p>{t("This field is Confirmed. Select a NEEDED field to enter its value and source.", "Este campo está confirmado. Elija un campo NECESARIO para ingresar su valor y fuente.")}</p></div>
            )}
          </aside>
        </div>

        {isSac && (
          <section className="pd-card" aria-labelledby="sacf" data-testid="sac-forms">
            <h2 id="sacf">{t("City of Sacramento forms", "Formularios de la Ciudad de Sacramento")}</h2>
            <p className="pd-ev-text">{t("Reference only. Nothing is submitted or filled in from this draft. See the", "Solo referencia. No se envía ni se llena nada desde este borrador. Vea los")} <a className="underline font-semibold" href={BUNDLE} target="_blank" rel="noopener noreferrer">{t("city's Minor Permit Application Form Bundles", "paquetes de formularios de permisos menores de la ciudad")}</a>.</p>
            <ul className="pd-fu-list">
              {FORMS.map((f) => (
                <li key={f.code}>
                  <p><a className="underline font-semibold" href={f.url} target="_blank" rel="noopener noreferrer">{f.name} – {f.code}</a></p>
                  <p className="pd-ev-text">{es ? FORM_NOTE_ES[f.code] ?? f.note : f.note}</p>
                </li>
              ))}
            </ul>
            <p className="pd-ev-text">{t("The city lists the CF1R Residential HVAC Form as obtained from a third party; no code cycle is selected here.", "La ciudad indica que el Formulario CF1R Residential HVAC se obtiene de un tercero; aquí no se elige ningún ciclo de código.")}</p>
          </section>
        )}
      </main>

      <footer className="pd-foot">
        <p>{t("Draft — not a guarantee of compliance. Contractor review and signature required.", "Borrador: no garantiza el cumplimiento. Se requiere revisión y firma del contratista.")}</p>
        <p>{t("Practice screen with a sample job. Not connected to real permit filing.", "Pantalla de práctica con un trabajo de muestra. No conectada a la presentación real de permisos.")}</p>
        <p><a className="underline font-semibold" href="/coverage">{t("What PermitDraft covers", "Qué cubre PermitDraft")}</a></p>
      </footer>
    </div>
  );
}
