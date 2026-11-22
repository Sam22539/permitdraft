import { useState } from "react";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { flagCorrection, saveCorrection, type Correction } from "../lib/captured";
import { useLang } from "../lib/lang";

const stamp = (n: number, lang: "en" | "es") => new Date(n).toLocaleString(lang === "es" ? "es-US" : "en-US", { dateStyle: "medium", timeStyle: "short" });

/** The status line and evidence for a saved correction. Shared by the review draft and Office handoff. */
export function CorrectionStatus({ c, testId }: { c: Correction; testId?: string }) {
  const { t, lang } = useLang();
  return (
    <span className="cr-status" data-testid={testId}>
      <strong data-testid={testId && `${testId}-state`}>{c.flaggedAt ? t("Corrected · Awaiting office review", "Corregido · Esperando revisión de oficina") : t("Corrected · Not yet marked for office review", "Corregido · Aún no marcado para revisión de oficina")}</strong>
      <span>{t("Corrected value", "Valor corregido")}: <strong data-testid={testId && `${testId}-value`}>{c.value}</strong></span>
      <span>{t("Evidence", "Evidencia")}: <span data-testid={testId && `${testId}-evidence`}>{c.evidence}</span></span>
      <span className="ap-muted text-sm">{c.flaggedAt
        ? t(`Marked ${stamp(c.flaggedAt, lang)} · not confirmed or approved by a reviewer`, `Marcado ${stamp(c.flaggedAt, lang)} · sin confirmar ni aprobar por un revisor`)
        : t(`Saved ${stamp(c.savedAt, lang)} · not confirmed or approved by a reviewer`, `Guardado ${stamp(c.savedAt, lang)} · sin confirmar ni aprobar por un revisor`)}</span>
    </span>
  );
}

/** Save a correction for one captured item, with its evidence, then mark it for office review. */
export function CorrectionControls({ capId, field, label, current, c }: { capId: string; field: string; label: string; current: string; c?: Correction }) {
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
      {c && !open && <CorrectionStatus c={c} testId={`cr-status-${field}`} />}
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
          <button type="button" className="ap-btn ghost" onClick={() => { setValue(c?.value ?? current); setEvidence(c?.evidence ?? ""); setOpen(true); }} data-testid={`cr-edit-${field}`}>{c ? t("Edit correction", "Editar corrección") : t("Correct this item", "Corregir este dato")}</button>
        </div>
      )}
      {err && <p className="ap-next" role="alert">{err}</p>}
    </div>
  );
}
