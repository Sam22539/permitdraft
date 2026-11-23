import { createFileRoute, Link } from "@tanstack/react-router";
import { AppPage } from "../components/app-shell";
import { useCorePath, useDemo } from "../components/demo";
import { useLang } from "../lib/lang";

export function SettingsScreen() {
  const { lang, setLang, t } = useLang();
  const p = useCorePath();
  const demo = useDemo();
  return (
    <AppPage bottom>
      <h1 className="text-3xl">{t("Settings", "Ajustes")}</h1>
      <section className="ap-card" aria-labelledby="st-lang">
        <h2 id="st-lang" className="ap-h2">{t("Language", "Idioma")}</h2>
        <p className="ap-muted">{t("Choose the language PermitDraft shows. It is saved in this browser.", "Elija el idioma que muestra PermitDraft. Se guarda en este navegador.")}</p>
        <div className="flex gap-2" role="group" aria-label={t("Language", "Idioma")}>
          <button type="button" className={`ap-btn ${lang === "en" ? "primary" : "ghost"}`} aria-pressed={lang === "en"} data-testid="st-en" onClick={() => setLang("en")}>English</button>
          <button type="button" className={`ap-btn ${lang === "es" ? "primary" : "ghost"}`} aria-pressed={lang === "es"} data-testid="st-es" onClick={() => setLang("es")}>Español</button>
        </div>
      </section>
      {!demo && (
        <section className="ap-card" aria-labelledby="st-profile">
          <h2 id="st-profile" className="ap-h2">{t("Profile and password", "Perfil y contraseña")}</h2>
          <p className="ap-muted">{t("Your display name, verified work email, company, role and PermitDraft password: ", "Su nombre, correo de trabajo verificado, empresa, rol y contraseña de PermitDraft: ")}<Link to="/profile" className="underline font-semibold" data-testid="st-profile">{t("Profile", "Perfil")}</Link></p>
        </section>
      )}
      {!demo && (
        <section className="ap-card" aria-labelledby="st-office">
          <h2 id="st-office" className="ap-h2">{t("Office handoff email", "Correo de entrega a oficina")}</h2>
          <p className="ap-muted">{t("Your company, its people and the verified office inbox that hears when a job is finished: ", "Su empresa, su gente y el buzón verificado de oficina que recibe aviso cuando se termina un trabajo: ")}<Link to="/office-setup" className="underline font-semibold" data-testid="st-office-setup">{t("Office setup", "Configuración de oficina")}</Link></p>
        </section>
      )}
      <Link to={p("/jobs")} className="ap-btn ghost" data-testid="st-back">{t("Back to Jobs", "Volver a Trabajos")}</Link>
    </AppPage>
  );
}

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — PermitDraft" }, { name: "description", content: "Choose English or Spanish for PermitDraft." }] }),
  component: SettingsScreen,
});
