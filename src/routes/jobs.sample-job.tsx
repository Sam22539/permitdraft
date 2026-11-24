import { PacketInfo } from "../components/packet-info";
import { ResourceLink } from "../components/resource-link";
import { CoreGate } from "../components/core-offer";
import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useCorePath, useDemo } from "../components/demo";
import { DemoFeedback } from "../components/demo-feedback";
import { useEffect, useState } from "react";
import { useCaptured, type Captured } from "../lib/captured";
import { activeType, answerLabel, captureSummary, applicableChecks, DUCT_LABEL, fieldSets, READING_UNIT_KEY, readingUnit, requiredSlots } from "../lib/capture-fields";
import { loadPhotos, ALL_SLOTS, type Slot } from "../lib/photos";
import { AppPage } from "../components/app-shell";
import { Checkbox } from "../components/ui/checkbox";
import { InspectionTimeline } from "../components/inspection-timeline";
import { Image } from "../image";
import { useLang } from "../lib/lang";
import { usePhotos, SLOTS } from "../lib/photos";
import { PendingLabel } from "../components/photo-slot";

export const Route = createFileRoute("/jobs/sample-job")({
  head: () => ({ meta: [{ title: "Job #HP-1187 · 4412 Alder Court, Sacramento" }, { name: "description", content: "Next step, paperwork timeline and compliance checks for job HP-1187." }] }),
  validateSearch: (s: Record<string, unknown>): { saved?: "1"; done?: string } => ({ saved: s.saved === "1" || s.saved === 1 ? "1" : undefined, done: typeof s.done === "string" && s.done ? s.done : undefined }),
  component: () => <CoreGate><Detail /></CoreGate>,
});

const STEPS: [string, string][] = [
  ["Get the permit", "Obtener el permiso"],
  ["File compliance form CF1R", "Presentar el formulario CF1R"],
  ["Install the equipment", "Instalar el equipo"],
  ["File installation form CF2R", "Presentar el formulario CF2R"],
  ["Rater test passed CF3R", "Prueba del evaluador aprobada CF3R"],
  ["Pass final inspection", "Aprobar la inspección final"],
];
const CHECKS: [string, string, "g" | "a" | "r"][] = [
  ["Equipment model", "Modelo del equipo", "g"],
  ["Serial number", "Número de serie", "g"],
  ["Refrigerant type R-410A", "Tipo de refrigerante R-410A", "g"],
  ["Outdoor unit location", "Ubicación de la unidad exterior", "g"],
  ["Panel size", "Tamaño del panel", "a"],
  ["Duct sealing answer", "Respuesta de sellado de ductos", "a"],
  ["Refrigerant charge reading", "Lectura de carga de refrigerante", "g"],
];

export function Detail() {
  const { done: doneId } = useSearch({ strict: false }) as { saved?: "1"; done?: string };
  return doneId ? <CapturedDetail id={doneId} /> : <SampleDetail />;
}

const SLOT_NAME: Record<Slot, [string, string]> = {
  plate: ["Data plate (model and serial)", "Placa de datos (modelo y serie)"],
  outdoor: ["Outdoor unit with clearance", "Unidad exterior con espacio libre"],
  wide: ["Whole unit, wide shot", "Unidad completa, foto general"],
  gauge: ["Refrigerant gauge or meter reading", "Lectura del manómetro"],
  panel: ["Panel label photo", "Foto de la etiqueta del panel"],
  plate_furnace: ["Furnace data plate", "Placa de datos del horno"],
  plate_coil: ["Indoor coil data plate", "Placa de datos del serpentín interior"],
  plate_outdoor: ["Outdoor unit data plate", "Placa de datos de la unidad exterior"],
};

