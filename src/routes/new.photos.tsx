import { CoreGate } from "../components/core-offer";
import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { StepShell } from "../components/step-shell";
import { useLang } from "../lib/lang";
import { useCorePath, useDemo } from "../components/demo";
import { sendOfficePacket } from "../lib/packet";
import { clearDraftJobId, draftJobId, syncPhotos } from "../lib/photo-sync";
import { backend } from "../lib/backend";
import { Input } from "../components/ui/input";
import { readDraftValues } from "../lib/job-draft";
import { JOB_ID, loadPhotos, usePhotos, type Slot } from "../lib/photos";
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

/** Demo handoff ID: letters, digits and hyphens, kept as text so leading zeros stay (e.g. TECH-007, 00412). */
const TECH_ID = /^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$/;
const SAMPLE_TECH_ID = "TECH-007";

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
  const demo = useDemo();
  const [employeeId, setEmployeeId] = useState("");
  const [sendErr, setSendErr] = useState(false);
  const [idErr, setIdErr] = useState<"" | "empty" | "chars">("");
  const [stillUp, setStillUp] = useState<number | null>(null);
  const waiting = demo ? pending : (stillUp ?? pending);
  // Core: keep saving photos to the database in the background so Finish has nothing left to wait for.
  useEffect(() => {
    if (demo || pending === 0) return;
    let live = true;
    syncPhotos(draftJobId()).then((n) => { if (live) setStillUp(n); });
    return () => { live = false; };
  }, [demo, pending]);
  useEffect(() => { if (!demo && pending === 0) setStillUp(null); }, [demo, pending]);
  async function finish() {
    setBusy(true); setFailed(false); setSendErr(false);
    if (demo) {
      const tech = employeeId.trim();
      const problem = !tech ? "empty" : TECH_ID.test(tech) && tech.length <= 40 ? "" : "chars";
      setIdErr(problem);
      if (problem) {
        setBusy(false);
        const el = document.getElementById("emp-id");
        el?.scrollIntoView({ block: "center" }); el?.focus({ preventScroll: true });
        return;
      }
      const id = await finishCapture(undefined, tech);
      setBusy(false);
      if (!id) return setFailed(true);
      nav({ to: p("/jobs/sample-job"), search: { saved: "1", done: id } as never });
      return;
    }
    const jobId = draftJobId();
    const left = await syncPhotos(jobId);
    setStillUp(left);
    if (left > 0) { setBusy(false); return; }
    try {
      const { data: sess } = await backend.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) throw new Error("auth");
      const local = await loadPhotos(JOB_ID);
      const values = readDraftValues();
      const formDefaults: Record<string, string> = {};
      for (const k of ["type", "work"]) if (!(k in values)) formDefaults[k] = k === "type" ? "Heat pump change-out" : "Heat-pump change-out, same pad, left side yard";
      const r = await sendOfficePacket({ data: { token, jobId, employeeId, values, formDefaults, slots: local.map((x) => x.slot) } });
      if (!r.ok) { setStillUp(r.waiting); setBusy(false); return; }
    } catch { setBusy(false); setSendErr(true); return; }
    const id = await finishCapture(jobId);
    setBusy(false);
    if (!id) return setFailed(true);
    clearDraftJobId();
    nav({ to: p("/jobs/sample-job"), search: { saved: "1", done: id } as never });
  }
  return (
    <StepShell n={5} title={["Photos", "Fotos"]} sub={["Step 5 of 5 · Evidence photos", "Paso 5 de 5 · Fotos de evidencia"]} back="/new/checks" action={<>
        {!demo && sendErr && <p role="alert" className="cx-err" data-testid="send-error">{t("Could not send the packet to the office. Your job is still editable: try Finish again.", "No se pudo enviar el paquete a la oficina. Su trabajo sigue editable: intente Finalizar de nuevo.")}</p>}
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
      {demo && (
        <div className="ap-field" data-testid="tech-id-field">
          <label htmlFor="emp-id">{t("Employee ID or technician unit number (required)", "ID de empleado o número de unidad del técnico (obligatorio)")}</label>
          <Input id="emp-id" value={employeeId} onChange={(e) => { setEmployeeId(e.target.value); if (idErr) setIdErr(""); }} maxLength={40} autoComplete="off" autoCapitalize="characters" spellCheck={false} inputMode="text" aria-invalid={idErr ? true : undefined} aria-describedby={idErr ? "emp-id-err" : "emp-id-hint"} data-testid="employee-id" />
          {idErr ? (
            <p id="emp-id-err" role="alert" className="cx-err" data-testid="employee-id-error">{idErr === "empty"
              ? t("Enter your Employee ID or technician unit number before Finish.", "Ingrese su ID de empleado o número de unidad del técnico antes de Finalizar.")
              : t("Use letters, numbers and hyphens only, for example TECH-007.", "Use solo letras, números y guiones, por ejemplo TECH-007.")}</p>
          ) : (
            <p id="emp-id-hint" className="cx-note">{t("Letters and numbers; leading zeros are kept. Shown to the office under Submitted by.", "Letras y números; los ceros a la izquierda se conservan. La oficina lo ve en Enviado por.")}</p>
          )}
          <button type="button" className="ap-btn ghost" data-testid="employee-id-sample" onClick={() => { setEmployeeId(SAMPLE_TECH_ID); setIdErr(""); }}>{t(`Use sample ${SAMPLE_TECH_ID}`, `Usar muestra ${SAMPLE_TECH_ID}`)}</button>
        </div>
      )}
      {!demo && (
        <div className="ap-field">
          <label htmlFor="emp-id">{t("Company employee ID (optional)", "ID de empleado de la empresa (opcional)")}</label>
          <Input id="emp-id" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} maxLength={40} autoComplete="off" data-testid="employee-id" />
        </div>
      )}
      {demo ? (
        <>
          <p className="ph-pend" data-testid="pending-count">{t(`${pending} photo(s) waiting to upload`, `${pending} foto(s) esperando para subir`)}</p>
          <p className="cx-note">{t("Photos are saved on this device only. Uploading is not connected in this practice version.", "Las fotos se guardan solo en este dispositivo. La subida no está conectada en esta versión de práctica.")}</p>
        </>
      ) : (
        <>
          <p className="ph-pend" data-testid="pending-count" role="status">{waiting > 0 ? t(`${waiting} photo(s) still uploading`, `${waiting} foto(s) todavía subiendo`) : t("All photos are saved.", "Todas las fotos están guardadas.")}</p>
          <p className="cx-note">{t("Finish sends one private packet to the office once every photo is saved. It is for office review only, not permit filing. Draft, not a guarantee of compliance. Contractor review and signature required.", "Finalizar envía un paquete privado a la oficina cuando todas las fotos estén guardadas. Es solo para revisión de oficina, no para presentar el permiso. Borrador, no garantiza el cumplimiento. Se requiere revisión y firma del contratista.")}</p>
        </>
      )}
    </StepShell>
  );
}
