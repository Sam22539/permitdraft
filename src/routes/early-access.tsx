import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { joinPilot, US_STATES } from "../lib/pilot";
import { AppPage } from "../components/app-shell";
import { useLang } from "../lib/lang";

export const Route = createFileRoute("/early-access")({
  head: () => ({ meta: [{ title: "Early Access — PermitDraft" }, { name: "description", content: "Request PermitDraft Early Access: for licensed residential HVAC contractors in California, Arizona, Texas and Las Vegas, Nevada. Separate from the free Core trial and from creating an account." }] }),
  component: EarlyAccess,
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
      <div className="ap-signup-col"><section className="ap-card ea-card" id="pilot" data-testid="pilot-done" role="status">
        <h2>{t("Thanks — we received your Early Access signup.", "Gracias: recibimos su registro de acceso anticipado.")}</h2>
        <p className="ap-muted">{t("We saved your details for", "Guardamos sus datos de")} {f.company} {t("with the work email", "con el correo de trabajo")} {f.email}. {t("Service area:", "Área de servicio:")} {f.state}. {t("Signing up for Early Access is not the same as starting the free 14-day PermitDraft Core trial, and it does not create an account or start the trial for you.", "Registrarse para el acceso anticipado no es lo mismo que comenzar la prueba gratis de 14 días de PermitDraft Core, y no crea una cuenta ni inicia la prueba por usted.")}</p>
        <h3>{t("What to do next", "Qué hacer ahora")}</h3>
        <p>{t("To start the free 14-day Core trial yourself, go to", "Para comenzar usted mismo la prueba gratis de 14 días de Core, vaya a")} <Link to="/" hash="core-offer" className="underline font-semibold" data-testid="pilot-done-trial">{t("PermitDraft Core", "PermitDraft Core")}</Link>{t(", sign in with Google or an emailed code, then choose “Start free trial”. No card is needed.", ", inicie sesión con Google o con un código enviado por correo y elija «Comenzar prueba gratis». No se necesita tarjeta.")}</p>
        <p>{t("Want to see the workflow first? ", "¿Quiere ver el flujo primero? ")}<Link to="/demo" className="underline font-semibold" data-testid="pilot-done-demo">{t("Try the free PermitDraft Demo", "Probar la demo gratuita de PermitDraft")}</Link>{t(": every step, no sign-in or card.", ": todos los pasos, sin iniciar sesión ni tarjeta.")}</p>
      </section></div>
    );
  return (
    <div className="ap-signup-col">
    <section className="ap-card ea-card" aria-labelledby="pe-h" data-testid="pilot-info">
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
    <section className="ap-card ea-card" id="pilot" aria-labelledby="pilot-h">
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
        <button type="submit" className="ap-btn primary" disabled={state === "busy"}>
          {state === "busy" ? t("Sending…", "Enviando…") : state === "fail" ? t("Try again", "Reintentar") : t("Get Early Access", "Obtener acceso anticipado")}
        </button>
      </form>
    </section>
    </div>
  );
}


function EarlyAccess() {
  const { t } = useLang();
  return (
    <AppPage>
      <div className="ea-page">
        <p className="hp-kicker">{t("For HVAC contractors", "Para contratistas de HVAC")}</p>
        <h1 className="ea-title">{t("Early Access", "Acceso anticipado")}</h1>
        <PilotForm />
      </div>
    </AppPage>
  );
}
