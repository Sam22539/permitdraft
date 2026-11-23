import { Link } from "@tanstack/react-router";
import { BookOpen, Briefcase, FilePlus2, Inbox, LayoutDashboard, Send, Settings, UserRound } from "lucide-react";
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
        {!mode && (
          <nav className="hp-nav" aria-label={home ? t("Home page", "Página de inicio") : t("Main", "Principal")}>
            <Link to="/" activeOptions={{ exact: true, includeHash: false }}>{t("Home", "Inicio")}</Link>
            <a href={home ? "#features" : "/#features"}>{t("Features", "Funciones")}</a>
            <a href={home ? "#how" : "/#how"}>{t("How It Works", "Cómo funciona")}</a>
            <a href={home ? "#core-offer" : "/#core-offer"}>{t("Pricing", "Precio")}</a>
            <Link to="/resources">{t("Resources", "Recursos")}</Link>
            <a href={home ? "#pilot" : "/#pilot"}>{t("Contact", "Contacto")}</a>
            <Link to="/sign-in" className="hp-nav-login">{t("Log In", "Iniciar sesión")}</Link>
            <a href={home ? "#core-offer" : "/#core-offer"} className="hp-nav-cta">{t("Get Started", "Comenzar")}</a>
          </nav>
        )}
        <div className="ap-lang" role="group" aria-label="Language">
          <button type="button" aria-pressed={lang === "en"} onClick={() => setLang("en")}>English</button>
          <button type="button" aria-pressed={lang === "es"} onClick={() => setLang("es")}>Español</button>
        </div>
      </div>
      {!mode && (
        <nav className="ap-subnav" aria-label={t("Main", "Principal")}>
          <a href={home ? "#features" : "/#features"}>{t("Features", "Funciones")}</a>
          <a href={home ? "#how" : "/#how"}>{t("How It Works", "Cómo funciona")}</a>
          <a href={home ? "#core-offer" : "/#core-offer"}>{t("Pricing", "Precio")}</a>
          <Link to="/coverage">{t("Coverage", "Cobertura")}</Link>
          <Link to="/resources">{t("Resources", "Recursos")}</Link>
          <a href={home ? "#pilot" : "/#pilot"}>{t("Contact", "Contacto")}</a>
          <Link to="/sign-in">{t("Log In", "Iniciar sesión")}</Link>
          <Link to="/demo" className="ap-subnav-cta">{t("Try Free Demo", "Probar la demo gratis")}</Link>
        </nav>
      )}
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

/** Computer screens: the fixed navy sidebar of Core and the demo, listing only screens that exist. */
export function SideNav() {
  const { t } = useLang();
  const demo = useDemo();
  const p = useCorePath();
  const items: { to: string; icon: typeof Briefcase; label: string; exact?: boolean; testid?: string }[] = [
    { to: p("/jobs"), icon: LayoutDashboard, label: t("Jobs dashboard", "Panel de trabajos"), exact: true },
    { to: p("/new"), icon: FilePlus2, label: t("New job", "Nuevo trabajo"), exact: true },
    { to: p("/office-handoff"), icon: Inbox, label: t("Office handoff", "Entrega a oficina") },
    ...(demo ? [] : [{ to: "/my-handoffs", icon: Send, label: t("Sent to office", "Enviados a la oficina") }]),
    { to: "/resources", icon: BookOpen, label: t("Resources", "Recursos") },
    { to: "/profile", icon: UserRound, label: t("Account", "Cuenta") },
    { to: p("/settings"), icon: Settings, label: t("Settings", "Ajustes") },
  ];
  return (
    <aside className="ap-side" aria-label={t("App menu", "Menú de la aplicación")}>
      <Link to="/" className="ap-side-logo">
        <Image src="/generated-assets/company-logo.png" alt="PermitDraft logo" width={32} height={32} />
        <span>PermitDraft</span>
      </Link>
      <span className={`ap-mode ${demo ? "demo" : "core"}`}>{demo ? t("Demo · sample data", "Demo · datos de muestra") : "Core"}</span>
      <nav className="ap-side-nav">
        {items.map((i) => (
          <Link key={i.to} to={i.to as never} activeOptions={{ exact: !!i.exact }} activeProps={{ className: "is-active", "aria-current": "page" } as never}>
            <i.icon size={19} aria-hidden />{i.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}

export function AppPage({ children, bottom, wide, capture, home, core }: { children: React.ReactNode; bottom?: boolean; wide?: boolean; capture?: boolean; home?: boolean; core?: boolean }) {
  const { t } = useLang();
  const demo = useDemo();
  return (
    <div className={`ap${capture ? " ap-capture" : ""}${demo || bottom || core ? " ap-has-side" : ""}`}>
      {(demo || bottom || core) && <SideNav />}
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
