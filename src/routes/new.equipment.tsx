import { CoreGate } from "../components/core-offer";
import { createFileRoute } from "@tanstack/react-router";
import { StepShell, selectCls } from "../components/step-shell";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useLang } from "../lib/lang";
import { useDraft } from "../lib/job-draft";
import { usePhotos } from "../lib/photos";
import { PhotoSlot } from "../components/photo-slot";

export const Route = createFileRoute("/new/equipment")({
  head: () => ({ meta: [{ title: "Equipment — PermitDraft" }, { name: "description", content: "Step 2 of 5: equipment from the data plate." }] }),
  component: () => <CoreGate><Equipment /></CoreGate>,
});

export function Equipment() {
  const { t } = useLang();
  const d = useDraft(2);
  const { photos } = usePhotos();
  const on = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => d.set(k, e.target.value);
  const type = d.get("type");
  const isFurn = type === "Furnace + coil change-out";
  const isHp = type === "Heat pump change-out";
  const p = isHp ? "" : "ac_"; // heat pump keeps the legacy unprefixed keys
  const val = (k: string) => d.get(k);
  const needed = t("NEEDED", "NECESARIO");
  const field = (k: string, id: string, l: readonly [string, string]) => (
    <div className="cx-field" key={k}><Label htmlFor={id}>{t(l[0], l[1])}</Label><Input id={id} value={val(k)} onChange={on(k)} /></div>
  );
  return (
    <StepShell n={2} title={["Equipment", "Equipo"]} sub={["Step 2 of 5 · Equipment from the data plate", "Paso 2 de 5 · Equipo según la placa de datos"]} back="/new" next="/new/work">
      <div className="cx-field"><Label htmlFor="et">{t("Equipment type", "Tipo de equipo")}</Label>
        <select id="et" className={selectCls} value={d.get("type")} onChange={on("type")}>
          <option value="Heat pump change-out">{t("Heat pump change-out", "Cambio de bomba de calor")}</option>
          <option value="Central AC change-out">{t("Central AC change-out", "Cambio de aire acondicionado central")}</option>
          <option value="Furnace + coil change-out">{t("Furnace + coil change-out", "Cambio de horno + serpentín")}</option>
        </select></div>
      <PhotoSlot slot="plate" label={["Data plate photo", "Foto de la placa de datos"]} photo={photos.plate} takeLabel={["Take data plate photo", "Tomar foto de la placa de datos"]} />
      <p className="cx-note">{t("Read the model and serial from the data plate photo. Missing values stay NEEDED.", "Lea el modelo y el número de serie de la foto de la placa. Los valores faltantes quedan como NECESARIO.")}</p>
      {isFurn ? (
        <>
          <h2 className="cx-h">{t("Furnace nameplate", "Placa del horno")}</h2>
          {field("fu_maker", "fmf", ["Furnace manufacturer", "Fabricante del horno"])}
          {field("fu_model", "fmo", ["Furnace model number *", "Número de modelo del horno *"])}
          {field("fu_serial", "fse", ["Furnace serial number *", "Número de serie del horno *"])}
          <h2 className="cx-h">{t("Indoor coil nameplate", "Placa del serpentín interior")}</h2>
          {field("coil_maker", "cmf", ["Indoor coil manufacturer", "Fabricante del serpentín interior"])}
          {field("coil_model", "cmo", ["Indoor coil model number *", "Número de modelo del serpentín interior *"])}
          {field("coil_serial", "cse", ["Indoor coil serial number *", "Número de serie del serpentín interior *"])}
          <p className="cx-note">
            {t("Furnace model", "Modelo del horno")}: <strong>{val("fu_model") || needed}</strong> · {t("Serial", "Serie")}: <strong>{val("fu_serial") || needed}</strong><br />
            {t("Coil model", "Modelo del serpentín")}: <strong>{val("coil_model") || needed}</strong> · {t("Serial", "Serie")}: <strong>{val("coil_serial") || needed}</strong>
          </p>
        </>
      ) : (
        <>
          <h2 className="cx-h">{isHp ? t("Outdoor heat pump nameplate", "Placa de la bomba de calor exterior") : t("Outdoor AC nameplate", "Placa del aire acondicionado exterior")}</h2>
          {field(p + "maker", "mf", isHp ? ["Outdoor heat pump manufacturer", "Fabricante de la bomba de calor exterior"] : ["Outdoor AC manufacturer", "Fabricante del aire acondicionado exterior"])}
          {field(p + "model", "mo", isHp ? ["Outdoor heat pump model number *", "Número de modelo de la bomba de calor exterior *"] : ["Outdoor AC model number *", "Número de modelo del aire acondicionado exterior *"])}
          {field(p + "serial", "se", isHp ? ["Outdoor heat pump serial number *", "Número de serie de la bomba de calor exterior *"] : ["Outdoor AC serial number *", "Número de serie del aire acondicionado exterior *"])}
          <div className="cx-field"><Label htmlFor="rf">{t("Refrigerant type * (needed for paperwork)", "Tipo de refrigerante * (necesario para el papeleo)")}</Label>
            <select id="rf" className={selectCls} value={val(p + "refrig")} onChange={on(p + "refrig")}>
              <option value="">{t("Choose…", "Elegir…")}</option>
              <option>R-410A</option><option>R-454B</option><option>R-32</option>
              <option value="Other">{t("Other", "Otro")}</option>
            </select></div>
          {field(p + "loc", "ol", ["Outdoor unit location", "Ubicación de la unidad exterior"])}
          <p className="cx-note">{t("Model", "Modelo")}: <strong>{val(p + "model") || needed}</strong> · {t("Serial", "Serie")}: <strong>{val(p + "serial") || needed}</strong> · {t("Refrigerant", "Refrigerante")}: <strong>{val(p + "refrig") || needed}</strong></p>
        </>
      )}
    </StepShell>
  );
}