/** A finished capture, shown from its own saved snapshot only. Never the sample job and never the active new-job draft. */
function CapturedDetail({ id }: { id: string }) {
  const { t, lang } = useLang();
  const p = useCorePath();
  const demo = useDemo();
  const { saved } = useSearch({ strict: false }) as { saved?: "1" };
  const all = useCaptured();
  const [mounted, setMounted] = useState(false);
  const [urls, setUrls] = useState<Partial<Record<Slot, string>>>({});
  useEffect(() => setMounted(true), []);
  const cap: Captured | undefined = all.find((c) => c.id === id);
  useEffect(() => {
    if (!cap) return;
    let dead = false;
    const made: string[] = [];
    loadPhotos(id).then((recs) => {
      if (dead) return;
      const m: Partial<Record<Slot, string>> = {};
      for (const r of recs) { const u = URL.createObjectURL(r.blob); made.push(u); m[r.slot] = u; }
      setUrls(m);
    }).catch(() => undefined);
    return () => { dead = true; made.forEach((u) => URL.revokeObjectURL(u)); };
  }, [id, !!cap]);

  if (!cap) {
    return (
      <AppPage bottom capture>
        <h1 className="cx-h1">{t("Captured job", "Trabajo capturado")}</h1>
        <p className="cx-note" role="status">{mounted ? t("This captured job was not found on this device. Nothing else is shown in its place.", "Este trabajo capturado no se encontró en este dispositivo. No se muestra nada más en su lugar.") : t("Loading…", "Cargando…")}</p>
        <Link to={p("/jobs")} className="ap-btn ghost">{t("Back to Jobs", "Volver a Trabajos")}</Link>
      </AppPage>
    );
  }
  const sm = captureSummary(cap, lang);
  const type = activeType(cap);
  const v = cap.values;
  const fv = (k: string) => String(v[k] ?? cap.formDefaults[k] ?? "").trim();
  const fields = fieldSets(cap);
  const label = (k: string) => { const f = fields.find((x) => x.key === k); return f ? t(...f.label) : k; };
  const equipKeys = fields.filter((f) => f.step === 2 && f.key !== "type");
  const showVal = (f: { key: string; kind?: string }) => {
    const raw = fv(f.key);
    if (!raw) return t("Not captured", "No capturado");
    if (f.kind === "choice") { const a = answerLabel(f.key, raw); return a ? t(...a) : raw; }
    if (f.kind === "duct") return DUCT_LABEL[raw] ? t(...DUCT_LABEL[raw]) : raw;
    return raw;
  };
  const checks = fields.filter((f) => f.kind === "check");
  const applicable = applicableChecks(type, v);
  const slots = [...new Set<Slot>([...requiredSlots(type, v), ...ALL_SLOTS.filter((s) => cap.photos.some((x) => x.slot === s)), ...(cap.photos.some((x) => x.slot === "panel") ? (["panel"] as Slot[]) : [])])];
  const have = slots.filter((s) => cap.photos.some((x) => x.slot === s)).length;
  const when = new Date(cap.finishedAt).toLocaleString(lang === "es" ? "es-US" : "en-US", { dateStyle: "medium", timeStyle: "short" });
  const row = (k: string, val: string) => <li key={k} className="ap-chk" style={{ display: "grid", gap: ".15rem" }}><span className="cx-note">{k}</span><strong>{val}</strong></li>;

  return (
    <AppPage bottom capture>
      {saved && (
        <div role="status" className="cx-card calm">
          <p className="font-semibold">{demo ? t("Demo job saved. Nothing is filed.", "Trabajo de demostración guardado. No se presenta nada.") : t("Job saved. This is not permit filing.", "Trabajo guardado. No es la presentación del permiso.")}</p>
          <Link to={p("/permit/draft/$id")} params={{ id } as never} className="ap-btn primary" data-testid="open-review">{t("Open review draft", "Abrir borrador de revisión")}</Link>
          {demo && <DemoFeedback />}
        </div>
      )}
      {!demo && saved && (
        <section className="cx-card calm" data-testid="core-receipt"><h2 className="cx-h">{t("Office receipt", "Recibo de la oficina")}</h2><PacketInfo jobId={id} /></section>
      )}
      <h1 className="cx-h1" data-testid="captured-title">{t("Captured job · ", "Trabajo capturado · ")}{sm.addr}</h1>
      <p className="cx-note">{t(`Finished ${when} · ${type}. Not filed with the permitting authority.`, `Finalizado ${when} · ${type}. No presentado ante la autoridad de permisos.`)}{cap.submittedBy ? t(` Submitted by ${cap.submittedBy}.`, ` Enviado por ${cap.submittedBy}.`) : ""}</p>
      <Link to={p("/permit/draft/$id")} params={{ id } as never} className="ap-btn navy">{t("Open review draft", "Abrir borrador de revisión")}</Link>

      <section className="cx-card calm" data-testid="cap-site">
        <h2 className="cx-h">{t("Homeowner & site", "Propietario y sitio")}</h2>
        <ul>{["name", "phone", "addr", "city"].map((k) => row(label(k), fv(k) || t("Not captured", "No capturado")))}</ul>
      </section>
      <section className="cx-card calm" data-testid="cap-equipment">
        <h2 className="cx-h">{t("Equipment", "Equipo")}</h2>
        <ul>{row(t("Equipment type", "Tipo de equipo"), type || t("Not captured", "No capturado"))}{equipKeys.map((f) => row(t(...f.label), showVal(f)))}</ul>
      </section>
      <section className="cx-card calm" data-testid="cap-work">
        <h2 className="cx-h">{t("Work performed", "Trabajo realizado")}</h2>
        <ul>{["work", "panel", "duct", ...(v.duct === "exempt" ? ["ductReason"] : [])].map((k) => { const f = fields.find((x) => x.key === k); return f ? row(t(...f.label), showVal(f)) : null; })}</ul>
      </section>
      <section className="cx-card calm" data-testid="cap-checklist">
        <h2 className="cx-h">{t("Final checklist", "Lista de verificación final")}</h2>
        <ul>
          {checks.map((f) => { const on = v[f.key] === "1"; return (
            <li key={f.key} className="ap-chk"><span className={`ap-dot ${on ? "g" : "a"}`} aria-hidden /><span style={{ flex: 1 }}>{t(...f.label)}</span><strong className="cx-note">{on ? t("Ticked by the tech", "Marcado por el técnico") : t("Not ticked", "No marcado")}</strong></li>
          ); })}
          {Object.keys(READING_UNIT_KEY).filter((k) => applicable.includes("c2")).map((k) => row(`${label(k)} · ${t(...readingUnit(v, k))}`, fv(k) || t("Not captured", "No capturado")))}
        </ul>
      </section>
      <section className="cx-card calm" data-testid="cap-photos">
        <h2 className="cx-h">{t("Photos", "Fotos")}</h2>
        <p>{t(`${have} attached · ${slots.length - have} not attached`, `${have} adjuntas · ${slots.length - have} sin adjuntar`)}</p>
        {slots.map((s) => { const ref = cap.photos.find((x) => x.slot === s); return (
          <div key={s} className="ph-ev" data-testid={`cap-photo-${s}`}>
            <p className="font-semibold">{t(...SLOT_NAME[s])}</p>
            {ref ? (urls[s] ? <div className="ph-thumb"><Image src={urls[s]!} alt={t(...SLOT_NAME[s])} width={96} height={96} /></div> : <p className="cx-note">{t("Loading photo…", "Cargando foto…")}</p>) : <p className="cx-note">{t("No photo captured", "Sin foto capturada")}</p>}
          </div>
        ); })}
      </section>
    </AppPage>
  );
}

