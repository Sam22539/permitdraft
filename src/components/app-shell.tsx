import { Link } from "@tanstack/react-router";
import { BookOpen, Briefcase, Settings } from "lucide-react";
import { Image } from "../image";
import { useLang } from "../lib/lang";
import { DemoBar, useCorePath, useDemo } from "./demo";
import "../app.css";

export function AppTop() {
  const { lang, setLang, t } = useLang();
  return (
    <div className="ap-top">
      <div className="ap-banner" role="note">
        {t("Prototype · sample data · nothing is sent anywhere", "Prototipo · datos de muestra · no se envía nada")}
      </div>
      <div className="ap-bar">
        <Link to="/" className="ap-logo">
          <Image src="/generated-assets/company-logo.png" alt="PermitDraft logo" width={32} height={32} />
          <span>PermitDraft</span>
        </Link>
        <div className="ap-lang" role="group" aria-label="Language">
          <button type="button" aria-pressed={lang === "en"} onClick={() => setLang("en")}>English</button>
          <button type="button" aria-pressed={lang === "es"} onClick={() => setLang("es")}>Español</button>
        </div>
      </div>
    </div>
  );
}

export function BottomBar({ current }: { current?: "jobs" }) {
  const { t } = useLang();
  const p = useCorePath();
  return (
    <nav className="ap-bottom" aria-label="Main">
      <Link to={p("/jobs")} activeProps={{ "aria-current": undefined } as never} className={`ap-tab${current === "jobs" ? " is-active" : ""}`}>
        <Briefcase size={22} aria-hidden />
        {t("Jobs", "Trabajos")}
      </Link>
      <Link to={p("/new")} className="ap-new">{t("+ New job", "+ Nuevo trabajo")}</Link>
      <Link to="/resources" className="ap-tab">
        <BookOpen size={22} aria-hidden />
        {t("Resources", "Recursos")}
      </Link>
      <Link to={p("/jobs")} activeProps={{ "aria-current": undefined } as never} className="ap-tab">
        <Settings size={22} aria-hidden />
        {t("Settings", "Ajustes")}
      </Link>
    </nav>
  );
}

export function AppPage({ children, bottom, wide, capture }: { children: React.ReactNode; bottom?: boolean; wide?: boolean; capture?: boolean }) {
  const { t } = useLang();
  const demo = useDemo();
  return (
    <div className="ap">
      <AppTop />
      <main className={`ap-main ${bottom ? "has-bottom" : ""} ${wide ? "jb-main" : ""} ${capture ? "cx-main" : ""}`}>{demo && <DemoBar />}{children}</main>
      <footer className={`ap-foot ${bottom ? "has-bottom" : ""}`}>
        <p>{t("Draft only. Not a guarantee of compliance. Contractor review and signature required.", "Solo borrador. No garantiza el cumplimiento. Se requiere revisión y firma del contratista.")}</p>
        <Link to="/coverage" className="underline font-semibold">{t("What PermitDraft covers", "Qué cubre PermitDraft")}</Link>
        <Link to="/resources" className="underline font-semibold">{t("Official resources", "Recursos oficiales")}</Link>
      </footer>
      {bottom && <BottomBar current="jobs" />}
    </div>
  );
}
