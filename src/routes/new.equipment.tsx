import { CoreGate } from "../components/core-offer";
import { createFileRoute } from "@tanstack/react-router";
import { StepShell, selectCls } from "../components/step-shell";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useLang } from "../lib/lang";
import { FixBar } from "../components/fix-bar";
import { fixSearch, useFixFocus, useStepDraft } from "../lib/fix-mode";
import { usePhotos, PLATE_SLOTS } from "../lib/photos";
import { FU_COIL_OPTS, FU_FURNACE_OPTS, FU_OUTDOOR_OPTS, FU_REFRIG_OPTS, furnaceAnswers, furnaceScope, retainedField, FU_SCOPE_KEYS, scopeChangePatch, scopeValues, photoStale, staleKeyOf } from "../lib/capture-fields";
import { PhotoSlot } from "../components/photo-slot";

export const Route = createFileRoute("/new/equipment")({
  validateSearch: fixSearch,
  head: () => ({ meta: [{ title: "Equipment — PermitDraft" }, { name: "description", content: "Step 2 of 5: equipment from the data plate." }] }),
  component: () => <CoreGate><Equipment /></CoreGate>,
});

export function Equipment() {
  const { t } = useLang();
  const d = useStepDraft(2);
  useFixFocus(d.fix, d.fix?.value ?? "");
  const { photos } = usePhotos();
  const on = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const prev = scopeValues(d.get);
    d.set(k, e.target.value);
    // Only what this answer touches is flagged: confirmations whose own dependencies changed stay as reference and ask for a
    // review (never cleared, never silently valid again), and saved plate photos of equipment whose answer changed stop counting.
    if (k === "type" || (FU_SCOPE_KEYS as readonly string[]).includes(k)) {
      const next = { ...prev, [k]: e.target.value };
      const times = Object.fromEntries(PLATE_SLOTS.filter((sl) => photos[sl]).map((sl) => [sl, photos[sl]!.savedAt]));
      for (const [kk, vv] of Object.entries(scopeChangePatch(prev, next, times))) d.set(kk, vv);
    }
  };
  const type = d.get("type");
  const isFurn = type === "Furnace + coil change-out";
  const isHp = type === "Heat pump change-out";
  const p = isHp ? "" : "ac_"; // heat pump keeps the legacy unprefixed keys
  const val = (k: string) => d.get(k);
  const needed = t("NEEDED", "NECESARIO");
  const sc = furnaceScope({ fu_furnace: val("fu_furnace"), fu_coil: val("fu_coil"), fu_outdoor: val("fu_outdoor"), fu_refrig: val("fu_refrig") });
  const star = (k: string) => (retainedField(k, { fu_furnace: val("fu_furnace"), fu_coil: val("fu_coil") }) ? "" : " *");
  const scopeSelect = (k: string, id: string, l: readonly [string, string], opts: [string, [string, string]][], tid: string) => (
    <div className="cx-field"><Label htmlFor={id}>{t(l[0], l[1])}</Label>
      <select id={id} className={selectCls} value={val(k)} onChange={on(k)} data-testid={tid}>
        <option value="">{t("Choose…", "Elegir…")}</option>
        {opts.map(([v, o]) => <option key={v} value={v}>{t(o[0], o[1])}</option>)}
      </select></div>
  );
  // A distinct plate photo is asked for only on replaced equipment; a photo already saved on kept equipment stays shown, optional.
  const plateShot = (slot: "plate_furnace" | "plate_coil" | "plate_outdoor", replaced: boolean, l: [string, string]) => (replaced || photos[slot]) ? (
    <div data-testid={`equip-${slot}`}>
      <PhotoSlot slot={slot} label={l} photo={photos[slot]} takeLabel={["Take data plate photo", "Tomar foto de la placa de datos"]} />
      {replaced && photos[slot] && photoStale({ [staleKeyOf(slot)]: val(staleKeyOf(slot)) }, slot, photos[slot]!.savedAt) && (
        <div role="status" className="cx-err" data-testid={`stale-${slot}`}>
          <p><strong>{t("Review again", "Revisar de nuevo")}</strong>: {t("this photo was saved before the replaced/kept answer for this equipment changed, so it is not counted for it. Retake it, or confirm it shows this equipment.", "esta foto se guardó antes de que cambiara la respuesta de reemplazo de este equipo, por lo que no se cuenta. Tómela de nuevo, o confirme que muestra este equipo.")}</p>
          <button type="button" className="ap-btn ghost" data-testid={`keep-${slot}`} onClick={() => d.set(staleKeyOf(slot), "")}>{t("This photo shows this equipment", "Esta foto muestra este equipo")}</button>
        </div>
      )}
      {!replaced && <p className="cx-note">{t("Optional: this equipment was not replaced.", "Opcional: este equipo no se reemplazó.")}</p>}
    </div>
  ) : null;
  const field = (k: string, id: string, l: readonly [string, string]) => (
    <div className="cx-field" key={k}><Label htmlFor={id}>{t(l[0], l[1])}</Label><Input id={id} value={val(k)} onChange={on(k)} /></div>
  );
  return (
    <StepShell n={2} title={["Equipment", "Equipo"]} sub={["Step 2 of 5 · Equipment from the data plate", "Paso 2 de 5 · Equipo según la placa de datos"]} back="/new" next="/new/work" fixBar={d.fixState === "off" ? undefined : <FixBar fix={d.fix} capId={d.fixParams.fix} rule={d.fixParams.rule} />}>
      <div className="cx-field"><Label htmlFor="et">{t("Equipment type", "Tipo de equipo")}</Label>
        <select id="et" className={selectCls} value={d.get("type")} onChange={on("type")}>
          <option value="Heat pump change-out">{t("Heat pump change-out", "Cambio de bomba de calor")}</option>
          <option value="Central AC change-out">{t("Central AC change-out", "Cambio de aire acondicionado central")}</option>
          <option value="Furnace + coil change-out">{t("Furnace + coil change-out", "Cambio de horno + serpentín")}</option>
        </select></div>
      {isFurn ? (
        <>
          {(!isFurn || photos.plate) && (
        <PhotoSlot slot="plate" label={isFurn ? ["Earlier data plate photo (kept as evidence)", "Foto anterior de la placa de datos (se conserva como evidencia)"] : ["Data plate photo", "Foto de la placa de datos"]} photo={photos.plate} takeLabel={["Take data plate photo", "Tomar foto de la placa de datos"]} />
      )}
      <p className="cx-note">{isFurn ? t("Answer what was replaced. Each replaced item needs its own data plate photo; kept equipment needs none, and photos already saved stay.", "Responda qué se reemplazó. Cada equipo reemplazado necesita su propia foto de placa; el equipo conservado no necesita ninguna, y las fotos ya guardadas se conservan.") : t("Read the model and serial from the data plate photo. Missing values stay NEEDED.", "Lea el modelo y el número de serie de la foto de la placa. Los valores faltantes quedan como NECESARIO.")}</p>
          <h2 className="cx-h">{t("Furnace nameplate", "Placa del horno")}</h2>
          {scopeSelect("fu_furnace", "ffu", ["Furnace: kept or replaced *", "Horno: conservado o reemplazado *"], FU_FURNACE_OPTS, "fu-furnace")}
          {plateShot("plate_furnace", sc.furnace, ["Furnace data plate photo", "Foto de la placa de datos del horno"])}
          {field("fu_maker", "fmf", ["Furnace manufacturer", "Fabricante del horno"])}
          {field("fu_model", "fmo", [`Furnace model number${star("fu_model")}`, `Número de modelo del horno${star("fu_model")}`])}
          {field("fu_serial", "fse", [`Furnace serial number${star("fu_serial")}`, `Número de serie del horno${star("fu_serial")}`])}
          <h2 className="cx-h">{t("Indoor coil nameplate", "Placa del serpentín interior")}</h2>
          {scopeSelect("fu_coil", "fco", ["Indoor coil: kept or replaced *", "Serpentín interior: conservado o reemplazado *"], FU_COIL_OPTS, "fu-coil")}
          {plateShot("plate_coil", sc.coil, ["Indoor coil data plate photo", "Foto de la placa de datos del serpentín interior"])}
          {field("coil_maker", "cmf", ["Indoor coil manufacturer", "Fabricante del serpentín interior"])}
          {field("coil_model", "cmo", [`Indoor coil model number${star("coil_model")}`, `Número de modelo del serpentín interior${star("coil_model")}`])}
          {field("coil_serial", "cse", [`Indoor coil serial number${star("coil_serial")}`, `Número de serie del serpentín interior${star("coil_serial")}`])}
          <h2 className="cx-h">{t("Outdoor unit and refrigerant", "Unidad exterior y refrigerante")}</h2>
          <p className="cx-note">{t("Answer both. Together with the furnace and coil answers they decide which final checks and photos this job needs; nothing is assumed. A replaced indoor coil or outdoor unit counts as refrigerant circuit work, even when the outdoor unit is kept.", "Responda ambas. Junto con las respuestas del horno y del serpentín deciden qué verificaciones y fotos necesita este trabajo; nada se supone. Un serpentín interior o una unidad exterior reemplazados cuentan como trabajo en el circuito de refrigerante, aunque se conserve la unidad exterior.")}</p>
          <div className="cx-field"><Label htmlFor="fuo">{t("Outdoor unit: kept, replaced or not present *", "Unidad exterior: conservada, reemplazada o no presente *")}</Label>
            <select id="fuo" className={selectCls} value={val("fu_outdoor")} onChange={on("fu_outdoor")} data-testid="fu-outdoor">
              <option value="">{t("Choose…", "Elegir…")}</option>
              {FU_OUTDOOR_OPTS.map(([k, l]) => <option key={k} value={k}>{t(l[0], l[1])}</option>)}
            </select></div>
          <div className="cx-field"><Label htmlFor="fur">{t("Was refrigerant work done? *", "¿Se hizo trabajo con refrigerante? *")}</Label>
            <select id="fur" className={selectCls} value={val("fu_refrig")} onChange={on("fu_refrig")} data-testid="fu-refrig">
              <option value="">{t("Choose…", "Elegir…")}</option>
              {FU_REFRIG_OPTS.map(([k, l]) => <option key={k} value={k}>{t(l[0], l[1])}</option>)}
            </select></div>
          {plateShot("plate_outdoor", sc.outdoor, ["Outdoor unit data plate photo", "Foto de la placa de datos de la unidad exterior"])}
          {furnaceAnswers(type, { fu_outdoor: val("fu_outdoor"), fu_refrig: val("fu_refrig") }).contradiction && (
            <p role="alert" className="cx-err" data-testid="fu-contradiction">{t("These answers conflict: no outdoor unit is present, yet refrigerant work is marked done. Change one before Finish.", "Estas respuestas se contradicen: no hay unidad exterior, pero se marcó trabajo con refrigerante. Cambie una antes de Finalizar.")}</p>
          )}
          <p className="cx-note">
            {t("Furnace model", "Modelo del horno")}: <strong>{val("fu_model") || needed}</strong> · {t("Serial", "Serie")}: <strong>{val("fu_serial") || needed}</strong><br />
            {t("Coil model", "Modelo del serpentín")}: <strong>{val("coil_model") || needed}</strong> · {t("Serial", "Serie")}: <strong>{val("coil_serial") || needed}</strong>
          </p>
        </>
      ) : (
        <div className="cx-plate-split">
          <div className="cx-plate-photo">
            {(!isFurn || photos.plate) && (
              <PhotoSlot slot="plate" label={isFurn ? ["Earlier data plate photo (kept as evidence)", "Foto anterior de la placa de datos (se conserva como evidencia)"] : ["Data plate photo", "Foto de la placa de datos"]} photo={photos.plate} takeLabel={["Take data plate photo", "Tomar foto de la placa de datos"]} />
            )}
            <p className="cx-note">{isFurn ? t("Answer what was replaced. Each replaced item needs its own data plate photo; kept equipment needs none, and photos already saved stay.", "Responda qué se reemplazó. Cada equipo reemplazado necesita su propia foto de placa; el equipo conservado no necesita ninguna, y las fotos ya guardadas se conservan.") : t("Read the model and serial from the data plate photo. Missing values stay NEEDED.", "Lea el modelo y el número de serie de la foto de la placa. Los valores faltantes quedan como NECESARIO.")}</p>
          </div>
          <div className="cx-plate-fields">
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

          </div>
        </div>
      )}
    </StepShell>
  );
}
