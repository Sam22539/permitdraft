import { CoreGate } from "../components/core-offer";
import { createFileRoute } from "@tanstack/react-router";
import { StepShell } from "../components/step-shell";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useEffect, useState } from "react";
import { useLang } from "../lib/lang";
import { FixBar } from "../components/fix-bar";
import { fixSearch, useFixFocus, useStepDraft } from "../lib/fix-mode";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { READING_UNIT_KEY, UNIT_LABEL, applicableChecks } from "../lib/capture-fields";
import { useDemo } from "../components/demo";
import { CHECK_MSG_KEY } from "./new.photos";

export const Route = createFileRoute("/new/checks")({
  validateSearch: fixSearch,
  head: () => ({ meta: [{ title: "Compliance checks — PermitDraft" }, { name: "description", content: "Step 4 of 5: readings and checks." }] }),
  component: () => <CoreGate><Checks /></CoreGate>,
});

const ITEMS: [string, string, string][] = [
  ["c1", "Outdoor unit location recorded", "Ubicación de la unidad exterior registrada"],
  ["c2", "Refrigerant charge reading taken", "Lectura de carga de refrigerante tomada"],
  ["c3", "Refrigerant type matches data plate", "El tipo de refrigerante coincide con la placa"],
  ["c4", "Equipment label photo readable", "Foto de la etiqueta del equipo legible"],
];

