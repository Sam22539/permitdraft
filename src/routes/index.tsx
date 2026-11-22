import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { joinPilot } from "../lib/pilot";
import { AppPage } from "../components/app-shell";
import { useLang } from "../lib/lang";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "PermitDraft — permit paperwork before you leave the driveway" }, { name: "description", content: "Add job details, take the checklist photos, review the draft and export." }] }),
  component: Start,
});

function PilotForm() {
  const { t } = useLang();
  const [ready, setReady] = useState(false);
  const [f, setF] = useState({ company: "", contact: "", email: "", county: "" });
  const [state, setState] = useState<"idle" | "busy" | "done" | "fail" | "invalid">("idle");
  useEffect(() => setReady(true), []);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.company.trim() || !f.contact.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim()) || !f.county) { setState("invalid"); return; }
    setState("busy");
    try { await joinPilot({ data: f }); setState("done"); } catch { setState("fail"); }
  };
  if (state === "done")
    return (
      <section className="ap-card" id="pilot" data-testid="pilot-done" role="status">
        <h2>{t("Thanks — we got your interest.", "Gracias: recibimos su interés.")}</h2>
        <p className="ap-muted">{t("We'll email you at", "Le escribiremos a")} {f.email} {t("about the pilot.", "sobre el piloto.")}</p>
      </section>
    );
  return (
    <section className="ap-card" id="pilot" aria-labelledby="pilot-h">
      <h2 id="pilot-h">{t("Join the pilot", "Únase al piloto")}</h2>
      <p className="ap-muted">{t("Sacramento and San Diego HVAC companies: tell us who you are.", "Empresas de HVAC de Sacramento y San Diego: díganos quién es.")}</p>
      <form onSubmit={submit} className="ap-form" noValidate>
        <div className="ap-field"><Label htmlFor="pc">{t("HVAC company name *", "Nombre de la empresa de HVAC *")}</Label><Input id="pc" name="company" value={f.company} onChange={set("company")} maxLength={150} autoComplete="organization" /></div>
        <div className="ap-field"><Label htmlFor="pn">{t("Contact name *", "Nombre de contacto *")}</Label><Input id="pn" name="contact" value={f.contact} onChange={set("contact")} maxLength={100} autoComplete="name" /></div>
        <div className="ap-field"><Label htmlFor="pe">{t("Work email *", "Correo de trabajo *")}</Label><Input id="pe" name="email" type="email" value={f.email} onChange={set("email")} maxLength={200} autoComplete="email" /></div>
        <div className="ap-field">
          <Label htmlFor="pk">{t("County *", "Condado *")}</Label>
          <select id="pk" name="county" value={f.county} onChange={set("county")} className="border-input bg-white rounded-md border px-3" style={{ height: 56, fontSize: "1.1rem" }}>
            <option value="">{t("Choose a county", "Elija un condado")}</option>
            <option value="Sacramento">Sacramento</option>
            <option value="San Diego">San Diego</option>
          </select>
        </div>
        {state === "invalid" && <p role="alert" className="ap-muted">{t("Please fill in every field with a valid email.", "Complete todos los campos con un correo válido.")}</p>}
        {state === "fail" && <p role="alert" className="ap-muted">{t("Something went wrong and nothing was saved. Please try again.", "Algo salió mal y no se guardó nada. Inténtelo de nuevo.")}</p>}
        <button type="submit" className="ap-btn primary" disabled={!ready || state === "busy"}>
          {state === "busy" ? t("Sending…", "Enviando…") : state === "fail" ? t("Try again", "Reintentar") : t("Join the pilot", "Unirme al piloto")}
        </button>
      </form>
    </section>
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
        <h1>{t("Permit paperwork, done before you leave the driveway.", "El papeleo del permiso, listo antes de salir del camino de entrada.")}</h1>
      </section>
      <ol className="ap-steps">
        {steps.map((s, i) => (
          <li key={i}><span className="ap-num">{i + 1}</span><span>{s}</span></li>
        ))}
      </ol>
      <Link to="/jobs" className="ap-btn primary">{t("Try a sample job", "Probar un trabajo de muestra")}</Link>
      <Link to="/jobs" className="ap-btn ghost">{t("Explore with sample jobs", "Explorar con trabajos de muestra")}</Link>
      <PilotForm />
    </AppPage>
  );
}
