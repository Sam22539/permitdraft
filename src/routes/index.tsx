import { createFileRoute, Link } from "@tanstack/react-router";
import { AppPage } from "../components/app-shell";
import { useLang } from "../lib/lang";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "PermitDraft — permit paperwork before you leave the driveway" }, { name: "description", content: "Add job details, take the checklist photos, review the draft and export." }] }),
  component: Start,
});

function Start() {
  const { t } = useLang();
  const steps = [
    t("Add job details and equipment from the data plate.", "Agregue los detalles del trabajo y del equipo desde la placa de datos."),
    t("Take the checklist photos.", "Tome las fotos de la lista de verificación."),
    t("Review the draft, fix flagged items, export.", "Revise el borrador, corrija lo marcado y exporte."),
  ];
  return (
    <AppPage>
      <section className="ap-hero">
        <h1>{t("Permit paperwork, done before you leave the driveway.", "El papeleo del permiso, listo antes de salir del camino de entrada.")}</h1>
      </section>
      <ol className="ap-steps">
        {steps.map((s, i) => (
          <li key={i}><span className="ap-num">{i + 1}</span><span>{s}</span></li>
        ))}
      </ol>
      <Link to="/jobs" className="ap-btn primary">{t("Start 14-day free trial", "Comenzar prueba gratis de 14 días")}</Link>
      <Link to="/jobs" className="ap-btn ghost">{t("Explore with sample jobs", "Explorar con trabajos de muestra")}</Link>
    </AppPage>
  );
}