export function Checks() {
  const { t } = useLang();
  const d = useStepDraft(4);
  useFixFocus(d.fix, d.fix?.value ?? "");
  const [err, setErr] = useState("");
  const normal = d.fixState === "off";
  // Finish refused to save because Final checks were unticked: name them here and scroll to them.
  const [unticked, setUnticked] = useState<[string, string][]>([]);
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(CHECK_MSG_KEY);
      if (!raw) return;
      sessionStorage.removeItem(CHECK_MSG_KEY);
      setUnticked(JSON.parse(raw));
      setTimeout(() => document.getElementById("final-checks-msg")?.scrollIntoView({ block: "center" }), 50);
    } catch { /* ignore */ }
  }, []);
  const stillUnticked = unticked.filter(([en]) => { const it = ITEMS.find((i) => i[1] === en); return it ? d.get(it[0]) !== "1" : false; });
  const demo = useDemo();
  const shown = applicableChecks(d.get("type") || undefined, { coil_model: d.get("coil_model"), coil_serial: d.get("coil_serial") });
  const guard = () => {
    if (!normal) return true;
    if (!d.get("addr").trim() || !d.get("city").trim()) { setErr(t("Fill in the job address and city.", "Complete la dirección del trabajo y la ciudad.")); return false; }
    return true;
  };
  const unitChoice = (reading: string) => {
    const k = READING_UNIT_KEY[reading];
    return (
      <div className="cx-unit">
        <span id={`${k}-l`} className="cx-label text-sm">{t("Reading taken at", "Lectura tomada en")}</span>
        <RadioGroup value={d.get(k)} onValueChange={(v) => d.set(k, v)} aria-labelledby={`${k}-l`} data-testid={`unit-${reading}`}>
          {(["indoor", "outdoor"] as const).map((u) => (
            <label key={u} className={`cx-unit-opt${d.get(k) === u ? " on" : ""}`}>
              <RadioGroupItem value={u} data-testid={`unit-${reading}-${u}`} />
              <span>{t(...UNIT_LABEL[u])}</span>
            </label>
          ))}
        </RadioGroup>
      </div>
    );
  };
  // Demo: each optional reading is its own group; where it was taken shows only once a value is entered.
  const demoReading = (reading: "sub" | "sup", name: [string, string]) => {
    const k = READING_UNIT_KEY[reading];
    const has = d.get(reading).trim() !== "";
    return (
      <div className="cx-demo-group" data-testid={`reading-${reading}`}>
        <div className="cx-field"><Label htmlFor={reading}>{t(`${name[0]} (optional)`, `${name[1]} (opcional)`)}</Label>
          <Input id={reading} type="number" inputMode="decimal" value={d.get(reading)} onChange={(e) => d.set(reading, e.target.value)} /></div>
        {has && (
          <div className="cx-unit">
            <span id={`${k}-l`} className="cx-label">{t(`${name[0]} reading taken at`, `${name[1]}: lectura tomada en`)}</span>
            <RadioGroup value={d.get(k)} onValueChange={(v) => d.set(k, v)} aria-labelledby={`${k}-l`} data-testid={`unit-${reading}`}>
              {(["indoor", "outdoor"] as const).map((u) => (
                <label key={u} className={`cx-unit-opt cx-demo-opt${d.get(k) === u ? " on" : ""}`}>
                  <RadioGroupItem value={u} data-testid={`unit-${reading}-${u}`} />
                  <span>{t(...UNIT_LABEL[u])}</span>
                </label>
              ))}
            </RadioGroup>
          </div>
        )}
      </div>
    );
  };
  return (
    <StepShell n={4} title={["Compliance checks", "Verificaciones de cumplimiento"]} sub={["Step 4 of 5 · Readings and checks", "Paso 4 de 5 · Lecturas y verificaciones"]} back="/new/work" next="/new/photos" onNext={guard} fixBar={d.fixState === "off" ? undefined : <FixBar fix={d.fix} capId={d.fixParams.fix} rule={d.fixParams.rule} />}>
      {normal && (
        <div className="grid gap-3" data-testid="job-address">
          <h2 className="cx-label text-sm font-semibold">{t("Job address", "Dirección del trabajo")}</h2>
          <div className="cx-field"><Label htmlFor="a">{t("Job site address *", "Dirección del sitio *")}</Label><Input id="a" value={d.get("addr")} onChange={(e) => { setErr(""); d.set("addr", e.target.value); }} autoComplete="off" /></div>
          <div className="cx-field"><Label htmlFor="c">{t("City *", "Ciudad *")}</Label><Input id="c" value={d.get("city")} onChange={(e) => { setErr(""); d.set("city", e.target.value); }} /></div>
          {err && <p role="alert" className="cx-err">{err}</p>}
          <h2 className="cx-label text-sm font-semibold">{t("Final checks", "Verificaciones finales")}</h2>
        </div>
      )}
      {stillUnticked.length > 0 && (
        <p id="final-checks-msg" role="alert" className="cx-err" data-testid="unticked-checks">
          {t(`Not saved. Tick every Final check before finishing: ${stillUnticked.map((x) => x[0]).join("; ")}.`, `No se guardó. Marque todas las verificaciones finales antes de finalizar: ${stillUnticked.map((x) => x[1]).join("; ")}.`)}
        </p>
      )}
      {ITEMS.filter(([k]) => shown.includes(k)).map(([k, en, es]) => {
        const ok = d.get(k) === "1";
        return (
          <div key={k} className="grid gap-3">
            <label className={`cx-check${demo ? " cx-demo-check" : ""}${ok ? " on" : ""}`}>
              <input type="checkbox" checked={ok} onChange={(e) => d.set(k, e.target.checked ? "1" : "")} />
              <span className="txt">{t(en, es)}</span>
              <strong className={ok ? "cx-ok" : "cx-need"}>{ok ? t("Confirmed", "Confirmado") : t("NEEDED", "NECESARIO")}</strong>
            </label>
            {k === "c2" && demo && (
              <div className="grid gap-3">
                {demoReading("sub", ["Subcooling", "Subenfriamiento"])}
                {demoReading("sup", ["Superheat", "Sobrecalentamiento"])}
              </div>
            )}
            {k === "c2" && !demo && (
              <div className="cx-two">
                <div className="cx-field"><Label htmlFor="sub">{t("Subcooling (optional)", "Subenfriamiento (opcional)")}</Label><Input id="sub" type="number" inputMode="decimal" value={d.get("sub")} onChange={(e) => d.set("sub", e.target.value)} />{unitChoice("sub")}</div>
                <div className="cx-field"><Label htmlFor="sup">{t("Superheat (optional)", "Sobrecalentamiento (opcional)")}</Label><Input id="sup" type="number" inputMode="decimal" value={d.get("sup")} onChange={(e) => d.set("sup", e.target.value)} />{unitChoice("sup")}</div>
              </div>
            )}
          </div>
        );
      })}
    </StepShell>
  );
}
