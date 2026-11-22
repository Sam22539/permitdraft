import { createFileRoute, Link } from "@tanstack/react-router";
import { Camera, ListChecks, FileSearch } from "lucide-react";
import { AppPage } from "../components/app-shell";
import { Image } from "../image";
import { useLang } from "../lib/lang";

const title = "HVAC permit paperwork from field photos — PermitDraft";
const description = "For residential HVAC contractors: turn a tech's field photos and notes into a permit draft the office can review. Spot missing items and see the evidence behind each value. Free demo, no sign-in or card.";

export const Route = createFileRoute("/hvac-permits")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { t } = useLang();
  const steps = [
    { icon: Camera, h: t("Capture in the field", "Capture en campo"), p: t("The tech photographs the data plate and records notes and readings on the phone.", "El técnico fotografía la placa de datos y registra notas y lecturas en el teléfono.") },
    { icon: ListChecks, h: t("Spot what’s missing", "Detecte lo que falta"), p: t("Anything the draft still needs is marked NEEDED, so the office knows what to ask for.", "Lo que el borrador aún necesita se marca NECESARIO, así la oficina sabe qué pedir.") },
    { icon: FileSearch, h: t("Review the evidence", "Revise la evidencia"), p: t("Each value shows the photo, note or reading it came from before anyone files.", "Cada valor muestra la foto, nota o lectura de donde salió antes de presentar nada.") },
  ];
  return (
    <AppPage>
      <section className="lp-hero" aria-labelledby="lp-h1">
        <Image src="/generated-assets/company-logo.png" alt="" width={64} height={64} className="lp-mark" />
        <p className="lp-kicker">{t("For residential HVAC contractors", "Para contratistas residenciales de HVAC")}</p>
        <h1 id="lp-h1">{t("From field photos to a permit draft your office can review", "De las fotos de campo a un borrador de permiso que su oficina puede revisar")}</h1>
        <p className="ap-muted">{t("Your tech captures the job on a phone. PermitDraft turns the photos and notes into a draft, flags what’s missing and shows the evidence behind every value.", "Su técnico captura el trabajo en el teléfono. PermitDraft convierte las fotos y notas en un borrador, marca lo que falta y muestra la evidencia detrás de cada valor.")}</p>
        <Link to="/demo" className="ap-btn primary" data-testid="lp-try-demo">{t("Try the free demo", "Probar la demo gratis")}</Link>
        <p className="lp-sub">{t("No sign-in or card.", "Sin iniciar sesión ni tarjeta.")} <Link to="/" hash="core-offer" className="lp-link" data-testid="lp-see-pricing">{t("See Core pricing", "Ver precio de Core")}</Link></p>
      </section>

      <section className="lp-sec" aria-labelledby="lp-checklist" data-testid="lp-checklist">
        <h2 id="lp-checklist" className="lp-h2">{t("Heat pump change-out paperwork checklist", "Lista de papeleo para cambio de bomba de calor")}</h2>
        <p className="ap-muted">{t("What the tech should photograph and record on site, and what the office checks before a permit draft is ready. Free, no sign-in.", "Lo que el técnico debe fotografiar y anotar en el sitio, y lo que la oficina revisa antes de que un borrador de permiso esté listo. Gratis, sin iniciar sesión.")}</p>
        <Link to="/heat-pump-paperwork-checklist" className="ap-btn ghost" data-testid="lp-open-checklist">{t("Open the checklist", "Abrir la lista")}</Link>
      </section>

      <section className="lp-sec" aria-labelledby="lp-how">
        <h2 id="lp-how" className="lp-h2">{t("How the handoff works", "Cómo funciona la entrega")}</h2>
        <ol className="lp-steps">
          {steps.map((s, i) => (
            <li key={i}>
              <span className="lp-icon"><s.icon size={22} aria-hidden /></span>
              <div><h3>{s.h}</h3><p className="ap-muted">{s.p}</p></div>
            </li>
          ))}
        </ol>
      </section>

      <section className="lp-sec" aria-labelledby="lp-sample">
        <h2 id="lp-sample" className="lp-h2">{t("From the sample heat-pump review", "De la revisión de muestra de bomba de calor")}</h2>
        <div className="lp-excerpt" data-testid="lp-excerpt">
          <p className="lp-ex-head">{t("Heat-pump change-out", "Cambio de bomba de calor")} · {t("Job", "Trabajo")} #HP-1187 · {t("Tech", "Técnico")}: Marcus Reyes</p>
          <div className="lp-row">
            <span className="lp-label">{t("Serial number", "Número de serie")}</span>
            <span className="lp-badge conf">{t("Confirmed", "Confirmado")}</span>
            <span className="lp-value">2819E04417</span>
            <span className="lp-ev">{t("Photo IMG_2041 (outdoor unit data plate), taken Nov 18, 2026 9:42 AM by Marcus Reyes. Label reads: “SERIAL NO. 2819E04417”.", "Foto IMG_2041 (placa de datos de la unidad exterior), tomada el 18 nov 2026, 9:42 AM por Marcus Reyes. La etiqueta dice: “SERIAL NO. 2819E04417”.")}</span>
            <span className="lp-src">{t("Source", "Fuente")}: {t("Equipment photo", "Foto del equipo")}</span>
          </div>
          <div className="lp-row need">
            <span className="lp-label">{t("Panel size", "Tamaño del panel")}</span>
            <span className="lp-badge needed">{t("NEEDED", "NECESARIO")}</span>
            <span className="lp-value">—</span>
            <span className="lp-ev">{t("No evidence on file. Ask the tech for a photo of the main panel label, or have the office enter the amperage.", "Sin evidencia. Pida al técnico una foto de la etiqueta del panel principal, o que la oficina ingrese el amperaje.")}</span>
          </div>
          <div className="lp-row need">
            <span className="lp-label">{t("Duct sealing answer", "Respuesta de sellado de ductos")}</span>
            <span className="lp-badge needed">{t("NEEDED", "NECESARIO")}</span>
            <span className="lp-value">—</span>
          </div>
        </div>
        <p className="ap-muted">{t("Sample data from the PermitDraft Demo.", "Datos de muestra de la demo de PermitDraft.")} <Link to="/sample-job" className="lp-link">{t("Open the full sample draft", "Abrir el borrador de muestra completo")}</Link></p>
      </section>

      <section className="lp-sec" aria-labelledby="lp-what">
        <h2 id="lp-what" className="lp-h2">{t("Documentation, not filing", "Documentación, no presentación")}</h2>
        <p className="rd-cov">{t("PermitDraft helps you put the paperwork together for HVAC jobs in all 50 US states. It checks that details and photos are captured. It does not file permits, it does not yet check any law or local rule, and it never says a job is compliant. Your office reviews and signs.", "PermitDraft le ayuda a preparar el papeleo de trabajos de HVAC en los 50 estados de EE. UU. Verifica que se capturen los datos y fotos. No presenta permisos, todavía no verifica ninguna ley ni regla local, y nunca dice que un trabajo cumple. Su oficina revisa y firma.")} <Link to="/coverage" className="lp-link">{t("What PermitDraft covers", "Qué cubre PermitDraft")}</Link></p>
      </section>

      <section className="lp-close" aria-labelledby="lp-end">
        <h2 id="lp-end" className="lp-h2">{t("Walk through a heat-pump job yourself", "Recorra usted mismo un trabajo de bomba de calor")}</h2>
        <p>{t("Every step of the demo is open: capture, checks and the draft review.", "Cada paso de la demo está abierto: captura, verificaciones y revisión del borrador.")}</p>
        <Link to="/demo" className="ap-btn primary" data-testid="lp-try-demo-end">{t("Try the free demo", "Probar la demo gratis")}</Link>
        <p className="lp-sub on-dark"><Link to="/" hash="core-offer" className="lp-link">{t("See Core pricing", "Ver precio de Core")}</Link></p>
      </section>
    </AppPage>
  );
}
