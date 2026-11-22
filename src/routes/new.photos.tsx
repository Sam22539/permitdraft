import { createFileRoute, Link } from "@tanstack/react-router";
import { StepShell } from "../components/step-shell";
import { useLang } from "../lib/lang";
import { useDraft } from "../lib/job-draft";

export const Route = createFileRoute("/new/photos")({
  head: () => ({ meta: [{ title: "Photos — PermitDraft" }, { name: "description", content: "Step 5 of 5: evidence photos." }] }),
  component: Photos,
});

const SLOTS: [string, string, string][] = [
  ["p1", "Data plate (model and serial)", "Placa de datos (modelo y serie)"],
  ["p2", "Outdoor unit with left side yard and clearance", "Unidad exterior con patio lateral izquierdo y espacio libre"],
  ["p3", "Refrigerant gauge or meter reading", "Lectura del manómetro o medidor de refrigerante"],
];

function Photos() {
  const { t } = useLang();
  const d = useDraft();
  return (
    <StepShell n={5} title={["Photos", "Fotos"]} sub={["Step 5 of 5 · Evidence photos", "Paso 5 de 5 · Fotos de evidencia"]} back="/new/checks">
      {SLOTS.map(([k, en, es]) => {
        const ok = d.get(k) === "1";
        return (
          <div key={k} className="ap-card">
            <div className="ap-chk" style={{ gap: "1rem" }}>
              <span style={{ flex: 1 }}>{t(en, es)}</span>
              <strong className={ok ? "ap-muted" : "ap-next"}>{ok ? t("Attached", "Adjunta") : t("Required", "Requerida")}</strong>
            </div>
            <button type="button" className="ap-btn ghost" onClick={() => d.set(k, "1")}>{t("Add photo", "Agregar foto")}</button>
          </div>
        );
      })}
      <p className="ap-muted">{t("Photos wait offline and sync when you are back in range.", "Las fotos esperan sin conexión y se sincronizan cuando vuelva a tener cobertura.")}</p>
      <Link to="/jobs/hp-1187" search={{ saved: "1" }} className="ap-btn primary">{t("Finish", "Finalizar")}</Link>
    </StepShell>
  );
}