function SampleDetail() {
  const { t } = useLang();
  const p = useCorePath();
  const demo = useDemo();
  const saved = false;
  const doneId: string | undefined = undefined;
  const [done, setDone] = useState<boolean[]>(STEPS.map(() => false));
  const [warranty, setWarranty] = useState(false);
  const { photos, pending } = usePhotos();
  const have = SLOTS.filter((k) => photos[k]).length;
  const [sent, setSent] = useState(false);
  const marker = { g: ["Confirmed", "Confirmado"], a: ["NEEDED", "FALTA"], r: ["Blocked", "Bloqueado"] } as const;

  const summary = (title: string, es: string, text: string) => (
    <section className="cx-card calm">
      <h2 className="cx-h">{t(title, es)}</h2>
      <p>{text}</p>
      <Link to={p("/new")} className="ap-edit">{t("Edit", "Editar")}</Link>
    </section>
  );

  return (
    <AppPage bottom capture>
      {saved && (
        <div role="status" className="cx-card calm">
          <p className="font-semibold">{demo ? t("Demo job saved. Nothing is filed.", "Trabajo de demostración guardado. No se presenta nada.") : t("Job saved. This is not permit filing.", "Trabajo guardado. No es la presentación del permiso.")}</p>
          {!demo && doneId && <PacketInfo jobId={doneId} />}
          {doneId && <Link to={p("/permit/draft/$id")} params={{ id: doneId } as never} className="ap-btn primary" data-testid="open-review">{t("Open review draft", "Abrir borrador de revisión")}</Link>}
          {demo && doneId && <DemoFeedback />}
        </div>
      )}
      <h1 className="cx-h1">{t("Job #HP-1187 · 4412 Alder Court, Sacramento")}</h1>
      <Link to="/sample-job" className="ap-btn navy">{t("View sample permit draft", "Ver borrador de permiso de muestra")}</Link>

      <Link to="/sample-job" hash="panel-size" className="cx-card" aria-label={t("View panel size on the sample permit draft", "Ver el tamaño del panel en el borrador de muestra")}>
        <h2 className="cx-h">{t("Your next step", "Su siguiente paso")}</h2>
        <p className="jb-next">{t("Fix 2 missing items", "Corrija 2 datos faltantes")}</p>
        <p className="cx-note">{t("Panel size and duct sealing answer", "Tamaño del panel y respuesta de sellado de ductos")}</p>
      </Link>

      <section className="cx-card calm">
        <h2 className="cx-h">{t("Permit & paperwork", "Permiso y papeleo")}</h2>
        <ul className="ap-tl">
          {STEPS.map(([en, es], i) => (
            <li key={en}>
              <div
                role="button"
                tabIndex={0}
                className="ap-row"
                onClick={() => setDone((d) => d.map((v, k) => (k === i ? !v : v)))}
                onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); setDone((d) => d.map((v, k) => (k === i ? !v : v))); } }}
              >
                <Checkbox checked={done[i]} tabIndex={-1} aria-label={t(en, es)} onClick={(e) => e.stopPropagation()} onCheckedChange={(v) => setDone((d) => d.map((x, k) => (k === i ? v === true : x)))} />
                <span className={done[i] ? "done-text" : ""}>{t(en, es)}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <InspectionTimeline />
      <ResourceLink stage="close_out" />

      <section className="cx-card calm">
        <h2 className="cx-h">{t("Compliance checks", "Verificaciones de cumplimiento")}</h2>
        <ul>
          {CHECKS.map(([en, es, c]) => (
            <li key={en} className="ap-chk">
              <span className={`ap-dot ${c}`} aria-hidden />
              <span style={{ flex: 1 }}>{t(en, es)}</span>
              <strong className="cx-note">{t(marker[c][0], marker[c][1])}</strong>
            </li>
          ))}
        </ul>
      </section>

      <section className="cx-card calm">
        <h2 className="cx-h">{t("Warranty registration", "Registro de garantía")}</h2>
        <label className="ap-chk" style={{ gap: "1rem" }}>
          <Checkbox checked={warranty} onCheckedChange={(v) => setWarranty(v === true)} className="size-8 border-2 border-[#12264a] data-[state=checked]:bg-[#12264a]" />
          <span>{t("Warranty registered with the manufacturer", "Garantía registrada con el fabricante")}</span>
        </label>
        <p className="cx-note">{t("Registration window: 60 days after install", "Plazo de registro: 60 días después de la instalación")}</p>
      </section>

      <section className="cx-card calm">
        <h2 className="cx-h">{t("Photos", "Fotos")}</h2>
        <p>{t(`${have} attached · ${3 - have} required`, `${have} adjuntas · ${3 - have} requeridas`)}</p>
        <p className="ph-pend" data-testid="pending-count">{t(`${pending} photo(s) waiting to upload`, `${pending} foto(s) esperando para subir`)}</p>
        {SLOTS.filter((k) => photos[k]).map((k) => (
          <div key={k} className="ph-thumb"><Image src={photos[k]!.url} alt={k} width={96} height={96} /><PendingLabel p={photos[k]!} /></div>
        ))}
        <Link to={p("/new/photos")} className="ap-edit">{t("Add or change photos", "Agregar o cambiar fotos")}</Link>
      </section>

      {summary("Homeowner & site", "Propietario y sitio", "4412 Alder Court, Sacramento")}
      {summary("Equipment", "Equipo", "Carrier 25HPB536A003 · Heat pump change-out")}
      {summary("Work performed", "Trabajo realizado", "Heat-pump change-out, same pad, left side yard")}

      <button type="button" className="ap-btn primary" onClick={() => setSent(true)}>{t("Send homeowner update", "Enviar actualización al propietario")}</button>
      {sent && <p role="status" className="ap-card font-semibold">{t("Demo only: nothing is sent", "Solo demo: no se envía nada")}</p>}
    </AppPage>
  );
}
