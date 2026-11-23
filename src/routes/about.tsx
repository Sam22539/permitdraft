import { createFileRoute, Link } from "@tanstack/react-router";
import { Gauge, ClipboardCheck, Lightbulb, Users, ShieldCheck } from "lucide-react";
import { AppPage } from "../components/app-shell";
import { useLang } from "../lib/lang";

const title = "About PermitDraft — Simplifying Permitting. Empowering Contractors.";
const description = "PermitDraft helps residential HVAC contractors turn field details, photos and checks into an evidence-linked permit draft their office can review.";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
    ],
  }),
  component: About,
});

function About() {
  const { t } = useLang();
  const values = [
    { icon: Gauge, h: t("Efficiency", "Eficiencia"), p: t("Simplifying repetitive administrative tasks so contractors can focus on their projects.", "Simplificamos las tareas administrativas repetitivas para que los contratistas se concentren en sus proyectos.") },
    { icon: ClipboardCheck, h: t("Accuracy", "Precisión"), p: t("Helping users organize and review the information a complete permit draft needs.", "Ayudamos a organizar y revisar la información que necesita un borrador de permiso completo.") },
    { icon: Lightbulb, h: t("Innovation", "Innovación"), p: t("Developing practical technology that improves traditional permitting workflows.", "Desarrollamos tecnología práctica que mejora los flujos de permisos tradicionales.") },
    { icon: Users, h: t("Accessibility", "Accesibilidad"), p: t("Creating intuitive tools that contractors and businesses of different sizes can use confidently.", "Creamos herramientas intuitivas que contratistas y empresas de distintos tamaños pueden usar con confianza.") },
    { icon: ShieldCheck, h: t("Reliability", "Confiabilidad"), p: t("Building a professional platform contractors can depend on while preparing permit paperwork.", "Construimos una plataforma profesional en la que los contratistas pueden confiar al preparar el papeleo de permisos.") },
  ];
  return (
    <AppPage>
      <div className="ab-page">
      <section className="lp-hero" aria-labelledby="ab-h1">
        <p className="lp-kicker">{t("About PermitDraft", "Acerca de PermitDraft")}</p>
        <h1 id="ab-h1">{t("Simplifying Permitting. Empowering Contractors.", "Simplificamos los permisos. Empoderamos a los contratistas.")}</h1>
        <p className="ap-muted">{t("PermitDraft is a permit-preparation tool built for residential HVAC contractors.", "PermitDraft es una herramienta de preparación de permisos creada para contratistas residenciales de HVAC.")}</p>
      </section>

      <section className="lp-sec ab-sec" aria-labelledby="ab-who">
        <h2 id="ab-who" className="lp-h2">{t("Who We Are", "Quiénes somos")}</h2>
        <p className="ap-muted">{t("Permitting is part of every project, but the paperwork is often slow, complicated and scattered across systems. PermitDraft was created to change that.", "Los permisos son parte de cada proyecto, pero el papeleo suele ser lento, complicado y estar disperso en varios sistemas. PermitDraft nació para cambiar eso.")}</p>
        <p className="ap-muted">{t("PermitDraft prepares permit paperwork for contractor review. The contractor files with the local permitting authority.", "PermitDraft prepara el papeleo de permisos para la revisión del contratista. El contratista lo presenta ante la autoridad local de permisos.")}</p>
      </section>

      <section className="lp-sec ab-sec" aria-labelledby="ab-mission">
        <h2 id="ab-mission" className="lp-h2">{t("Our Mission", "Nuestra misión")}</h2>
        <p className="ap-muted">{t("To make permit paperwork simpler, faster and more accessible, with organized documentation and a clear handoff to the office.", "Hacer el papeleo de permisos más simple, rápido y accesible, con documentación organizada y una entrega clara a la oficina.")}</p>
        <p className="ap-muted">{t("Contractors should spend less time chasing paperwork and more time doing quality work for their customers.", "Los contratistas deben dedicar menos tiempo al papeleo y más tiempo a un trabajo de calidad para sus clientes.")}</p>
      </section>

      <section className="lp-sec ab-sec" aria-labelledby="ab-vision">
        <h2 id="ab-vision" className="lp-h2">{t("Our Vision", "Nuestra visión")}</h2>
        <p className="ap-muted">{t("We are working toward a more connected construction permitting process, with less repetitive data entry and fewer disconnected systems. That is a future goal, not something PermitDraft does today.", "Trabajamos hacia un proceso de permisos de construcción más conectado, con menos captura repetitiva de datos y menos sistemas desconectados. Es una meta a futuro, no algo que PermitDraft haga hoy.")}</p>
      </section>

      <section className="lp-sec ab-sec ab-values" aria-labelledby="ab-drives">
        <h2 id="ab-drives" className="lp-h2">{t("What Drives Us", "Lo que nos impulsa")}</h2>
        <ol className="lp-steps">
          {values.map((v) => (
            <li key={v.h}>
              <span className="lp-icon"><v.icon size={22} aria-hidden /></span>
              <div><h3>{v.h}</h3><p className="ap-muted">{v.p}</p></div>
            </li>
          ))}
        </ol>
      </section>

      <section className="lp-sec ab-sec" aria-labelledby="ab-commit">
        <h2 id="ab-commit" className="lp-h2">{t("Our Commitment", "Nuestro compromiso")}</h2>
        <p className="ap-muted">{t("We are committed to building technology that solves real problems for the people who build, install, repair and improve the spaces around us. Permitting should support progress, not slow it down.", "Nos comprometemos a crear tecnología que resuelva problemas reales de quienes construyen, instalan, reparan y mejoran los espacios que nos rodean. Los permisos deben apoyar el progreso, no frenarlo.")}</p>
      </section>

      <section className="lp-close" aria-labelledby="ab-end">
        <h2 id="ab-end" className="lp-h2">{t("PermitDraft. From the field to your office.", "PermitDraft. Del campo a su oficina.")}</h2>
        <Link to="/demo" className="ap-btn primary" data-testid="ab-try-demo">{t("Try the free demo", "Probar la demo gratis")}</Link>
      </section>
      </div>
    </AppPage>
  );
}
