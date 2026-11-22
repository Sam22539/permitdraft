import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { StepShell, selectCls } from "../components/step-shell";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { useLang } from "../lib/lang";
import { useDraft } from "../lib/job-draft";

export const Route = createFileRoute("/new/work")({
  head: () => ({ meta: [{ title: "Work performed — PermitDraft" }, { name: "description", content: "Step 3 of 5: what the crew did." }] }),
  component: Work,
});

function Work() {
  const { t } = useLang();
  const d = useDraft();
  const [dict, setDict] = useState(false);
  const needed = t("NEEDED", "NECESARIO");
  return (
    <StepShell n={3} title={["Work performed", "Trabajo realizado"]} sub={["Step 3 of 5 · What the crew did", "Paso 3 de 5 · Lo que hizo el equipo"]} back="/new/equipment" next="/new/checks">
      <div className="ap-field"><Label htmlFor="wk">{t("Work performed", "Trabajo realizado")}</Label>
        <Textarea id="wk" rows={4} className="text-lg bg-white" value={d.get("work")} onChange={(e) => d.set("work", e.target.value)} /></div>
      <button type="button" className="ap-btn ghost" onClick={() => setDict(true)}>{t("Dictated note", "Nota dictada")}</button>
      {dict && <p role="status" className="font-semibold">{t("Dictation is a placeholder in this practice site.", "El dictado es un marcador en este sitio de práctica.")}</p>}
      <div className="ap-field"><Label htmlFor="pa">{t("Panel size amps * (needed for paperwork)", "Amperios del panel * (necesario para el papeleo)")}</Label>
        <Input id="pa" type="number" inputMode="numeric" min={0} value={d.get("panel")} onChange={(e) => d.set("panel", e.target.value)} />
        {!d.get("panel") && <strong className="ap-next">{needed}</strong>}</div>
      <div className="ap-field"><Label htmlFor="ds">{t("Duct sealing answer *", "Respuesta de sellado de ductos *")}</Label>
        <select id="ds" className={selectCls} value={d.get("duct")} onChange={(e) => d.set("duct", e.target.value)}>
          <option value="">{t("Choose…", "Elegir…")}</option>
          <option value="sealed">{t("Sealed and verified", "Sellado y verificado")}</option>
          <option value="not">{t("Not sealed", "No sellado")}</option>
          <option value="exempt">{t("Exempt, with reason", "Exento, con motivo")}</option>
        </select>
        {!d.get("duct") && <strong className="ap-next">{needed}</strong>}</div>
      {d.get("duct") === "exempt" && (
        <div className="ap-field"><Label htmlFor="dr">{t("Reason for exemption", "Motivo de la exención")}</Label>
          <Input id="dr" value={d.get("ductReason")} onChange={(e) => d.set("ductReason", e.target.value)} /></div>
      )}
    </StepShell>
  );
}
