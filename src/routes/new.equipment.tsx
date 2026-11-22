import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { StepShell, selectCls } from "../components/step-shell";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useLang } from "../lib/lang";
import { useDraft } from "../lib/job-draft";

export const Route = createFileRoute("/new/equipment")({
  head: () => ({ meta: [{ title: "Equipment — PermitDraft" }, { name: "description", content: "Step 2 of 5: equipment from the data plate." }] }),
  component: Equipment,
});

function Equipment() {
  const { t } = useLang();
  const d = useDraft();
  const [shot, setShot] = useState(false);
  const on = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => d.set(k, e.target.value);
  return (
    <StepShell n={2} title={["Equipment", "Equipo"]} sub={["Step 2 of 5 · Equipment from the data plate", "Paso 2 de 5 · Equipo según la placa de datos"]} back="/new" next="/new/work">
      <div className="ap-field"><Label htmlFor="et">{t("Equipment type", "Tipo de equipo")}</Label>
        <select id="et" className={selectCls} value={d.get("type")} onChange={on("type")}>
          <option value="Heat pump change-out">{t("Heat pump change-out", "Cambio de bomba de calor")}</option>
          <option value="Central AC change-out">{t("Central AC change-out", "Cambio de aire acondicionado central")}</option>
          <option value="Furnace + coil change-out">{t("Furnace + coil change-out", "Cambio de horno + serpentín")}</option>
        </select></div>
      <button type="button" className="ap-btn navy" onClick={() => setShot(true)}>{t("Take data plate photo", "Tomar foto de la placa de datos")}</button>
      {shot && <p role="status" className="font-semibold">{t("Photo saved to this job", "Foto guardada en este trabajo")}</p>}
      <p className="ap-muted">{t("Read the model and serial from the data plate photo. Missing values stay NEEDED.", "Lea el modelo y el número de serie de la foto de la placa. Los valores faltantes quedan como NECESARIO.")}</p>
      <div className="ap-field"><Label htmlFor="mf">{t("Manufacturer", "Fabricante")}</Label><Input id="mf" value={d.get("maker")} onChange={on("maker")} /></div>
      <div className="ap-field"><Label htmlFor="mo">{t("Model number *", "Número de modelo *")}</Label><Input id="mo" value={d.get("model")} onChange={on("model")} /></div>
      <div className="ap-field"><Label htmlFor="se">{t("Serial number *", "Número de serie *")}</Label><Input id="se" value={d.get("serial")} onChange={on("serial")} /></div>
      <div className="ap-field"><Label htmlFor="rf">{t("Refrigerant type * (needed for paperwork)", "Tipo de refrigerante * (necesario para el papeleo)")}</Label>
        <select id="rf" className={selectCls} value={d.get("refrig")} onChange={on("refrig")}>
          <option value="">{t("Choose…", "Elegir…")}</option>
          <option>R-410A</option><option>R-454B</option><option>R-32</option>
          <option value="Other">{t("Other", "Otro")}</option>
        </select></div>
      <div className="ap-field"><Label htmlFor="ol">{t("Outdoor unit location", "Ubicación de la unidad exterior")}</Label><Input id="ol" value={d.get("loc")} onChange={on("loc")} /></div>
      <p className="ap-muted">{t("Model", "Modelo")}: <strong>{d.get("model") || t("NEEDED", "NECESARIO")}</strong> · {t("Serial", "Serie")}: <strong>{d.get("serial") || t("NEEDED", "NECESARIO")}</strong></p>
    </StepShell>
  );
}
