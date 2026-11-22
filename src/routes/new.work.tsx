import { CoreGate } from "../components/core-offer";
import { createFileRoute } from "@tanstack/react-router";
import { Dictation } from "../components/dictation";
import { StepShell, selectCls } from "../components/step-shell";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { useLang } from "../lib/lang";
import { FixBar } from "../components/fix-bar";
import { fixSearch, useFixFocus, useStepDraft } from "../lib/fix-mode";

export const Route = createFileRoute("/new/work")({
  validateSearch: fixSearch,
  head: () => ({ meta: [{ title: "Work performed — PermitDraft" }, { name: "description", content: "Step 3 of 5: what the crew did." }] }),
  component: () => <CoreGate><Work /></CoreGate>,
});

export function Work() {
  const { t } = useLang();
  const d = useStepDraft(3);
  useFixFocus(d.fix, d.fix?.value ?? "");
  const needed = t("NEEDED", "NECESARIO");
  return (
    <StepShell n={3} title={["Work performed", "Trabajo realizado"]} sub={["Step 3 of 5 · What the crew did", "Paso 3 de 5 · Lo que hizo el equipo"]} back="/new/equipment" next="/new/checks" fixBar={d.fixState === "off" ? undefined : <FixBar fix={d.fix} capId={d.fixParams.fix} rule={d.fixParams.rule} />}>
      <div className="cx-field"><Label htmlFor="wk">{t("Work performed", "Trabajo realizado")}</Label>
        <Textarea id="wk" rows={4} className="text-lg bg-white" value={d.get("work")} onChange={(e) => d.set("work", e.target.value)} /></div>
      <Dictation notes={d.get("work")} onSave={(v) => d.set("work", v)} />
      <div className="cx-field"><Label htmlFor="pa">{t("Panel size amps * (needed for paperwork). Add the panel's available capacity and a clear photo of its label.", "Amperios del panel * (necesario para el papeleo). Agregue la capacidad disponible del panel y una foto clara de su etiqueta.")}</Label>
        <Input id="pa" type="number" inputMode="numeric" min={0} value={d.get("panel")} onChange={(e) => d.set("panel", e.target.value)} />
        {!d.get("panel") && <strong className="cx-need">{needed}</strong>}</div>
      <div className="cx-field"><Label htmlFor="ds">{t("Duct sealing answer *", "Respuesta de sellado de ductos *")}</Label>
        <select id="ds" className={selectCls} value={d.get("duct")} onChange={(e) => d.set("duct", e.target.value)}>
          <option value="">{t("Choose…", "Elegir…")}</option>
          <option value="sealed">{t("Sealed and verified", "Sellado y verificado")}</option>
          <option value="not">{t("Not sealed", "No sellado")}</option>
          <option value="exempt">{t("Exempt, with reason", "Exento, con motivo")}</option>
        </select>
        {!d.get("duct") && <strong className="cx-need">{needed}</strong>}</div>
      {d.get("duct") === "exempt" && (
        <div className="cx-field"><Label htmlFor="dr">{t("Reason for exemption", "Motivo de la exención")}</Label>
          <Input id="dr" value={d.get("ductReason")} onChange={(e) => d.set("ductReason", e.target.value)} /></div>
      )}
    </StepShell>
  );
}
