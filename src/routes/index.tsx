import { createFileRoute, Link } from "@tanstack/react-router";
import { AppPage } from "../components/app-shell";
import { useLang } from "../lib/lang";
import { ScreenPreview } from "../components/home-hero";
import { BarChart3, ClipboardList, FilePlus2, Home, Layers, MapPin, Play, Search, SearchCheck, Send, ShieldCheck } from "lucide-react";
import "../home.css";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "PermitDraft — capture the HVAC job, send it to the office" }, { name: "description", content: "Capture job details and checklist photos, review the permit draft, and send one private job packet to your office. A documentation workflow for residential HVAC contractors in California, Arizona, Texas and Las Vegas, Nevada." }] }),
  component: Start,
});

function Start() {
  const { t } = useLang();
  const steps = [
    { icon: FilePlus2, title: t("Capture", "Capturar"), text: t("Job details, equipment and checklist photos.", "Datos del trabajo, equipo y fotos de la lista.") },
    { icon: Search, title: t("Review", "Revisar"), text: t("Missing details are flagged.", "Se marcan los datos faltantes.") },
    { icon: ClipboardList, title: t("Prepare", "Preparar"), text: t("The permit draft, field by field.", "El borrador del permiso, campo por campo.") },
    { icon: Send, title: t("Send", "Enviar"), text: t("Tap Done to hand off.", "Toque Listo para entregar.") },
    { icon: BarChart3, title: t("Track", "Seguir"), text: t("See where each handoff stands.", "Vea cómo va cada entrega.") },
  ];
  const benefits = [
    { icon: SearchCheck, title: t("The same checklist every job", "La misma lista en cada trabajo"), text: t("Each job runs the documentation checklist the office needs.", "Cada trabajo corre la lista de documentación que la oficina necesita.") },
    { icon: ShieldCheck, title: t("Evidence behind each field", "Evidencia detrás de cada campo"), text: t("The office sees the photo, note or reading behind each field.", "La oficina ve la foto, la nota o la lectura detrás de cada campo.") },
    { icon: Layers, title: t("One packet per job", "Un paquete por trabajo"), text: t("Photos, notes and the draft arrive at the office together.", "Fotos, notas y el borrador llegan juntos a la oficina.") },
  ];
  const places = ["California", "Arizona", "Texas", "Las Vegas, Nevada"];
  return (
    <AppPage home>
      <section className="hp-hero">
        <div className="hp-hero-in">
          <div className="hp-copy">
            <p className="hp-eyebrow">{t("Residential HVAC permit paperwork", "Papeleo de permisos residenciales de HVAC")}</p>
            <h1>{t("From the Field to the", "Del campo a la")} <span>{t("Office.", "Oficina.")}</span></h1>
            <p className="hp-lead">{t("Streamline HVAC and construction permit documentation with one complete platform. Capture jobsite details, equipment information, compliance checks, and required photographs, then send a finished documentation package directly to your office for review and processing.", "Simplifique la documentación de permisos de HVAC y construcción con una plataforma completa. Capture los detalles del sitio, la información del equipo, las revisiones de cumplimiento y las fotos requeridas, y luego envíe un paquete de documentación terminado directamente a su oficina para revisión y trámite.")}</p>
            <div className="hp-ctas">
              <Link to="/demo" className="ap-btn primary" data-testid="try-demo"><Play size={18} fill="currentColor" aria-hidden />{t("Try Free Demo", "Probar la demo gratis")}</Link>
              <a href="#how" className="ap-btn hp-outline">{t("See How It Works", "Ver cómo funciona")}</a>
            </div>
            <p className="hp-sample">{t("No sign-in needed for the demo. The packet goes to your office for review; it is not a permit filing.", "La demo no requiere iniciar sesión. El paquete va a su oficina para revisión; no es la presentación de un permiso.")} <Link to="/sample-job">{t("See a sample permit draft (sample data, not a real job)", "Ver un borrador de permiso de muestra (datos de muestra, no es un trabajo real)")}</Link></p>
          </div>
          <ScreenPreview />
        </div>
        <span className="hp-corner" aria-hidden />
      </section>

      <section className="hp-flow" id="how" aria-labelledby="hp-flow-h">
        <div className="hp-flow-head">
          <p className="hp-kicker">{t("The PermitDraft process", "El proceso de PermitDraft")}</p>
          <h2 id="hp-flow-h">{t("One workflow. From jobsite to office.", "Un flujo de trabajo. Del sitio de trabajo a la oficina.")}</h2>
        </div>
        <ol className="hp-steps">
          {steps.map((s) => (
            <li key={s.title}><s.icon size={30} strokeWidth={1.75} aria-hidden /><strong>{s.title}</strong><span>{s.text}</span></li>
          ))}
        </ol>
      </section>

      <section className="hp-benefits" id="features" aria-label={t("Features", "Funciones")}>
        {benefits.map((b) => (
          <div key={b.title} className="hp-benefit"><b.icon size={34} strokeWidth={1.75} aria-hidden /><div><h3>{b.title}</h3><p>{b.text}</p></div></div>
        ))}
      </section>

      <section className="hp-band" aria-label={t("Coverage", "Cobertura")}>
        <div className="hp-band-in">
          <div className="hp-serving"><MapPin size={22} aria-hidden /><strong>{t("Currently serving", "Servicio actual")}</strong>
            <ul>{places.map((p) => <li key={p}>{p}</li>)}</ul>
          </div>
          <p className="hp-built"><Home size={20} aria-hidden />{t("Built for residential HVAC contractors", "Hecho para contratistas residenciales de HVAC")}</p>
        </div>
        <p className="hp-cov" data-testid="landing-coverage">{t("Documentation support in each area; verified local rules are not covered yet.", "Apoyo de documentación en cada área; las reglas locales verificadas aún no están cubiertas.")} <Link to="/coverage">{t("What PermitDraft covers", "Qué cubre PermitDraft")}</Link></p>
      </section>

    </AppPage>
  );
}
