import { ResourceLink } from "../components/resource-link";
import { CoreGate } from "../components/core-offer";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useCorePath } from "../components/demo";
import { useEffect, useState } from "react";
import { AppPage } from "../components/app-shell";
import { PhotoViewer } from "../components/photo-viewer";
import { useCaptured } from "../lib/captured";
import { activeType, captureSummary, DUCT_LABEL, fieldSets, READING_UNIT_KEY, readingUnit, uncategorized } from "../lib/capture-fields";
import { useLang } from "../lib/lang";
import { CoverageLine, ReadinessCard, WhyDetails } from "../components/readiness";
import { evaluateCapture, useOfficeJurisdictions } from "../lib/rules/use-evaluation";
import { loadPhotos, SLOTS, type Slot } from "../lib/photos";
import { CopyRequest } from "../components/copy-request";
import { copyRequest } from "../lib/copy-requests";
import { CorrectionControls } from "../components/correction";

export const Route = createFileRoute("/permit/draft/$id")({
  head: () => ({ meta: [{ title: "Review draft — PermitDraft" }, { name: "description", content: "Review draft built from what was captured on the job, each value with where it came from." }] }),
  component: () => <CoreGate><Review /></CoreGate>,
});

const SLOT_LABEL: Record<Slot, [string, string]> = {
  plate: ["Data plate (model and serial)", "Placa de datos (modelo y serie)"],
  outdoor: ["Outdoor unit with left side yard and clearance", "Unidad exterior con patio lateral izquierdo y espacio libre"],
  wide: ["Whole unit, wide shot (optional)", "Unidad completa, foto general (opcional)"],
  gauge: ["Refrigerant gauge or meter reading", "Lectura del manómetro o medidor de refrigerante"],
};

export function Review() {
  const { id } = useParams({ strict: false }) as { id: string };
  const { t, lang } = useLang();
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
    const kind = s === "plate" ? t("Label close-up", "Primer plano de la etiqueta") : s === "wide" ? t("Whole-unit photo", "Foto de la unidad completa") : t("Photo", "Foto");
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
  const flagged = Object.values(corr).filter((c) => c.flaggedAt).length;
  const jobCtx: [string, string] = ev.workflow ? [ev.workflow.name[0], ev.workflow.name[1]] : ["", ""];

  return (
    <AppPage bottom>
      <h1 className="text-3xl">{t("Review draft", "Borrador de revisión")}</h1>
      <p className="ap-muted">{sm.addr} · {activeType(cap) || sm.equip}</p>
      <p className="rd-notice" data-testid="draft-notice">{t("Draft only. Not a guarantee of compliance. Contractor review and signature required.", "Solo borrador. No garantiza el cumplimiento. Se requiere revisión y firma del contratista.")}</p>
      <ReadinessCard ev={ev} capId={cap.id} jur={jurs[cap.id] ?? ""} />
      <CoverageLine ev={ev} />
      <ResourceLink stage="permit" />
      <p className="ap-muted">{t(`Finished ${when}. Practice job, not connected to real permit filing. Every value below is exactly what was captured; nothing here is confirmed by a reviewer yet.`, `Finalizado ${when}. Trabajo de práctica, no conectado a la presentación real de permisos. Cada valor es exactamente lo capturado; nada está confirmado por un revisor todavía.`)}</p>
      <p className="ap-next" data-testid="review-missing">{sm.missing > 0 ? t(`${sm.missing} item(s) not captured`, `${sm.missing} dato(s) sin capturar`) : t("Nothing missing from capture", "No falta nada de la captura")}</p>
      <p className="ap-next" data-testid="review-status">{ev.officeReview.ready
        ? t("Ready for office review. Every required detail is captured, but nothing is confirmed by a reviewer yet.", "Listo para revisión de oficina. Cada dato obligatorio está capturado, pero ningún revisor ha confirmado nada todavía.")
        : t(`Not ready for office review: ${ev.missing.length} required item(s) still missing: ${ev.missing.map((m) => m.text[0]).join(", ")}`, `No listo para revisión de oficina: faltan ${ev.missing.length} dato(s) obligatorio(s): ${ev.missing.map((m) => m.text[1]).join(", ")}`)}</p>
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
          <div key={r.ruleId} className="rd-item" data-testid={`check-${r.ruleId}`}>
            <strong>{t(...r.text)} · {r.status === "met" ? t("Captured", "Capturado") : t("NEEDED", "NECESARIO")}</strong>
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
                <span className="ap-muted">{t(...f.label)}</span>
                <strong>{shown || dash}</strong>
                {READING_UNIT_KEY[f.key] && <span className="font-semibold" data-testid={`rv-unit-${f.key}`}>{t(...readingUnit(cap.values, f.key))}</span>}
                <span className="ap-muted text-sm">{prov}</span>
                {f.kind !== "check" && (shown || corr[f.key]) && <CorrectionControls capId={cap.id} field={f.key} label={t(...f.label)} current={has ? String(raw) : ""} c={corr[f.key]} />}
              </li>
            );
          })}
        </ul>
        </details>
      </section>

      <section className="ap-card" data-testid="review-photos">
        <h2 className="ap-h2">{t("Photos", "Fotos")}</h2>
        {[...SLOTS, ...(cap.photos.some((p) => p.slot === "wide") ? (["wide"] as Slot[]) : [])].map((s) => {
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
    </AppPage>
  );
}
