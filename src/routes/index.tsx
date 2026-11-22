import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { joinPilot, US_STATES } from "../lib/pilot";
import { AppPage } from "../components/app-shell";
import { CoreOffer } from "../components/core-offer";
import { useLang } from "../lib/lang";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "PermitDraft — permit paperwork before you leave the driveway" }, { name: "description", content: "Add job details, take the checklist photos, review the draft and export. A documentation workflow for residential HVAC contractors in California, Arizona and Texas." }] }),
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
        <h2>{t("Thanks — we got your interest.", "Gracias: recibimos su interés.")}</h2>
        <p className="ap-muted">{t("We'll email you at", "Le escribiremos a")} {f.email} {t("about the pilot.", "sobre el piloto.")}</p>
      </section></div>
    );
  return (
    <div className="ap-signup-col">
    <section className="ap-card" aria-labelledby="pe-h" data-testid="pilot-info">
      <h2 id="pe-h">{t("Who qualifies for the pilot", "Quién califica para el piloto")}</h2>
      <p className="ap-muted">{t("Licensed residential HVAC contractors in California, Arizona or Texas with 1–15 techs doing residential AC, heat pump, or furnace-and-coil change-outs.", "Contratistas residenciales de HVAC con licencia en California, Arizona o Texas y de 1 a 15 técnicos que hacen cambios de aire acondicionado, bomba de calor o furnace y serpentín residenciales.")}</p>
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
      <h2 id="pilot-h">{t("Join the pilot", "Únase al piloto")}</h2>
      <p className="ap-muted">{t("Residential HVAC companies in California, Arizona or Texas: tell us who you are.", "Empresas residenciales de HVAC en California, Arizona o Texas: díganos quién es.")}</p>
      <form onSubmit={submit} className="ap-form" noValidate>
        <div className="ap-field"><Label htmlFor="pc">{t("HVAC company name *", "Nombre de la empresa de HVAC *")}</Label><Input id="pc" name="company" value={f.company} onChange={set("company")} maxLength={150} autoComplete="organization" /></div>
        <div className="ap-field"><Label htmlFor="pn">{t("Contact name *", "Nombre de contacto *")}</Label><Input id="pn" name="contact" value={f.contact} onChange={set("contact")} maxLength={100} autoComplete="name" /></div>
        <div className="ap-field"><Label htmlFor="pe">{t("Work email *", "Correo de trabajo *")}</Label><Input id="pe" name="email" type="email" value={f.email} onChange={set("email")} maxLength={200} autoComplete="email" /></div>
        <div className="ap-field">
          <Label htmlFor="pk">{t("State *", "Estado *")}</Label>
          <select id="pk" name="state" value={f.state} onChange={set("state")} className="border-input bg-white rounded-md border px-3" style={{ height: 56, fontSize: "1.1rem" }}>
            <option value="">{t("Choose a state", "Elija un estado")}</option>
            {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="ap-field"><Label htmlFor="pd">{t("What slows you down most when preparing permit paperwork?", "¿Qué es lo que más te retrasa al preparar la documentación para permisos?")}</Label><Input id="pd" name="paperworkDelay" value={f.paperworkDelay} onChange={set("paperworkDelay")} maxLength={300} /></div>
        {state === "invalid" && <p role="alert" className="ap-muted">{t("Please fill in every field with a valid email.", "Complete todos los campos con un correo válido.")}</p>}
        {state === "fail" && <p role="alert" className="ap-muted">{t("Something went wrong and nothing was saved. Please try again.", "Algo salió mal y no se guardó nada. Inténtelo de nuevo.")}</p>}
        <button type="submit" className="ap-btn primary" disabled={!ready || state === "busy"}>
          {state === "busy" ? t("Sending…", "Enviando…") : state === "fail" ? t("Try again", "Reintentar") : t("Join the pilot", "Unirme al piloto")}
        </button>
      </form>
    </section>
    </div>
  );
}

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
        <h1>{t("Review the evidence before you file", "Revise la evidencia antes de presentar")}</h1>
        <p className="ap-muted">{t("In a sample heat-pump permit draft, the office can see the photo, note or reading behind each field and spot missing information before anything is filed.", "En un borrador de muestra de permiso para bomba de calor, la oficina puede ver la foto, la nota o la lectura detrás de cada campo y detectar la información que falta antes de presentar nada.")}</p>
      </section>
      <ol className="ap-steps">
        {steps.map((s, i) => (
          <li key={i}><span className="ap-num">{i + 1}</span><span>{s}</span></li>
        ))}
      </ol>
      <p className="rd-cov" data-testid="landing-coverage">{t("Honest coverage: the documentation workflow is open to residential HVAC contractors in California, Arizona and Texas only. PermitDraft checks that your paperwork is complete. Verified permit rules are not available in any state yet: it does not check any law or local rule, and it never says a job is compliant.", "Cobertura honesta: el flujo de documentación está abierto solo a contratistas residenciales de HVAC en California, Arizona y Texas. PermitDraft verifica que su papeleo esté completo. Aún no hay reglas de permisos verificadas en ningún estado: no verifica ninguna ley ni regla local, y nunca dice que un trabajo cumple.")}</p>
      <Link to="/demo" className="ap-btn primary" data-testid="try-demo">{t("Try the free demo", "Probar la demo gratis")}</Link>
      <a href="#core-offer" className="ap-core-jump" data-testid="see-core-pricing">{t("See Core pricing", "Ver precio de Core")}</a>
      <Link to="/sample-job" className="ap-btn ghost">{t("See a sample permit draft", "Ver un borrador de permiso de muestra")}</Link>
      <div className="ap-signup"><PilotForm /><CoreOffer /></div>
    </AppPage>
  );
}
