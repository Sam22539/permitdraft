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
import { applicableChecks, cleanValues, furnaceAnswers, requiredSlots } from "../lib/capture-fields";
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

/** Final checks left unticked at Finish are handed to the Final checks step to show. */
export const CHECK_MSG_KEY = "permitdraft-unticked-checks";
const CHECK_NAMES: Record<string, [string, string]> = {
  c1: ["Outdoor unit location recorded", "Ubicación de la unidad exterior registrada"],
  c2: ["Refrigerant charge reading taken", "Lectura de carga de refrigerante tomada"],
  c3: ["Refrigerant type matches data plate", "El tipo de refrigerante coincide con la placa"],
  c4: ["Equipment label photo readable", "Foto de la etiqueta del equipo legible"],
};

const WIDE: [string, string] = ["Whole unit, wide shot", "Unidad completa, foto general"];

/** Core keeps the typed employee ID for the unfinished job, so going Back and returning does not lose it. */
const EMP_KEY = "permitdraft-core-employee-id";
const readEmp = () => { try { return sessionStorage.getItem(EMP_KEY) ?? ""; } catch { return ""; } };
const writeEmp = (v: string) => { try { if (v) sessionStorage.setItem(EMP_KEY, v); else sessionStorage.removeItem(EMP_KEY); } catch { /* ignore */ } };

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
      <p className="cx-note">{t("Photos are saved to this job as you add them.", "Las fotos se guardan en este trabajo al agregarlas.")}</p>
    </StepShell>
  );
}

