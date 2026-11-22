import { CoreGate } from "../components/core-offer";
import { createFileRoute } from "@tanstack/react-router";
import { StepShell } from "../components/step-shell";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useLang } from "../lib/lang";
import { useDraft } from "../lib/job-draft";

export const Route = createFileRoute("/new/checks")({
  head: () => ({ meta: [{ title: "Compliance checks — PermitDraft" }, { name: "description", content: "Step 4 of 5: readings and checks." }] }),
  component: () => <CoreGate><Checks /></CoreGate>,
});

const ITEMS: [string, string, string][] = [
  ["c1", "Outdoor unit location recorded", "Ubicación de la unidad exterior registrada"],
  ["c2", "Refrigerant charge reading taken", "Lectura de carga de refrigerante tomada"],
  ["c3", "Refrigerant type matches data plate", "El tipo de refrigerante coincide con la placa"],
  ["c4", "Equipment label photo readable", "Foto de la etiqueta del equipo legible"],
];

function Checks() {
  const { t } = useLang();
  const d = useDraft(4);
  return (
    <StepShell n={4} title={["Compliance checks", "Verificaciones de cumplimiento"]} sub={["Step 4 of 5 · Readings and checks", "Paso 4 de 5 · Lecturas y verificaciones"]} back="/new/work" next="/new/photos">
      {ITEMS.map(([k, en, es]) => {
        const ok = d.get(k) === "1";
        return (
          <div key={k} className="grid gap-3">
            <label className={`cx-check${ok ? " on" : ""}`}>
              <input type="checkbox" checked={ok} onChange={(e) => d.set(k, e.target.checked ? "1" : "")} />
              <span className="txt">{t(en, es)}</span>
              <strong className={ok ? "cx-ok" : "cx-need"}>{ok ? t("Confirmed", "Confirmado") : t("NEEDED", "NECESARIO")}</strong>
            </label>
            {k === "c2" && (
              <div className="cx-two">
                <div className="cx-field"><Label htmlFor="sub">{t("Subcooling (optional)", "Subenfriamiento (opcional)")}</Label><Input id="sub" type="number" inputMode="decimal" value={d.get("sub")} onChange={(e) => d.set("sub", e.target.value)} /></div>
                <div className="cx-field"><Label htmlFor="sup">{t("Superheat (optional)", "Sobrecalentamiento (opcional)")}</Label><Input id="sup" type="number" inputMode="decimal" value={d.get("sup")} onChange={(e) => d.set("sup", e.target.value)} /></div>
              </div>
            )}
          </div>
        );
      })}
    </StepShell>
  );
}
