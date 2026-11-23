import { Link } from "@tanstack/react-router";
import { BookOpen, Briefcase, Settings, UserRound } from "lucide-react";
import { Image } from "../image";
import { useLang } from "../lib/lang";
import { DemoBar, useCorePath, useDemo } from "./demo";
import "../app.css";

export function AppTop({ home, mode }: { home?: boolean; mode?: "demo" | "core" } = {}) {
  const { lang, setLang, t } = useLang();
  return (
    <div className={`ap-top${mode ? " ap-top-app" : ""}`}>
      {!mode && <div className="ap-banner" role="note">
        {t("Prototype · sample data · nothing is sent anywhere", "Prototipo · datos de muestra · no se envía nada")}
      </div>}
      <div className="ap-bar">
        <div className="ap-brand">
          <Link to="/" className="ap-logo">
            <Image src="/generated-assets/company-logo.png" alt="PermitDraft logo" width={32} height={32} />
            <span>PermitDraft</span>
          </Link>
          {mode && <span className={`ap-mode ${mode}`} data-testid="mode-label">{mode === "demo" ? "Demo" : "Core"}</span>}
        </div>
        {home && (
          <nav className="hp-nav" aria-label={t("Home page", "Página de inicio")}>
            <a href="#how">{t("How it works", "Cómo funciona")}</a>
            <a href="#core-offer">{t("Pricing", "Precio")}</a>
            <Link to="/coverage">{t("Coverage", "Cobertura")}</Link>
            <Link to="/resources">{t("Resources", "Recursos")}</Link>
            <Link to="/demo" className="hp-nav-cta">{t("Try the free demo", "Probar la demo gratis")}</Link>
          </nav>
        )}
        <div className="ap-lang" role="group" aria-label="Language">
          <button type="button" aria-pressed={lang === "en"} onClick={() => setLang("en")}>English</button>
          <button type="button" aria-pressed={lang === "es"} onClick={() => setLang("es")}>Español</button>
        </div>
      </div>
    </div>
  );
}

export function BottomBar({ current: _current }: { current?: "jobs" }) {
  const { t } = useLang();
  const p = useCorePath();
  return (
    <nav className="ap-bottom" aria-label="Main">
      <Link to={p("/jobs")} activeProps={{ className: "ap-tab is-active" }} className="ap-tab">
        <Briefcase size={22} aria-hidden />
        {t("Jobs", "Trabajos")}
      </Link>
      <Link to={p("/new")} className="ap-new">{t("+ New job", "+ Nuevo trabajo")}</Link>
      <Link to="/resources" className="ap-tab">
        <BookOpen size={22} aria-hidden />
        {t("Resources", "Recursos")}
      </Link>
      <Link to="/profile" className="ap-tab" activeProps={{ className: "ap-tab is-active" }} data-testid="nav-account">
        <UserRound size={22} aria-hidden />
        {t("Account", "Cuenta")}
      </Link>
      <Link to={p("/settings")} className="ap-tab" activeProps={{ className: "ap-tab is-active" }} data-testid="nav-settings">
        <Settings size={22} aria-hidden />
        {t("Settings", "Ajustes")}
      </Link>
    </nav>
  );
}

export function AppPage({ children, bottom, wide, capture, home, core }: { children: React.ReactNode; bottom?: boolean; wide?: boolean; capture?: boolean; home?: boolean; core?: boolean }) {
  const { t } = useLang();
  const demo = useDemo();
  return (
    <div className={`ap${capture ? " ap-capture" : ""}`}>
      <AppTop home={home} mode={demo ? "demo" : bottom || core ? "core" : undefined} />
      <main className={`${home ? "hp-main" : "ap-main"} ${bottom ? "has-bottom" : ""} ${wide ? "jb-main" : ""} ${capture ? "cx-main" : ""}`}>{demo && <DemoBar />}{children}</main>
      <footer className={`ap-foot ${bottom ? "has-bottom" : ""}`}>
        <p>{t("Draft only. Not a guarantee of compliance. Contractor review and signature required.", "Solo borrador. No garantiza el cumplimiento. Se requiere revisión y firma del contratista.")}</p>
        <Link to="/coverage" className="underline font-semibold">{t("What PermitDraft covers", "Qué cubre PermitDraft")}</Link>
        <Link to="/resources" className="underline font-semibold">{t("Official resources", "Recursos oficiales")}</Link>
      </footer>
      {bottom && <BottomBar current="jobs" />}
    </div>
  );
}
