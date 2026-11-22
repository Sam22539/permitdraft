import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { PinnedAction } from "./step-shell";
import { useCorePath } from "./demo";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { useLang } from "../lib/lang";
import type { FixInfo } from "../lib/fix-mode";

/** The draft this capture step was opened from, and the field's row in it. */
function useDraftTarget(capId: string | undefined, rule: string | undefined) {
  const p = useCorePath();
  return { to: p("/permit/draft/$id"), params: { id: capId ?? "" }, hash: rule ? `need-${rule}` : undefined };
}

/** Shown on a capture step opened from a draft: the evidence for the value, Save to draft, and Back to draft (no save). */
export function FixBar({ fix, capId, rule }: { fix: FixInfo | null; capId?: string; rule?: string }) {
  const { t } = useLang();
  const nav = useNavigate();
  const [err, setErr] = useState("");
  const dest = useDraftTarget(fix?.cap.id ?? capId, fix?.rule ?? rule);
  const back = <Link to={dest.to} params={dest.params as never} hash={dest.hash} className="cx-back" data-testid="fix-back">{t("Back to draft", "Volver al borrador")}</Link>;
  if (!fix) return <section className="cx-card calm"><p className="cx-note" role="status">{t("This job or field is not saved on this device.", "Este trabajo o campo no está guardado en este dispositivo.")}</p>{back}</section>;
  const save = () => {
    const r = fix.save();
    if (r === "empty") { setErr(t("Enter the value and the evidence for it (where it came from).", "Ingrese el valor y la evidencia (de dónde salió).")); return; }
    if (r === "failed") { setErr(t("Could not save on this device. Nothing was changed.", "No se pudo guardar en este dispositivo. No se cambió nada.")); return; }
    setErr("");
    nav({ to: dest.to, params: dest.params, hash: dest.hash } as never);
  };
  return (
    <section className="cx-card calm" data-testid="fix-bar">
      <p className="cx-note">{t("Editing one field of the saved job. Only the highlighted field is saved, as a correction with its evidence for office review. Nothing is confirmed.", "Editando un campo del trabajo guardado. Solo se guarda el campo resaltado, como corrección con su evidencia para revisión de oficina. No se confirma nada.")}</p>
      <div className="cx-field">
        <Label htmlFor="fix-evidence">{t("Evidence * (where this value came from)", "Evidencia * (de dónde salió este valor)")}</Label>
        <Textarea id="fix-evidence" rows={3} value={fix.evidence} onChange={(e) => fix.setEvidence(e.target.value)} placeholder={t("e.g. Read from the data plate photo", "p. ej. Leído de la foto de la placa")} data-testid="fix-evidence" />
      </div>
      <div className="cx-actions">
        <PinnedAction className="cx-pin-err">
          {err && <p role="alert" className="cx-err" data-testid="fix-err">{err}</p>}
          <button type="button" className="ap-btn primary" onClick={save} data-testid="fix-save">{t("Save to draft", "Guardar en el borrador")}</button>
        </PinnedAction>
        {back}
      </div>
    </section>
  );
}
