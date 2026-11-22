import { useState } from "react";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { acceptCorrection, flagCorrection, returnCorrection, saveCorrection, type Correction } from "../lib/captured";
import { useLang } from "../lib/lang";

const stamp = (n: number, lang: "en" | "es") => new Date(n).toLocaleString(lang === "es" ? "es-US" : "en-US", { dateStyle: "medium", timeStyle: "short" });

/** The status line and evidence for a saved correction. Shared by the review draft and Office handoff. */
export function CorrectionStatus({ c, testId, original }: { c: Correction; testId?: string; original?: string }) {
  const { t, lang } = useLang();
  const d = c.decision;
  const state = d?.status === "accepted" ? t("Accepted by office review", "Aceptado por revisión de oficina")
    : d?.status === "returned" ? t("Returned · Correction unresolved until resubmitted", "Devuelto · Corrección sin resolver hasta reenviarla")
    : c.flaggedAt ? t("Corrected · Awaiting office review", "Corregido · Esperando revisión de oficina")
    : t("Corrected · Not yet marked for office review", "Corregido · Aún no marcado para revisión de oficina");
  const orig = d?.status === "accepted" ? d.original : original;
  return (
    <span className="cr-status" data-testid={testId}>
      <strong data-testid={testId && `${testId}-state`}>{state}</strong>
      {(orig !== undefined) && <span>{t("Original value", "Valor original")}: <strong data-testid={testId && `${testId}-original`}>{orig === null || orig === "" ? t("Not captured", "No capturado") : orig}</strong></span>}
      <span>{d?.status === "accepted" ? t("Applied value", "Valor aplicado") : t("Proposed value", "Valor propuesto")}: <strong data-testid={testId && `${testId}-value`}>{c.value}</strong></span>
      <span>{t("Proposed evidence", "Evidencia propuesta")}: <span data-testid={testId && `${testId}-evidence`}>{c.evidence}</span></span>
      {d && <span data-testid={testId && `${testId}-decision`}>{t("Decision reason", "Motivo de la decisión")}: {d.reason} <span className="ap-muted text-sm">· {d.reviewer} · {stamp(d.at, lang)}</span></span>}
      {!d && c.lastReturn && <span data-testid={testId && `${testId}-lastreturn`}>{t("Previously returned", "Devuelto antes")}: {c.lastReturn.reason} <span className="ap-muted text-sm">· {c.lastReturn.reviewer} · {stamp(c.lastReturn.at, lang)}</span></span>}
      <span className="ap-muted text-sm">{d ? t("Decision saved on this device. Acceptance applies the value only; it does not mark the job ready or approve filing.", "Decisión guardada en este dispositivo. Aceptar solo aplica el valor; no marca el trabajo como listo ni aprueba la presentación.")
        : c.flaggedAt
        ? t(`Marked ${stamp(c.flaggedAt, lang)} · not confirmed or approved by a reviewer`, `Marcado ${stamp(c.flaggedAt, lang)} · sin confirmar ni aprobar por un revisor`)
        : t(`Saved ${stamp(c.savedAt, lang)} · not confirmed or approved by a reviewer`, `Guardado ${stamp(c.savedAt, lang)} · sin confirmar ni aprobar por un revisor`)}</span>
    </span>
  );
}

/** Office reviewer's Accept / Return for a correction awaiting office review. A reason is required for both. */
function ReviewDecision({ capId, field, c }: { capId: string; field: string; c: Correction }) {
  const { t } = useLang();
  const [reason, setReason] = useState("");
  const [err, setErr] = useState("");
  const id = `cr-r-${field}`;
  const need = t("Enter a reason for this decision.", "Ingrese un motivo para esta decisión.");
  const accept = () => {
    if (!reason.trim()) { setErr(need); return; }
    const r = acceptCorrection(capId, field, reason);
    setErr(r === "ok" ? "" : r === "invalid" ? t("The corrected value does not pass this field's validation. Return it instead.", "El valor corregido no pasa la validación de este campo. Devuélvalo.") : t("Could not save on this device. Nothing was changed.", "No se pudo guardar en este dispositivo. No se cambió nada."));
  };
  const ret = () => {
    if (!reason.trim()) { setErr(need); return; }
    setErr(returnCorrection(capId, field, reason) ? "" : t("Could not save on this device. Nothing was changed.", "No se pudo guardar en este dispositivo. No se cambió nada."));
  };
  void c;
  return (
    <div className="cr-form" data-testid={`cr-review-${field}`}>
      <div className="ap-field">
        <label htmlFor={id}>{t("Reviewer reason (required)", "Motivo del revisor (obligatorio)")}</label>
        <Textarea id={id} value={reason} onChange={(e) => setReason(e.target.value)} data-testid={`cr-reason-${field}`} />
      </div>
      <div className="cr-actions">
        <button type="button" className="ap-btn primary" onClick={accept} data-testid={`cr-accept-${field}`}>{t("Accept correction", "Aceptar corrección")}</button>
        <button type="button" className="ap-btn ghost" onClick={ret} data-testid={`cr-return-${field}`}>{t("Return correction", "Devolver corrección")}</button>
      </div>
      {err && <p className="ap-next" role="alert" data-testid={`cr-review-err-${field}`}>{err}</p>}
    </div>
  );
}

