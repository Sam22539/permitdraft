import { ResourceLink } from "../components/resource-link";
import { CoreGate } from "../components/core-offer";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { PacketInfo } from "../components/packet-info";
import { useCorePath, useDemo } from "../components/demo";
import { useEffect, useState } from "react";
import { AppPage } from "../components/app-shell";
import { PhotoViewer } from "../components/photo-viewer";
import { useCaptured } from "../lib/captured";
import { activeType, answerLabel, captureSummary, requiredSlots, DUCT_LABEL, fieldSets, FIX_INPUT_ID, READING_UNIT_KEY, readingUnit, STEP_ROUTES, uncategorized } from "../lib/capture-fields";
import { useLang } from "../lib/lang";
import { CoverageLine, ReadinessCard, WhyDetails } from "../components/readiness";
import { evaluateCapture, useOfficeJurisdictions } from "../lib/rules/use-evaluation";
import { loadPhotos, ALL_SLOTS, type Slot } from "../lib/photos";
import { CopyRequest } from "../components/copy-request";
import { copyRequest } from "../lib/copy-requests";
import { ConflictBox, CorrectionControls, CorrectionStatus } from "../components/correction";

export const Route = createFileRoute("/permit/draft/$id")({
  head: () => ({ meta: [{ title: "Review draft — PermitDraft" }, { name: "description", content: "Review draft built from what was captured on the job, each value with where it came from." }] }),
  component: () => <CoreGate><Review /></CoreGate>,
});

const SLOT_LABEL: Record<Slot, [string, string]> = {
  plate: ["Data plate (model and serial)", "Placa de datos (modelo y serie)"],
  outdoor: ["Outdoor unit with left side yard and clearance", "Unidad exterior con patio lateral izquierdo y espacio libre"],
  wide: ["Whole unit, wide shot (optional)", "Unidad completa, foto general (opcional)"],
  gauge: ["Refrigerant gauge or meter reading", "Lectura del manómetro o medidor de refrigerante"],
  panel: ["Panel label photo", "Foto de la etiqueta del panel"],
  plate_furnace: ["Furnace data plate", "Placa de datos del horno"],
  plate_coil: ["Indoor coil data plate", "Placa de datos del serpentín interior"],
  plate_outdoor: ["Outdoor unit data plate", "Placa de datos de la unidad exterior"],
};
/** The demo's capture labels, where they differ from Core's. */
const DEMO_LABEL: Record<string, [string, string]> = {
  work: ["Job notes", "Notas del trabajo"],
  panel: ["Panel rating (amps)", "Capacidad nominal del panel (amperios)"],
  duct: ["Was duct sealing performed?", "¿Se realizó el sellado de ductos?"],
};

const t0 = (x: readonly [string, string]) => x[0].toLowerCase();

