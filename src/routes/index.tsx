import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { joinPilot, US_STATES } from "../lib/pilot";
import { AppPage } from "../components/app-shell";
import { CoreOffer } from "../components/core-offer";
import { useLang } from "../lib/lang";
import { useSessionEmail } from "../components/core-offer";
import { DEMO_PHOTO } from "../components/demo";
import { Image } from "../image";
import { BarChart3, Check, CheckSquare, FilePlus2, Home, Layers, LogIn, MapPin, Play, Search, SearchCheck, Send, ShieldCheck, UserPlus } from "lucide-react";
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
      <h2 id="pe-h">{t("Who qualifies for the pilot", "Quién califica para el piloto")}</h2>
      <p className="ap-muted">{t("Licensed residential HVAC contractors in California, Arizona, Texas or Las Vegas, Nevada (not the rest of Nevada) with 1–15 techs doing residential AC, heat pump, or furnace-and-coil change-outs.", "Contratistas residenciales de HVAC con licencia en California, Arizona, Texas o Las Vegas, Nevada (no el resto de Nevada) y de 1 a 15 técnicos que hacen cambios de aire acondicionado, bomba de calor o furnace y serpentín residenciales.")}</p>
      <h2 id="pw-h">{t("What you’ll try", "Qué probará")}</h2>
      <ul className="ap-list">
        <li>{t("Capturing job photos and notes.", "Capturar fotos y notas del trabajo.")}</li>
        <li>{t("Spotting missing paperwork details.", "Detectar detalles faltantes en el papeleo.")}</li>
        <li>{t("Reviewing how job evidence supports permit drafts before filing.", "Revisar cómo la evidencia del trabajo respalda los borradores de permiso antes de presentar.")}</li>
      </ul>
      <p className="ap-muted">{t("The pilot is for trying this out. It doesn’t give automatic access, and nothing is filed for you.", "El piloto es para probar esta herramienta. No da acceso automático y no se presenta nada por usted.")}</p>
      <p className="ap-muted">{t("Before you join, try the free PermitDraft Demo, with no sign-in needed. Then tell us in the form below which missing equipment detail sends a job back to your crew most often.", "Antes de unirse, pruebe la demo gratuita de PermitDraft, sin registrarse. Luego díganos en el formulario de abajo qué dato de equipo que falta devuelve más trabajos a su equipo.")} <Link to="/demo" className="underline font-semibold">{t("Try the free PermitDraft Demo", "Probar la demo gratuita de PermitDraft")}</Link></p>
    </section>
    <section className="ap-card" id="pilot" aria-labelledby="pilot-h">
      <h2 id="pilot-h">{t("Get Early Access", "Obtenga acceso anticipado")}</h2>
      <p className="ap-muted">{t("Residential HVAC companies in California, Arizona, Texas or Las Vegas, Nevada: tell us who you are. Service for Las Vegas, Nevada starts November 23, 2026 (Pacific time) and covers Las Vegas only, not the rest of Nevada. A request does not enroll you automatically.", "Empresas residenciales de HVAC en California, Arizona, Texas o Las Vegas, Nevada: díganos quién es. El servicio para Las Vegas, Nevada comienza el 23 de noviembre de 2026 (hora del Pacífico) y cubre solo Las Vegas, no el resto de Nevada. Una solicitud no lo inscribe automáticamente.")}</p>
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