function NewPhotos() {
  const { t } = useLang();
  const p = useCorePath();
  const dr = useDraft(5);
  const { photos, pending, loadError, ready } = usePhotos();
  const dvals: Record<string, string> = { type: dr.get("type"), fu_outdoor: dr.get("fu_outdoor"), fu_refrig: dr.get("fu_refrig"), c1: dr.get("c1"), c2: dr.get("c2"), c3: dr.get("c3"), c4: dr.get("c4") };
  const jobType = dvals.type || undefined;
  const isFurn = jobType === "Furnace + coil change-out";
  const REQUIRED = requiredSlots(jobType, dvals);
  const fa = furnaceAnswers(jobType, dvals);
  const ANS_NAME: Record<string, [string, string]> = { fu_outdoor: ["Outdoor unit answer (kept, replaced or not present)", "Respuesta sobre la unidad exterior (conservada, reemplazada o no presente)"], fu_refrig: ["Refrigerant work answer", "Respuesta sobre el trabajo con refrigerante"] };
  const unticked = applicableChecks(jobType, dvals).filter((k) => dvals[k] !== "1");
  const [answersErr, setAnswersErr] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const demo = useDemo();
  const [employeeId, setEmployeeId] = useState("");
  const [sendErr, setSendErr] = useState(false);
  const [idErr, setIdErr] = useState<"" | "empty" | "chars">("");
  const [stillUp, setStillUp] = useState<number | null>(null);
  const waiting = demo ? pending : (stillUp ?? pending);
  // Core: required photos this job has not attached at all, kept apart from attached photos still uploading.
  const [tried, setTried] = useState(false);
  const missing = ready ? REQUIRED.filter((k) => !photos[k]) : [];
  const label = (k: Slot) => { const r = SLOTS.find(([x]) => x === k); return r ? t(r[1], r[2]) : k; };
  useEffect(() => { if (!demo) { const v = readEmp(); if (v) setEmployeeId(v); } }, [demo]);
  // Core: the Employee ID the company admin assigned, read-only here; it goes to the office with the packet automatically.
  const [assignedId, setAssignedId] = useState<string | null>(null);
  useEffect(() => {
    if (demo) return;
    let live = true;
    backend.auth.getSession().then(({ data: s }) => {
      const em = s.session?.user.email?.toLowerCase();
      if (!em) return;
      return Promise.resolve(backend.from("company_members").select("employee_id").eq("email", em).maybeSingle()).then(({ data }) => { if (live) setAssignedId((data?.employee_id as string | null) ?? null); });
    }).catch(() => undefined);
    return () => { live = false; };
  }, [demo]);
  // Core: keep saving photos to the database in the background so Finish has nothing left to wait for.
  useEffect(() => {
    if (demo || pending === 0) return;
    let live = true;
    syncPhotos(draftJobId()).then((n) => { if (live) setStillUp(n); });
    return () => { live = false; };
  }, [demo, pending]);
  useEffect(() => { if (!demo && pending === 0) setStillUp(null); }, [demo, pending]);
  async function finish() {
    setBusy(true); setFailed(false); setSendErr(false); setBlocked(false);
    {
      const dv = readDraftValues();
      const ans = furnaceAnswers(dv.type || undefined, dv);
      if (ans.missing.length > 0 || ans.contradiction) {
        setBusy(false); setAnswersErr(true); setBlocked(true);
        document.getElementById("finish-needs")?.scrollIntoView({ block: "center" });
        return;
      }
      setAnswersErr(false);
      const need = applicableChecks(dv.type || undefined, dv).filter((k) => dv[k] !== "1");
      if (need.length > 0) {
        setBusy(false); setBlocked(true);
        const names = need.map((k) => CHECK_NAMES[k]);
        try { sessionStorage.setItem(CHECK_MSG_KEY, JSON.stringify(names)); } catch { /* ignore */ }
        nav({ to: p("/new/checks"), hash: "final-checks-msg" });
        return;
      }
    }
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
    setTried(true);
    if (missing.length > 0) {
      setBusy(false); setBlocked(true);
      document.getElementById(`shot-${missing[0]}`)?.scrollIntoView({ block: "center" });
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
      const raw0 = readDraftValues();
      const values = cleanValues(raw0.type ?? "Heat pump change-out", raw0);
      const formDefaults: Record<string, string> = {};
      for (const k of ["type", "work"]) if (!(k in values)) formDefaults[k] = k === "type" ? "Heat pump change-out" : "Heat-pump change-out, same pad, left side yard";
      const r = await sendOfficePacket({ data: { token, jobId, employeeId, values, formDefaults, slots: local.map((x) => x.slot) } });
      if (!r.ok) { if (r.answers) setAnswersErr(true); setStillUp(r.waiting); setBusy(false); return; }
    } catch { setBusy(false); setSendErr(true); return; }
    const id = await finishCapture(jobId);
    setBusy(false);
    if (!id) return setFailed(true);
    clearDraftJobId();
    writeEmp("");
    nav({ to: p("/jobs/sample-job"), search: { saved: "1", done: id } as never });
  }
  return (
    <StepShell n={5} title={["Photos", "Fotos"]} sub={["Step 5 of 5 · Evidence photos", "Paso 5 de 5 · Fotos de evidencia"]} back="/new/checks" action={<>
        {!demo && sendErr && <p role="alert" className="cx-err" data-testid="send-error">{t("Could not save the office packet. Your job is still editable: try Finish again.", "No se pudo guardar el paquete de oficina. Su trabajo sigue editable: intente Finalizar de nuevo.")}</p>}
        {failed && <p role="alert" className="cx-err" data-testid="finish-error">{t("Could not save this job on this device. Nothing was cleared: your capture is still here. Try Finish again.", "No se pudo guardar este trabajo en este dispositivo. No se borró nada: su captura sigue aquí. Intente Finalizar de nuevo.")}</p>}
        {(fa.missing.length > 0 || fa.contradiction || unticked.length > 0 || (!demo && ready && missing.length > 0)) && (
          <details id="finish-needs" open={blocked || answersErr} onToggle={(e) => { if (!e.currentTarget.open) setBlocked(false); }} role={answersErr ? "alert" : "status"} className={answersErr ? "cx-err" : "cx-note"} data-testid="finish-needs">
            <summary className="cursor-pointer"><strong>{t("Still needed before Finish", "Falta antes de Finalizar")} ({fa.missing.length + (fa.contradiction ? 1 : 0) + unticked.length + (!demo && ready ? missing.length : 0)})</strong></summary>
            <ul>
              {fa.missing.map((k) => <li key={k}>{t("Answer: " + ANS_NAME[k][0], "Respuesta: " + ANS_NAME[k][1])} <Link to={p("/new/equipment")} className="underline">{t("Equipment step", "Paso Equipo")}</Link></li>)}
              {fa.contradiction && <li>{t("Conflicting answers: outdoor unit not present but refrigerant work done. Change one on the Equipment step.", "Respuestas en conflicto: unidad exterior no presente pero con trabajo de refrigerante. Cambie una en el paso Equipo.")}</li>}
              {unticked.map((k) => <li key={k}><Link to={p("/new/checks")} className="underline">{t("Final check: " + CHECK_NAMES[k][0], "Verificación final: " + CHECK_NAMES[k][1])}</Link></li>)}
              {!demo && ready && missing.map((k) => <li key={k}>{t("Photo: " + label(k), "Foto: " + label(k))}</li>)}
            </ul>
          </details>
        )}
        <button type="button" onClick={finish} disabled={busy} className="ap-btn primary" data-testid="finish">{busy ? t("Saving…", "Guardando…") : t("Finish", "Finalizar")}</button>
      </>}>
      {SLOTS.filter(([k]) => REQUIRED.includes(k) || !!photos[k]).map(([k, en0, es0]) => {
        const [en, es] = isFurn && k === "outdoor" ? ["Replaced outdoor unit, as installed", "Unidad exterior reemplazada, como quedó instalada"] : [en0, es0];
        const needed = REQUIRED.includes(k);
        const ok = !!photos[k];
        const state = !needed ? t("Kept, not required for this job", "Conservada, no requerida para este trabajo") : demo ? (ok ? t("Attached", "Adjunta") : t("Required", "Requerida"))
          : !ok ? (tried ? t("Missing, required", "Falta, requerida") : t("Required", "Requerida"))
          : photos[k]?.uploaded ? t("Saved", "Guardada") : t("Uploading…", "Subiendo…");
        return (
          <div key={k} id={`shot-${k}`} className="cx-shot" data-testid={`shot-${k}`}>
            <div className="cx-shot-top">
              <span>{t(en, es)}</span>
              <strong className={ok ? "cx-ok" : "cx-need"} data-testid={`shot-${k}-state`}>{state}</strong>
            </div>
            <PhotoSlot slot={k} label={[en, es]} photo={photos[k]} takeLabel={["Add photo", "Agregar foto"]} tagUnit={k === "plate"} />
          </div>
        );
      })}
      {isFurn && (
        <p className="cx-note" data-testid="photo-rules-note">
          {dvals.fu_outdoor === "replaced" ? t("Outdoor unit replaced: the outdoor equipment photo is required.", "Unidad exterior reemplazada: la foto del equipo exterior es obligatoria.")
            : dvals.fu_outdoor ? t("No outdoor equipment photo is needed: the outdoor unit was not replaced.", "No se necesita foto del equipo exterior: la unidad exterior no se reemplazó.")
            : t("Outdoor unit answer missing: answer it on the Equipment step.", "Falta la respuesta de la unidad exterior: respóndala en el paso Equipo.")}{" "}
          {dvals.fu_refrig === "yes" ? t("Refrigerant work done: the gauge or meter photo is required.", "Trabajo con refrigerante: la foto del manómetro o medidor es obligatoria.")
            : dvals.fu_refrig ? t("No gauge photo is needed: no refrigerant work was done.", "No se necesita foto del manómetro: no hubo trabajo con refrigerante.")
            : t("Refrigerant work answer missing: answer it on the Equipment step.", "Falta la respuesta sobre refrigerante: respóndala en el paso Equipo.")}
        </p>
      )}
      <div className="cx-shot" data-testid="wide-shot">
        <div className="cx-shot-top">
          <span>{t("Whole unit, wide shot", "Unidad completa, foto general")}</span>
          <strong className={photos.wide ? "cx-ok" : "ap-muted"}>{photos.wide ? t("Attached", "Adjunta") : t("Optional", "Opcional")}</strong>
        </div>
        <PhotoSlot slot="wide" label={WIDE} photo={photos.wide} takeLabel={["Add wide photo", "Agregar foto general"]} tagUnit />
      </div>
      {loadError && <p role="alert" className="cx-err">{t("Could not read saved photos on this device.", "No se pudieron leer las fotos guardadas en este dispositivo.")}</p>}
      {demo && (
        <div className="cx-field" data-testid="tech-id-field">
          <label htmlFor="emp-id">{t("Employee ID (required)", "ID de empleado (obligatorio)")}</label>
          <Input id="emp-id" value={employeeId} onChange={(e) => { setEmployeeId(e.target.value); if (idErr) setIdErr(""); }} maxLength={40} autoComplete="off" autoCapitalize="characters" spellCheck={false} inputMode="text" aria-invalid={idErr ? true : undefined} aria-describedby={idErr ? "emp-id-err" : "emp-id-hint"} data-testid="employee-id" />
          {idErr ? (
            <p id="emp-id-err" role="alert" className="cx-err" data-testid="employee-id-error">{idErr === "empty"
              ? t("Enter your Employee ID before Finish.", "Ingrese su ID de empleado antes de Finalizar.")
              : t("Use letters, numbers and hyphens only, for example TECH-007.", "Use solo letras, números y guiones, por ejemplo TECH-007.")}</p>
          ) : (
            <p id="emp-id-hint" className="cx-note">{t("Letters and numbers; leading zeros are kept. Shown to the office under Submitted by.", "Letras y números; los ceros a la izquierda se conservan. La oficina lo ve en Enviado por.")}</p>
          )}
          <button type="button" className="ap-btn ghost" data-testid="employee-id-sample" onClick={() => { setEmployeeId(SAMPLE_TECH_ID); setIdErr(""); }}>{t(`Use sample ${SAMPLE_TECH_ID}`, `Usar muestra ${SAMPLE_TECH_ID}`)}</button>
        </div>
      )}
      {!demo && assignedId && (
        <div className="ap-field" data-testid="assigned-id">
          <p><strong>{t("Your Employee ID", "Su ID de empleado")}:</strong> <span data-testid="assigned-id-value">{assignedId}</span></p>
          <p className="cx-note">{t("Assigned by your company admin. It goes to the office with this job, with your name and the time.", "Asignado por el administrador de su empresa. Va a la oficina con este trabajo, con su nombre y la hora.")}</p>
        </div>
      )}
      {!demo && !assignedId && (
        <div className="cx-field">
          <label htmlFor="emp-id">{t("Company employee ID (optional)", "ID de empleado de la empresa (opcional)")}</label>
          <Input id="emp-id" value={employeeId} onChange={(e) => { setEmployeeId(e.target.value); writeEmp(e.target.value); }} maxLength={40} autoComplete="off" data-testid="employee-id" />
        </div>
      )}
      {demo ? (
        <>
          <p className="ph-pend" data-testid="pending-count">{t(`${Object.values(photos).filter(Boolean).length} photo(s) saved on this device`, `${Object.values(photos).filter(Boolean).length} foto(s) guardada(s) en este dispositivo`)}</p>
          <p className="cx-note">{t("Photos stay on this device. Nothing is sent anywhere.", "Las fotos se quedan en este dispositivo. No se envía nada a ningún sitio.")}</p>
        </>
      ) : (
        <>
          {tried && missing.length > 0 && (
            <p role="alert" className="cx-err" data-testid="missing-required">{t(`Required photo missing: ${missing.map(label).join("; ")}. Add it before Finish. Nothing was sent.`, `Falta foto requerida: ${missing.map(label).join("; ")}. Agréguela antes de Finalizar. No se envió nada.`)}</p>
          )}
          <p className="ph-pend" data-testid="pending-count" role="status">{waiting > 0 ? t(`${waiting} photo(s) still uploading`, `${waiting} foto(s) todavía subiendo`) : missing.length > 0 ? t(`${REQUIRED.length - missing.length} of ${REQUIRED.length} required photos attached. Attached photos are saved.`, `${REQUIRED.length - missing.length} de ${REQUIRED.length} fotos requeridas adjuntas. Las fotos adjuntas están guardadas.`) : t("All photos are saved.", "Todas las fotos están guardadas.")}</p>
          <p className="cx-note">{t("Finish saves one private packet once every photo is saved, then emails your company's verified office inbox a link to review it. It is for office review only, not permit filing. Draft, not a guarantee of compliance. Contractor review and signature required.", "Finalizar guarda un paquete privado cuando todas las fotos estén guardadas y envía al buzón verificado de la oficina de su empresa un enlace para revisarlo. Es solo para revisión de oficina, no para presentar el permiso. Borrador, no garantiza el cumplimiento. Se requiere revisión y firma del contratista.")}</p>
        </>
      )}
    </StepShell>
  );
}
