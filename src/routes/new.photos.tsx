import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { StepShell } from "../components/step-shell";
import { useLang } from "../lib/lang";
import { usePhotos, type Slot } from "../lib/photos";
import { useDraft } from "../lib/job-draft";
import { finishCapture } from "../lib/captured";
import { useState } from "react";
import { PhotoSlot } from "../components/photo-slot";

export const Route = createFileRoute("/new/photos")({
  head: () => ({ meta: [{ title: "Photos — PermitDraft" }, { name: "description", content: "Step 5 of 5: evidence photos." }] }),
  component: Photos,
});

const SLOTS: [Slot, string, string][] = [
  ["plate", "Data plate (model and serial)", "Placa de datos (modelo y serie)"],
  ["outdoor", "Outdoor unit with left side yard and clearance", "Unidad exterior con patio lateral izquierdo y espacio libre"],
  ["gauge", "Refrigerant gauge or meter reading", "Lectura del manómetro o medidor de refrigerante"],
];

function Photos() {
  const { t } = useLang();
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
    nav({ to: "/jobs/hp-1187", search: { saved: "1", done: id } });
  }
  return (
    <StepShell n={5} title={["Photos", "Fotos"]} sub={["Step 5 of 5 · Evidence photos", "Paso 5 de 5 · Fotos de evidencia"]} back="/new/checks">
      {SLOTS.map(([k, en, es]) => {
        const ok = !!photos[k];
        return (
          <div key={k} className="ap-card">
            <div className="ap-chk" style={{ gap: "1rem" }}>
              <span style={{ flex: 1 }}>{t(en, es)}</span>
              <strong className={ok ? "ap-muted" : "ap-next"}>{ok ? t("Attached", "Adjunta") : t("Required", "Requerida")}</strong>
            </div>
            <PhotoSlot slot={k} label={[en, es]} photo={photos[k]} takeLabel={["Add photo", "Agregar foto"]} />
          </div>
        );
      })}
      {loadError && <p role="alert" className="ph-err">{t("Could not read saved photos on this device.", "No se pudieron leer las fotos guardadas en este dispositivo.")}</p>}
      <p className="ph-pend" data-testid="pending-count">{t(`${pending} photo(s) waiting to upload`, `${pending} foto(s) esperando para subir`)}</p>
      <p className="ap-muted">{t("Photos are saved on this device only. Uploading is not connected in this practice version.", "Las fotos se guardan solo en este dispositivo. La subida no está conectada en esta versión de práctica.")}</p>
      {failed && <p role="alert" className="ph-err" data-testid="finish-error">{t("Could not save this job on this device. Nothing was cleared: your capture is still here. Try Finish again.", "No se pudo guardar este trabajo en este dispositivo. No se borró nada: su captura sigue aquí. Intente Finalizar de nuevo.")}</p>}
      <button type="button" onClick={finish} disabled={busy} className="ap-btn primary" data-testid="finish">{t("Finish", "Finalizar")}</button>
    </StepShell>
  );
}