function SignInCard() {
  const { t } = useLang();
  const email = useSessionEmail();
  return (
    <section className="hp-signin" aria-labelledby="hp-signin-h" data-testid="home-sign-in">
      <h2 id="hp-signin-h">{t("Log in to PermitDraft", "Inicie sesión en PermitDraft")}</h2>
      {email ? (
        <>
          <p className="hp-small">{t("Signed in as", "Sesión iniciada como")} {email}</p>
          <Link to="/jobs" className="ap-btn primary" data-testid="home-open-jobs">{t("Open my jobs", "Abrir mis trabajos")}</Link>
          <Link to="/profile" className="ap-btn ghost">{t("Account", "Cuenta")}</Link>
        </>
      ) : (
        <>
          <p className="hp-small">{t("Open your jobs, drafts and office handoffs.", "Abra sus trabajos, borradores y entregas a la oficina.")}</p>
          <Link to="/sign-in" className="ap-btn primary" data-testid="home-log-in"><LogIn size={20} aria-hidden />{t("Log in", "Iniciar sesión")}</Link>
          <div className="hp-or"><span>{t("or", "o")}</span></div>
          <Link to="/sign-in" className="ap-btn ghost" data-testid="home-create"><UserPlus size={20} aria-hidden />{t("Create account", "Crear cuenta")}</Link>
          <p className="hp-small">{t("Forgot your password?", "¿Olvidó su contraseña?")} <Link to="/sign-in" className="underline font-semibold" data-testid="home-forgot">{t("Reset it on the sign-in page", "Restablézcala en la página de inicio de sesión")}</Link></p>
        </>
      )}
    </section>
  );
}

function DraftCard() {
  const { t } = useLang();
  const items = [
    t("Job details captured", "Detalles del trabajo capturados"),
    t("Equipment data plate photo", "Foto de la placa de datos del equipo"),
    t("Checklist photos & notes", "Fotos y notas de la lista"),
    t("Missing details flagged", "Detalles faltantes marcados"),
  ];
  return (
    <div className="hp-draft" aria-label={t("Example permit draft card", "Tarjeta de ejemplo de borrador de permiso")} role="img">
      <div className="hp-draft-brand"><Image src="/generated-assets/company-logo.png" alt="" width={22} height={22} /><span>Permit<b>Draft</b></span></div>
      <p className="hp-draft-title">{t("Heat pump permit draft", "Borrador de permiso de bomba de calor")}</p>
      <ul>
        {items.map((i) => <li key={i}><CheckSquare size={16} aria-hidden />{i}</li>)}
      </ul>
      <p className="hp-draft-stamp"><Check size={18} aria-hidden />{t("Sent to office", "Enviado a la oficina")}</p>
      <p className="hp-draft-note">{t("Draft for contractor review — not a filed permit", "Borrador para revisión del contratista: no es un permiso presentado")}</p>
    </div>
  );
}

