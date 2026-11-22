import { CoreGate } from "../components/core-offer";
import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { StepShell } from "../components/step-shell";
import { useLang } from "../lib/lang";
import { useCorePath } from "../components/demo";
import { usePhotos, type Slot } from "../lib/photos";
import { useDraft } from "../lib/job-draft";
import { finishCapture, syncCapturePhotos, useCaptured } from "../lib/captured";
import { useEffect, useState } from "react";
import { PhotoSlot } from "../components/photo-slot";

export const Route = createFileRoute("/new/photos")({
  head: () => ({ meta: [{ title: "Photos — PermitDraft" }, { name: "description", content: "Step 5 of 5: evidence photos." }] }),
  validateSearch: (s: Record<string, unknown>): { fix?: string; slot?: string; rule?: string } => {
    const str = (v: unknown) => (typeof v === "string" && v ? v : undefined);
    return { fix: str(s.fix), slot: str(s.slot), rule: str(s.rule) };
  },
  component: () => <CoreGate><Photos /></CoreGate>,
});

const SLOTS: [Slot, string, string][] = [
  ["plate", "Data plate (model and serial)", "Placa de datos (modelo y serie)"],
  ["outdoor", "Outdoor unit with left side yard and clearance", "Unidad exterior con patio lateral izquierdo y espacio libre"],
  ["gauge", "Refrigerant gauge or meter reading", "Lectura del manómetro o medidor de refrigerante"],
];

const WIDE: [string, string] = ["Whole unit, wide shot", "Unidad completa, foto general"];

export function Photos() {
  const s = useSearch({ strict: false }) as { fix?: string; slot?: string; rule?: string };
  return s.fix ? <SavedJobPhoto id={s.fix} slot={s.slot} rule={s.rule} /> : <NewPhotos />;
}

/** Opened from a saved job's NEEDED photo row: only that slot, stored under the job's own scoped key. */
function SavedJobPhoto({ id, slot, rule }: { id: string; slot?: string; rule?: string }) {
  const { t } = useLang();
  const p = useCorePath();
  const all = useCaptured();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const { photos, loadError } = usePhotos(id);
  const cap = all.find((c) => c.id === id);
  const row = SLOTS.find(([k]) => k === slot);
  const back = (
    <Link to={p("/permit/draft/$id")} params={{ id } as never} hash={rule ? `need-${rule}` : undefined} className="ap-btn primary" data-testid="back-to-draft">{t("Back to draft", "Volver al borrador")}</Link>
  );
  if (!cap || !row) {
    return (
      <StepShell n={5} title={["Photos", "Fotos"]} sub={["Step 5 of 5 · Evidence photos", "Paso 5 de 5 · Fotos de evidencia"]} back="/jobs">
        <p className="ap-muted" data-testid="fix-photo-missing">{!mounted ? t("Loading…", "Cargando…") : !cap ? t("This captured job is not saved on this device.", "Este trabajo capturado no está guardado en este dispositivo.") : t("That photo row does not exist.", "Esa fila de foto no existe.")}</p>
      </StepShell>
    );
  }
  const [k, en, es] = row;
  return (
    <StepShell n={5} title={["Photos", "Fotos"]} sub={["Step 5 of 5 · Evidence photos", "Paso 5 de 5 · Fotos de evidencia"]} back="/jobs" fixBar={<div className="cx-actions" data-testid="fix-photo-bar">{back}</div>}>
      <p className="cx-note" data-testid="fix-photo-note">{t("Adding a photo to a saved job. Only this photo changes; everything else stays as captured.", "Agregando una foto a un trabajo guardado. Solo cambia esta foto; lo demás queda como se capturó.")}</p>
      <div className="cx-shot" data-testid={`fix-photo-${k}`}>
        <div className="cx-shot-top">
          <span>{t(en, es)}</span>
          <strong className={photos[k] ? "cx-ok" : "cx-need"}>{photos[k] ? t("Attached", "Adjunta") : t("Required", "Requerida")}</strong>
        </div>
        <PhotoSlot slot={k} job={id} onChanged={() => syncCapturePhotos(id).then(() => {})} label={[en, es]} photo={photos[k]} takeLabel={["Add photo", "Agregar foto"]} tagUnit={k === "plate"} />
      </div>
      {loadError && <p role="alert" className="cx-err">{t("Could not read saved photos on this device.", "No se pudieron leer las fotos guardadas en este dispositivo.")}</p>}
      <p className="cx-note">{t("Photos are saved on this device only. Uploading is not connected in this practice version.", "Las fotos se guardan solo en este dispositivo. La subida no está conectada en esta versión de práctica.")}</p>
    </StepShell>
  );
}

function NewPhotos() {
  const { t } = useLang();
  const p = useCorePath();
  useDraft(5);
  const { photos, pending, loadError } = usePhotos();
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  async function finish() {
    setBusy(true); setFailed(false);
    const id = await finishCapture();
    setBusy(false);
    if (!id) return setFailed(true);
    nav({ to: p("/jobs/sample-job"), search: { saved: "1", done: id } as never });
  }
  return (
    <StepShell n={5} title={["Photos", "Fotos"]} sub={["Step 5 of 5 · Evidence photos", "Paso 5 de 5 · Fotos de evidencia"]} back="/new/checks" action={<>
        {failed && <p role="alert" className="cx-err" data-testid="finish-error">{t("Could not save this job on this device. Nothing was cleared: your capture is still here. Try Finish again.", "No se pudo guardar este trabajo en este dispositivo. No se borró nada: su captura sigue aquí. Intente Finalizar de nuevo.")}</p>}
        <button type="button" onClick={finish} disabled={busy} className="ap-btn primary" data-testid="finish">{busy ? t("Saving…", "Guardando…") : t("Finish", "Finalizar")}</button>
      </>}>
      {SLOTS.map(([k, en, es]) => {
        const ok = !!photos[k];
        return (
          <div key={k} className="cx-shot">
            <div className="cx-shot-top">
              <span>{t(en, es)}</span>
              <strong className={ok ? "cx-ok" : "cx-need"}>{ok ? t("Attached", "Adjunta") : t("Required", "Requerida")}</strong>
            </div>
            <PhotoSlot slot={k} label={[en, es]} photo={photos[k]} takeLabel={["Add photo", "Agregar foto"]} tagUnit={k === "plate"} />
          </div>
        );
      })}
      <div className="cx-shot" data-testid="wide-shot">
        <div className="cx-shot-top">
          <span>{t("Whole unit, wide shot (optional)", "Unidad completa, foto general (opcional)")}</span>
          <strong className={photos.wide ? "cx-ok" : "ap-muted"}>{photos.wide ? t("Attached", "Adjunta") : t("Optional", "Opcional")}</strong>
        </div>
        <PhotoSlot slot="wide" label={WIDE} photo={photos.wide} takeLabel={["Add wide photo", "Agregar foto general"]} tagUnit />
      </div>
      {loadError && <p role="alert" className="cx-err">{t("Could not read saved photos on this device.", "No se pudieron leer las fotos guardadas en este dispositivo.")}</p>}
      <p className="ph-pend" data-testid="pending-count">{t(`${pending} photo(s) waiting to upload`, `${pending} foto(s) esperando para subir`)}</p>
      <p className="cx-note">{t("Photos are saved on this device only. Uploading is not connected in this practice version.", "Las fotos se guardan solo en este dispositivo. La subida no está conectada en esta versión de práctica.")}</p>
    </StepShell>
  );
}