/** Save a correction for one captured item, with its evidence, then mark it for office review. */
export function CorrectionControls({ capId, field, label, current, c, original }: { capId: string; field: string; label: string; current: string; c?: Correction; original?: string }) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(c?.value ?? current);
  const [evidence, setEvidence] = useState(c?.evidence ?? "");
  const [err, setErr] = useState("");
  const id = `cr-${field}`;

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() || !evidence.trim()) { setErr(t("Enter the corrected value and the evidence for it.", "Ingrese el valor corregido y la evidencia.")); return; }
    if (!saveCorrection(capId, field, value, evidence)) { setErr(t("Could not save on this device. Nothing was changed.", "No se pudo guardar en este dispositivo. No se cambió nada.")); return; }
    setErr(""); setOpen(false);
  };
  const mark = () => {
    if (!flagCorrection(capId, field)) setErr(t("Could not save on this device. Nothing was changed.", "No se pudo guardar en este dispositivo. No se cambió nada."));
    else setErr("");
  };

  return (
    <div className="cr-box" data-testid={`cr-${field}`}>
      {c && !open && <CorrectionStatus c={c} testId={`cr-status-${field}`} original={original} />}
      {c && !open && c.flaggedAt && !c.decision && <ReviewDecision capId={capId} field={field} c={c} />}
      {open ? (
        <form className="cr-form" onSubmit={save} data-testid={`cr-form-${field}`}>
          <div className="ap-field">
            <label htmlFor={`${id}-v`}>{t(`Corrected value: ${label}`, `Valor corregido: ${label}`)}</label>
            <Input id={`${id}-v`} value={value} onChange={(e) => setValue(e.target.value)} autoComplete="off" data-testid={`cr-value-${field}`} />
          </div>
          <div className="ap-field">
            <label htmlFor={`${id}-e`}>{t("Evidence (what shows the corrected value)", "Evidencia (lo que muestra el valor corregido)")}</label>
            <Textarea id={`${id}-e`} value={evidence} onChange={(e) => setEvidence(e.target.value)} placeholder={t("e.g. Data plate photo shows serial 1824E21046", "p. ej. La foto de la placa muestra la serie 1824E21046")} data-testid={`cr-evidence-${field}`} />
          </div>
          <div className="cr-actions">
            <button type="submit" className="ap-btn primary" data-testid={`cr-save-${field}`}>{t("Save correction", "Guardar corrección")}</button>
            <button type="button" className="ap-btn ghost" onClick={() => { setOpen(false); setErr(""); }}>{t("Cancel", "Cancelar")}</button>
          </div>
        </form>
      ) : (
        <div className="cr-actions">
          {c && !c.flaggedAt && <button type="button" className="ap-btn primary" onClick={mark} data-testid={`cr-mark-${field}`}>{t("Mark for office review", "Marcar para revisión de oficina")}</button>}
          {c?.decision?.status !== "accepted" && <button type="button" className="ap-btn ghost" onClick={() => { setValue(c?.value ?? current); setEvidence(c?.evidence ?? ""); setOpen(true); }} data-testid={`cr-edit-${field}`}>{c ? (c.decision?.status === "returned" ? t("Edit and resubmit", "Editar y reenviar") : t("Edit correction", "Editar corrección")) : t("Correct this item", "Corregir este dato")}</button>}
        </div>
      )}
      {err && <p className="ap-next" role="alert">{err}</p>}
    </div>
  );
}