function Start() {
  const { t } = useLang();
  const steps = [
    { icon: FilePlus2, title: t("Capture", "Capturar"), text: t("Job details, the equipment data plate and checklist photos.", "Detalles del trabajo, la placa de datos del equipo y las fotos de la lista.") },
    { icon: Search, title: t("Review", "Revisar"), text: t("Review the draft and fix flagged items.", "Revise el borrador y corrija lo marcado.") },
    { icon: Send, title: t("Send to office", "Enviar a la oficina"), text: t("Finish sends one private job packet to your office.", "Al Finalizar se envía un paquete privado del trabajo a su oficina.") },
    { icon: BarChart3, title: t("Track", "Seguir"), text: t("Follow inspection status on each job.", "Siga el estado de la inspección de cada trabajo.") },
  ];
  const benefits = [
    { icon: SearchCheck, title: t("Spot missing details", "Detecte detalles faltantes"), text: t("PermitDraft checks that your paperwork is complete.", "PermitDraft verifica que su papeleo esté completo.") },
    { icon: ShieldCheck, title: t("Evidence behind each field", "Evidencia detrás de cada campo"), text: t("The office sees the photo, note or reading behind each field.", "La oficina ve la foto, la nota o la lectura detrás de cada campo.") },
    { icon: Layers, title: t("One packet per job", "Un paquete por trabajo"), text: t("Photos, notes and the draft go to the office together.", "Fotos, notas y el borrador llegan juntos a la oficina.") },
  ];
  const places = ["California", "Arizona", "Texas", "Las Vegas, Nevada"];
  return (
    <AppPage home>
      <section className="hp-hero">
        <div className="hp-hero-in">
          <div className="hp-copy">
            <p className="hp-eyebrow">{t("Residential HVAC permit paperwork", "Papeleo de permisos residenciales de HVAC")}</p>
            <h1>{t("Capture the job.", "Capture el trabajo.")} <span>{t("Send it to the office.", "Envíelo a la oficina.")}</span></h1>
            <p className="hp-lead">{t("Add job details and equipment from the data plate, take the checklist photos and review the draft. The office sees the photo, note or reading behind each field and spots missing information before anything is filed.", "Agregue los detalles del trabajo y del equipo desde la placa de datos, tome las fotos de la lista y revise el borrador. La oficina ve la foto, la nota o la lectura detrás de cada campo y detecta lo que falta antes de presentar nada.")}</p>
            <div className="hp-ctas">
              <Link to="/demo" className="ap-btn primary" data-testid="try-demo"><Play size={18} fill="currentColor" aria-hidden />{t("Try the free demo", "Probar la demo gratis")}</Link>
              <a href="#core-offer" className="ap-btn hp-outline" data-testid="see-core-pricing">{t("See Core pricing", "Ver precio de Core")}</a>
            </div>
            <p className="hp-sample">{t("No sign-in needed for the demo.", "La demo no requiere iniciar sesión.")} <Link to="/sample-job">{t("See a sample permit draft", "Ver un borrador de permiso de muestra")}</Link></p>
          </div>
          <div className="hp-visual">
            <div className="hp-photo"><Image src={DEMO_PHOTO} alt={t("Heat pump outdoor unit data plate", "Placa de datos de una unidad exterior de bomba de calor")} width={1024} height={1024} priority /></div>
            <DraftCard />
          </div>
          <SignInCard />
        </div>
      </section>

      <section className="hp-flow" id="how" aria-labelledby="hp-flow-h">
        <div className="hp-flow-head">
          <p className="hp-kicker">{t("The PermitDraft process", "El proceso de PermitDraft")}</p>
          <h2 id="hp-flow-h">{t("A complete job workflow", "Un flujo de trabajo completo")}</h2>
        </div>
        <ol className="hp-steps">
          {steps.map((s) => (
            <li key={s.title}><s.icon size={30} strokeWidth={1.75} aria-hidden /><strong>{s.title}</strong><span>{s.text}</span></li>
          ))}
        </ol>
      </section>

      <section className="hp-benefits" aria-label={t("Why PermitDraft", "Por qué PermitDraft")}>
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
        <p className="hp-cov" data-testid="landing-coverage">{t("Honest coverage: the documentation workflow is open to residential HVAC contractors in California, Arizona, Texas and Las Vegas, Nevada only (not the rest of Nevada; Las Vegas from November 23, 2026, Pacific time). PermitDraft checks that your paperwork is complete. Verified permit rules are not available in any state yet: it does not check any law or local rule, and it never says a job is compliant. Permit documentation is for contractor review only: local rule checks and direct filing are not offered in this rollout.", "Cobertura honesta: el flujo de documentación está abierto solo a contratistas residenciales de HVAC en California, Arizona, Texas y Las Vegas, Nevada (no el resto de Nevada; Las Vegas desde el 23 de noviembre de 2026, hora del Pacífico). PermitDraft verifica que su papeleo esté completo. Aún no hay reglas de permisos verificadas en ningún estado: no verifica ninguna ley ni regla local, y nunca dice que un trabajo cumple. La documentación de permisos es solo para revisión del contratista: la verificación de reglas locales y la presentación directa no se ofrecen en este lanzamiento.")} <Link to="/coverage">{t("What PermitDraft covers", "Qué cubre PermitDraft")}</Link></p>
      </section>

      <div className="hp-signup"><div className="ap-signup"><PilotForm /><CoreOffer /></div></div>
    </AppPage>
  );
}