export function Review() {
  const { id } = useParams({ strict: false }) as { id: string };
  const { t, lang } = useLang();
  const isDemoReview = useDemo();
  const p = useCorePath();
  const all = useCaptured();
  const [mounted, setMounted] = useState(false);
  const [urls, setUrls] = useState<Partial<Record<Slot, string>>>({});
  const [photoErr, setPhotoErr] = useState(false);
  useEffect(() => setMounted(true), []);
  const cap = all.find((c) => c.id === id);
  const jurs = useOfficeJurisdictions();

  useEffect(() => {
    if (!cap) return;
    let dead = false;
    const made: string[] = [];
    loadPhotos(id).then((recs) => {
      if (dead) return;
      const m: Partial<Record<Slot, string>> = {};
      for (const r of recs) { const u = URL.createObjectURL(r.blob); made.push(u); m[r.slot] = u; }
      setUrls(m);
    }).catch(() => !dead && setPhotoErr(true));
    return () => { dead = true; made.forEach((u) => URL.revokeObjectURL(u)); };
  }, [id, !!cap]);

  // Opened by the capture screen's return: scroll to and highlight the NEEDED row it came from.
  const [hl, setHl] = useState("");
  useEffect(() => {
    if (!cap || typeof window === "undefined") return;
    const h = window.location.hash.replace(/^#/, "");
    if (!h.startsWith("need-")) return;
    const el = document.getElementById(h);
    if (!el) return;
    setHl(h);
    el.scrollIntoView({ block: "center" });
    el.focus({ preventScroll: true });
  }, [!!cap]);
  if (!cap) {
    return (
      <AppPage bottom>
        <h1 className="text-3xl">{t("Review draft", "Borrador de revisión")}</h1>
        <p className="ap-muted">{mounted ? t("This captured job is not saved on this device.", "Este trabajo capturado no está guardado en este dispositivo.") : t("Loading…", "Cargando…")}</p>
        <Link to={p("/jobs")} className="ap-btn ghost">{t("Back to Jobs", "Volver a Trabajos")}</Link>
      </AppPage>
    );
  }

  const sm = captureSummary(cap, lang);
  const when = new Date(cap.finishedAt).toLocaleString(lang === "es" ? "es-US" : "en-US", { dateStyle: "medium", timeStyle: "short" });
  const extra = uncategorized(cap);
  const ev = evaluateCapture(cap, jurs[cap.id] ?? null);
  const caption = (s: Slot, u?: "indoor" | "outdoor") => {
    const kind = s.startsWith("plate") ? t("Label close-up", "Primer plano de la etiqueta") : s === "wide" ? t("Whole-unit photo", "Foto de la unidad completa") : t("Photo", "Foto");
    const unit = u === "indoor" ? t("Indoor unit", "Unidad interior") : u === "outdoor" ? t("Outdoor unit", "Unidad exterior") : null;
    if (s !== "plate" && s !== "wide") return kind;
    return unit ? `${unit} · ${kind}` : `${t("Unit not specified", "Unidad no especificada")} · ${kind}`;
  };
  const photoNote = (ref: { name: string; savedAt: number }) => t(`Photo ${ref.name}, saved on this device ${new Date(ref.savedAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })} · Waiting to upload. Shown as evidence only; it does not confirm any value.`, `Foto ${ref.name}, guardada en este dispositivo ${new Date(ref.savedAt).toLocaleString("es-US", { dateStyle: "medium", timeStyle: "short" })} · Esperando para subir. Solo como evidencia; no confirma ningún valor.`);
  const dash = t("Not captured", "No capturado");
  const fieldLabel = (r: { evidence: string; text: readonly [string, string] }): [string, string] => {
    const key = r.evidence.startsWith("field:") ? r.evidence.slice(6) : "";
    const f = key ? fieldSets(cap).find((x) => x.key === key) : undefined;
    return f ? f.label : [r.text[0], r.text[1]];
  };
  const corr = cap.corrections ?? {};
  const flagged = Object.values(corr).filter((c) => c.flaggedAt && !c.decision).length;
  const jobCtx: [string, string] = ev.workflow ? [ev.workflow.name[0], ev.workflow.name[1]] : ["", ""];

  return (
    <AppPage bottom>
      <h1 className="text-3xl">{t("Review draft", "Borrador de revisión")}</h1>
      <p className="ap-muted">{sm.addr} · {activeType(cap) || sm.equip}</p>
      <p className="rd-notice" data-testid="draft-notice">{t("Draft only. Not a guarantee of compliance. Contractor review and signature required.", "Solo borrador. No garantiza el cumplimiento. Se requiere revisión y firma del contratista.")}</p>
      <ReadinessCard ev={ev} capId={cap.id} jur={jurs[cap.id] ?? ""} />
      <CoverageLine ev={ev} />
      <ResourceLink stage="permit" />
      {jurs[cap.id] && (<p className="cx-note" data-testid="filing-handoff-link"><Link to="/resources" hash="filing-handoff" className="underline font-semibold">{t("Official filing handoff: confirm the permitting authority", "Entrega para presentar: confirme la autoridad de permisos")}</Link>{" · "}{t("opens official pages only; nothing is filed or sent", "solo abre páginas oficiales; no se presenta ni envía nada")}</p>)}
      <p className="ap-muted">{t(`Finished ${when}. Practice job, not connected to real permit filing. Every value below is exactly what was captured; nothing here is confirmed by a reviewer yet.`, `Finalizado ${when}. Trabajo de práctica, no conectado a la presentación real de permisos. Cada valor es exactamente lo capturado; nada está confirmado por un revisor todavía.`)}</p>
      <p className="ap-next" data-testid="review-missing">{sm.missing > 0 ? t(`${sm.missing} item(s) not captured`, `${sm.missing} dato(s) sin capturar`) : t("Nothing missing from capture", "No falta nada de la captura")}</p>
      <p className="ap-next" data-testid="review-status">{ev.officeReview.ready
        ? t("Ready for office review. Every required detail is captured, but nothing is confirmed by a reviewer yet.", "Listo para revisión de oficina. Cada dato obligatorio está capturado, pero ningún revisor ha confirmado nada todavía.")
        : t(`Not ready for office review: ${ev.missing.length} required item(s) still missing: ${ev.missing.map((m) => m.text[0]).join(", ")}`, `No listo para revisión de oficina: faltan ${ev.missing.length} dato(s) obligatorio(s): ${ev.missing.map((m) => m.text[1]).join(", ")}`)}</p>
      <PacketInfo jobId={cap.id} />
      {Object.keys(corr).length > 0 && (
        <p className="ap-muted" data-testid="review-corrections">{t(
          `${Object.keys(corr).length} corrected item(s), ${flagged} awaiting office review. Corrections are shown beside the captured value in the office view below; they do not confirm, approve or ready anything for filing, and missing items stay missing until captured.`,
          `${Object.keys(corr).length} dato(s) corregido(s), ${flagged} esperando revisión de oficina. Las correcciones aparecen junto al valor capturado en la vista de oficina; no confirman, aprueban ni preparan nada para presentar, y los datos faltantes siguen faltando hasta capturarlos.`,
        )}</p>
      )}

      <section className="ap-card" data-testid="review-checks">
        <h2 className="ap-h2">{t("Checks", "Verificaciones")}</h2>
        <p className="ap-muted">{t("Documentation checks from PermitDraft's own checklist. They are not legal or code checks.", "Verificaciones de documentación de la lista propia de PermitDraft. No son verificaciones legales ni de código.")}</p>
        {ev.results.map((r) => (
          <div key={r.ruleId} id={`need-${r.ruleId}`} tabIndex={-1} className={`rd-item${hl === `need-${r.ruleId}` ? " rd-focus" : ""}`} data-testid={`check-${r.ruleId}`}>
            <strong>{t(...r.text)} · {r.status === "met" ? t("Captured", "Capturado") : t("NEEDED", "NECESARIO")}</strong>
            {r.status === "missing" && (() => {
              const fk = r.evidence.startsWith("field:") ? r.evidence.slice(6) : "";
              const f = fk ? fieldSets(cap).find((x) => x.key === fk) : undefined;
              if (!f || !FIX_INPUT_ID[f.key]) return null;
              const c1 = corr[f.key];
              return (
                <>
                  {c1 && <CorrectionStatus c={c1} testId={`need-corr-${f.key}`} original="" />}
                  <Link to={p(STEP_ROUTES[f.step - 1])} search={{ fix: cap.id, field: f.key, rule: r.ruleId } as never} className="ap-btn primary rd-capture" data-testid={`capture-${f.key}`}>
                    {c1 ? t(`Edit ${f.label[0]} in capture`, `Editar ${f.label[1]} en la captura`) : t(`Capture ${f.label[0]}`, `Capturar ${f.label[1]}`)}
                  </Link>
                </>
              );
            })()}
            {r.status === "missing" && r.evidence.startsWith("photo:") && (
              <Link to={p("/new/photos")} search={{ fix: cap.id, slot: r.evidence.slice(6), rule: r.ruleId } as never} className="ap-btn primary rd-capture" data-testid={`capture-photo-${r.evidence.slice(6)}`}>
                {t(`Add ${t0(r.text)}`, `Agregar ${r.text[1].toLowerCase()}`)}
              </Link>
            )}
            {r.status === "missing" && <span className="ap-next">{t(...r.todo)}</span>}
            {r.status === "missing" && <CopyRequest text={copyRequest(r.ruleId.replace(/^app-doc-/, ""), fieldLabel(r), jobCtx)} field={t(...fieldLabel(r))} testId={`copy-${r.ruleId}`} />}
            <WhyDetails r={r} />
          </div>
        ))}
        <p className="ap-muted text-sm" data-testid="audit-line">{t(`Rule data ${ev.packId} v${ev.packVersion}, evaluated ${ev.asOf}.`, `Datos de reglas ${ev.packId} v${ev.packVersion}, evaluado ${ev.asOf}.`)}</p>
      </section>

      <section className="ap-card" data-testid="review-fields">
        <details open={Object.keys(corr).length > 0 || undefined}>
        <summary className="ap-h2" style={{ minHeight: 48, cursor: "pointer" }}>{t("Office view: captured details and evidence", "Vista de oficina: datos y evidencia capturados")}</summary>
        <ul>
          {fieldSets(cap).map((f) => {
            const raw = cap.values[f.key];
            const has = raw !== undefined && String(raw).trim() !== "";
            const def = cap.formDefaults[f.key];
            let shown = "";
            if (f.kind === "check") shown = raw === "1" ? t("Ticked by the tech", "Marcado por el técnico") : "";
            else if (f.kind === "choice" && has) shown = answerLabel(f.key, raw) ? t(...answerLabel(f.key, raw)!) : raw;
            else if (f.kind === "duct" && has) shown = DUCT_LABEL[raw] ? t(...DUCT_LABEL[raw]) : raw;
            else if (has) shown = raw;
            else if (def) shown = def;
            if (f.key === "ductReason" && cap.values.duct !== "exempt" && !has) return null;
            const prov = has || (f.kind === "check" && raw === "1")
              ? t(`Entered by the tech in step ${f.step} of the capture · not yet confirmed`, `Ingresado por el técnico en el paso ${f.step} de la captura · sin confirmar`)
              : def
                ? t(`Form default shown in step ${f.step}, never edited by the tech · not yet confirmed`, `Valor predeterminado del paso ${f.step}, nunca editado por el técnico · sin confirmar`)
                : f.kind === "check" ? t("Not ticked in the capture", "No marcado en la captura") : t(`Not entered in step ${f.step}`, `No ingresado en el paso ${f.step}`);
            return (
              <li key={f.key} className="ap-chk" style={{ display: "grid", gap: ".15rem" }} data-testid={`rv-${f.key}`}>
                <span className="ap-muted">{t(...((isDemoReview && DEMO_LABEL[f.key]) || f.label))}</span>
                <strong>{shown || dash}</strong>
                {isDemoReview && f.key === "panel" && (() => {
                  const ref = cap.photos.find((x) => x.slot === "panel");
                  if (!ref) return <span className="ap-next" data-testid="rv-panel-photo-none">{t("No panel label photo captured", "Sin foto de la etiqueta del panel")}</span>;
                  return (
                    <div className="ph-ev" data-testid="rv-panel-photo">
                      {urls.panel ? <PhotoViewer src={urls.panel} alt={t(...SLOT_LABEL.panel)} testId="rv-view-panel" caption={<><p className="font-semibold">{t(...SLOT_LABEL.panel)}</p><p>{photoNote(ref)}</p></>} /> : <p className="ap-muted">{photoErr ? t("Could not read this photo on this device.", "No se pudo leer esta foto en este dispositivo.") : t("Loading photo…", "Cargando foto…")}</p>}
                      <p className="font-semibold">{t(...SLOT_LABEL.panel)}</p>
                      <p className="ap-muted text-sm">{photoNote(ref)}</p>
                    </div>
                  );
                })()}
                {READING_UNIT_KEY[f.key] && <span className="font-semibold" data-testid={`rv-unit-${f.key}`}>{t(...readingUnit(cap.values, f.key))}</span>}
                <span className="ap-muted text-sm">{prov}</span>
                {corr[f.key]?.flaggedAt && !corr[f.key]?.decision && <ConflictBox c={corr[f.key]} field={f.key} captured={shown} capturedSource={prov} />}
                {f.kind !== "check" && (shown || corr[f.key]) && <CorrectionControls capId={cap.id} field={f.key} label={t(...f.label)} current={has ? String(raw) : ""} c={corr[f.key]} original={has ? String(raw) : ""} />}
              </li>
            );
          })}
        </ul>
        </details>
      </section>

      <section className="ap-card" data-testid="review-photos">
        <h2 className="ap-h2">{t("Photos", "Fotos")}</h2>
        {isDemoReview && (() => {
          const ref = cap.photos.find((x) => x.slot === "panel");
          const rating = String(cap.values.panel ?? "").trim();
          return (
            <div className="ph-ev" data-testid="rv-photo-panel">
              <p className="font-semibold">{t(...DEMO_LABEL.panel)}: <span data-testid="rv-panel-rating">{rating || dash}</span></p>
              {ref ? (
                <>
                  {urls.panel ? <PhotoViewer src={urls.panel} alt={t(...SLOT_LABEL.panel)} testId="rv-view-panel-photo" caption={<><p className="font-semibold">{t(...SLOT_LABEL.panel)}</p><p>{photoNote(ref)}</p></>} /> : <p className="ap-muted">{photoErr ? t("Could not read this photo on this device.", "No se pudo leer esta foto en este dispositivo.") : t("Loading photo…", "Cargando foto…")}</p>}
                  <p className="font-semibold">{t(...SLOT_LABEL.panel)}</p>
                  <p className="ap-muted text-sm">{photoNote(ref)}</p>
                </>
              ) : <p className="ap-next">{t("No panel label photo captured", "Sin foto de la etiqueta del panel")}</p>}
            </div>
          );
        })()}
        {[...new Set<Slot>([...requiredSlots(activeType(cap), cap.values), ...ALL_SLOTS.filter((x) => x !== "wide" && cap.photos.some((p) => p.slot === x)), ...(cap.photos.some((p) => p.slot === "wide") ? (["wide"] as Slot[]) : [])])].map((s) => {
          const ref = cap.photos.find((p) => p.slot === s);
          return (
            <div key={s} className="ph-ev" data-testid={`rv-photo-${s}`}>
              <p className="font-semibold">{t(...SLOT_LABEL[s])}</p>
              {ref ? (
                <>
                  {urls[s] ? <PhotoViewer src={urls[s]!} alt={t(...SLOT_LABEL[s])} testId={`rv-view-${s}`} caption={<><p className="font-semibold">{caption(s, ref.unit)}</p><p>{photoNote(ref)}</p></>} /> : <p className="ap-muted">{photoErr ? t("Could not read this photo on this device.", "No se pudo leer esta foto en este dispositivo.") : t("Loading photo…", "Cargando foto…")}</p>}
                  <p className="font-semibold" data-testid={`rv-caption-${s}`}>{caption(s, ref.unit)}</p>
                  <p className="ap-muted text-sm">{photoNote(ref)}</p>
                </>
              ) : <p className="ap-next">{t("No photo captured", "Sin foto capturada")}</p>}
            </div>
          );
        })}
      </section>

      {extra.length > 0 && (
        <section className="ap-card" data-testid="review-extra">
          <h2 className="ap-h2">{t("Other captured details", "Otros datos capturados")}</h2>
          <p className="ap-muted">{t("Saved as entered; they match no field of this draft. Kept as evidence.", "Guardados tal como se ingresaron; no coinciden con ningún campo de este borrador. Se conservan como evidencia.")}</p>
          <ul>
            {extra.map(([k, v]) => (
              <li key={k} className="ap-chk" style={{ display: "grid", gap: ".15rem" }}>
                <span className="ap-muted">{k}</span><strong>{v}</strong>
                <span className="ap-muted text-sm">{t("Entered by the tech during capture · not yet confirmed", "Ingresado por el técnico durante la captura · sin confirmar")}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Link to={p("/jobs")} className="ap-btn ghost">{t("Back to Jobs", "Volver a Trabajos")}</Link>
      {isDemoReview && (
        <section className="ap-card" data-testid="demo-early-access" aria-labelledby="dea-h">
          <h2 className="ap-h2" id="dea-h">{t("Want this for your crew?", "¿Quiere esto para su equipo?")}</h2>
          <p className="ap-muted">{t("Which missing detail sends a job back to your crew most often? Tell us on the early access form, or keep exploring the demo.", "¿Qué dato que falta devuelve más trabajos a su equipo? Cuéntenos en el formulario de acceso anticipado, o siga explorando la demo.")}</p>
          <Link to="/" hash="pilot" className="ap-btn primary" data-testid="demo-early-access-link">{t("Get Early Access", "Obtener acceso anticipado")}</Link>
        </section>
      )}
    </AppPage>
  );
}
