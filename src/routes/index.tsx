import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { joinPilot, US_STATES } from "../lib/pilot";
import { AppPage } from "../components/app-shell";
import { CoreOffer } from "../components/core-offer";
import { useLang } from "../lib/lang";
import { ScreenPreview, SignInCard } from "../components/home-hero";
import { ArrowRight, BarChart3, ClipboardList, FilePlus2, Home, Layers, MapPin, Play, Search, SearchCheck, Send, ShieldCheck } from "lucide-react";
import "../home.css";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "PermitDraft — capture the HVAC job, send it to the office" }, { name: "description", content: "Capture job details and checklist photos, review the permit draft, and send one private job packet to your office. A documentation workflow for residential HVAC contractors in California, Arizona, Texas and Las Vegas, Nevada." }] }),
  component: Start,
});

function PilotForm() {
  const { t } = useLang();
  const [ready, setReady] = useState(false);
  const [f, setF] = useState({ company: "", contact: "", email: "", state: "", paperworkDelay: "" });
  const [state, setState] = useState<"idle" | "busy" | "done" | "fail" | "invalid">("idle");
  useEffect(() => setReady(true), []);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.company.trim() || !f.contact.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim()) || !f.state) { setState("invalid"); return; }
    setState("busy");
    try { await joinPilot({ data: f }); setState("done"); } catch { setState("fail"); }
  };
  if (state === "done")
    return (
      <div className="ap-signup-col"><section className="ap-card" id="pilot" data-testid="pilot-done" role="status">
        <h2>{t("Thanks — we received your Early Access signup.", "Gracias: recibimos su registro de acceso anticipado.")}</h2>
        <p className="ap-muted">{t("We saved your details for", "Guardamos sus datos de")} {f.company} {t("with the work email", "con el correo de trabajo")} {f.email}. {t("Service area:", "Área de servicio:")} {f.state}. {t("Signing up for Early Access is not the same as starting the free 14-day PermitDraft Core trial, and it does not create an account or start the trial for you.", "Registrarse para el acceso anticipado no es lo mismo que comenzar la prueba gratis de 14 días de PermitDraft Core, y no crea una cuenta ni inicia la prueba por usted.")}</p>
        <h3>{t("What to do next", "Qué hacer ahora")}</h3>
        <p>{t("To start the free 14-day Core trial yourself, go to", "Para comenzar usted mismo la prueba gratis de 14 días de Core, vaya a")} <a href="#core-offer" className="underline font-semibold" data-testid="pilot-done-trial">{t("PermitDraft Core on this page", "PermitDraft Core en esta página")}</a>{t(", sign in with Google or an emailed code, then choose “Start free trial”. No card is needed.", ", inicie sesión con Google o con un código enviado por correo y elija «Comenzar prueba gratis». No se necesita tarjeta.")}</p>
        <p>{t("Want to see the workflow first? ", "¿Quiere ver el flujo primero? ")}<Link to="/demo" className="underline font-semibold" data-testid="pilot-done-demo">{t("Try the free PermitDraft Demo", "Probar la demo gratuita de PermitDraft")}</Link>{t(": every step, no sign-in or card.", ": todos los pasos, sin iniciar sesión ni tarjeta.")}</p>
      </section></div>
    );
  return (
    <div className="ap-signup-col">
    <section className="ap-card" aria-labelledby="pe-h" data-testid="pilot-info">
      <h2 id="pe-h">{t("Who qualifies for Early Access", "Quién califica para el acceso anticipado")}</h2>
      <p className="ap-muted">{t("Licensed residential HVAC contractors in California, Arizona, Texas or Las Vegas, Nevada (not the rest of Nevada) with 1–15 techs doing residential AC, heat pump, or furnace-and-coil change-outs.", "Contratistas residenciales de HVAC con licencia en California, Arizona, Texas o Las Vegas, Nevada (no el resto de Nevada) y de 1 a 15 técnicos que hacen cambios de aire acondicionado, bomba de calor o furnace y serpentín residenciales.")}</p>
      <h2 id="pw-h">{t("What you’ll try", "Qué probará")}</h2>
      <ul className="ap-list">
        <li>{t("Capturing job photos and notes.", "Capturar fotos y notas del trabajo.")}</li>
        <li>{t("Spotting missing paperwork details.", "Detectar detalles faltantes en el papeleo.")}</li>
        <li>{t("Reviewing how job evidence supports permit drafts before filing.", "Revisar cómo la evidencia del trabajo respalda los borradores de permiso antes de presentar.")}</li>
      </ul>
      <p className="ap-muted">{t("Early Access is for trying this out. It doesn’t give automatic access.", "El acceso anticipado es para probar esta herramienta. No da acceso automático.")}</p>
      <p className="ap-muted">{t("Before you join, try the free PermitDraft Demo, with no sign-in needed. Then tell us in the form below which missing equipment detail sends a job back to your crew most often.", "Antes de unirse, pruebe la demo gratuita de PermitDraft, sin registrarse. Luego díganos en el formulario de abajo qué dato de equipo que falta devuelve más trabajos a su equipo.")} <Link to="/demo" className="underline font-semibold">{t("Try the free PermitDraft Demo", "Probar la demo gratuita de PermitDraft")}</Link></p>
    </section>
    <section className="ap-card" id="pilot" aria-labelledby="pilot-h">
      <h2 id="pilot-h">{t("Get Early Access", "Obtenga acceso anticipado")}</h2>
      <p className="ap-muted">{t("Tell us who you are. Service for Las Vegas, Nevada starts November 23, 2026 (Pacific time). A request does not enroll you automatically.", "Díganos quién es. El servicio para Las Vegas, Nevada comienza el 23 de noviembre de 2026 (hora del Pacífico). Una solicitud no lo inscribe automáticamente.")}</p>
      <form onSubmit={submit} className="ap-form" noValidate>
        <div className="ap-field"><Label htmlFor="pc">{t("HVAC company name *", "Nombre de la empresa de HVAC *")}</Label><Input id="pc" name="company" value={f.company} onChange={set("company")} maxLength={150} autoComplete="organization" /></div>
        <div className="ap-field"><Label htmlFor="pn">{t("Contact name *", "Nombre de contacto *")}</Label><Input id="pn" name="contact" value={f.contact} onChange={set("contact")} maxLength={100} autoComplete="name" /></div>
        <div className="ap-field"><Label htmlFor="pe">{t("Work email *", "Correo de trabajo *")}</Label><Input id="pe" name="email" type="email" value={f.email} onChange={set("email")} maxLength={200} autoComplete="email" /></div>
        <div className="ap-field">
          <Label htmlFor="pk">{t("State or service area *", "Estado o área de servicio *")}</Label>
          <select id="pk" name="state" value={f.state} onChange={set("state")} className="border-input bg-white rounded-md border px-3" style={{ height: 56, fontSize: "1.1rem" }}>
            <option value="">{t("Choose a state or Las Vegas", "Elija un estado o Las Vegas")}</option>
            {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="ap-field"><Label htmlFor="pd">{t("Which missing equipment detail sends a job back to your crew most often?", "¿Qué dato de equipo que falta devuelve más trabajos a su equipo?")}</Label><Input id="pd" name="paperworkDelay" value={f.paperworkDelay} onChange={set("paperworkDelay")} maxLength={300} /></div>
        {state === "invalid" && <p role="alert" className="ap-muted">{t("Please fill in every field with a valid email.", "Complete todos los campos con un correo válido.")}</p>}
        {state === "fail" && <p role="alert" className="ap-muted">{t("Something went wrong and nothing was saved. Please try again.", "Algo salió mal y no se guardó nada. Inténtelo de nuevo.")}</p>}
        <button type="submit" className="ap-btn primary" disabled={!ready || state === "busy"}>
          {state === "busy" ? t("Sending…", "Enviando…") : state === "fail" ? t("Try again", "Reintentar") : t("Get Early Access", "Obtener acceso anticipado")}
        </button>
      </form>
    </section>
    </div>
  );
}

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
              <a href="#core-offer" className="ap-btn hp-text" data-testid="see-core-pricing">{t("Get Started", "Comenzar")}<ArrowRight size={18} aria-hidden /></a>
            </div>
            <p className="hp-sample">{t("No sign-in needed for the demo. The packet goes to your office for review; it is not a permit filing.", "La demo no requiere iniciar sesión. El paquete va a su oficina para revisión; no es la presentación de un permiso.")} <Link to="/sample-job">{t("See a sample permit draft (sample data, not a real job)", "Ver un borrador de permiso de muestra (datos de muestra, no es un trabajo real)")}</Link></p>
          </div>
          <ScreenPreview />
          <SignInCard />
        </div>
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

      <div className="hp-signup"><div className="ap-signup"><PilotForm /><CoreOffer /></div></div>
    </AppPage>
  );
}
