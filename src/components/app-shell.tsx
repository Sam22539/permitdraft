import { Link } from "@tanstack/react-router";
import { Briefcase, Settings } from "lucide-react";
import { Image } from "../image";
import { useLang } from "../lib/lang";
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
  return (
    <nav className="ap-bottom" aria-label="Main">
      <Link to="/jobs" aria-current={current === "jobs" ? "page" : undefined} className="ap-tab">
        <Briefcase size={22} aria-hidden />
        {t("Jobs", "Trabajos")}
      </Link>
      <Link to="/new" className="ap-new">{t("+ New job", "+ Nuevo trabajo")}</Link>
      <Link to="/jobs" className="ap-tab">
        <Settings size={22} aria-hidden />
        {t("Settings", "Ajustes")}
      </Link>
    </nav>
  );
}

export function AppPage({ children, bottom }: { children: React.ReactNode; bottom?: boolean }) {
  return (
    <div className="ap">
      <AppTop />
      <main className={`ap-main ${bottom ? "has-bottom" : ""}`}>{children}</main>
      {bottom && <BottomBar current="jobs" />}
    </div>
  );
}
