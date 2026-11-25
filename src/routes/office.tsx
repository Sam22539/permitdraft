import { createFileRoute, Link } from "@tanstack/react-router";
import { AppPage } from "../components/app-shell";
import { SignInForm } from "../components/core-offer";
import { OfficeDashboard, useOfficeDashboard } from "../components/office/dashboard";
import { useLang } from "../lib/lang";

export const Route = createFileRoute("/office")({
  head: () => ({ meta: [{ title: "Office dashboard — PermitDraft" }, { name: "description", content: "Your company's permit packets: what needs review, what is ready to submit, and what was recorded." }, { name: "robots", content: "noindex" }] }),
  component: OfficePage,
});

/** The office portal home, for a signed-in admin or office member of a company (the database's rules decide what shows). */
function OfficePage() {
  const { t } = useLang();
  const { data, state } = useOfficeDashboard();
  if (state === "ready" && data) return <OfficeDashboard data={data} />;
  return (
    <AppPage core>
      <h1 className="cx-h1">{t("Office dashboard", "Panel de oficina")}</h1>
      {state === "loading" && <p className="ap-muted" role="status">{t("Checking your access…", "Comprobando su acceso…")}</p>}
      {state === "signed-out" && (<><p className="ap-muted">{t("Sign in with your company email to open your office.", "Inicie sesión con el correo de su empresa para abrir su oficina.")}</p><SignInForm returnTo="/office" /></>)}
      {state === "no-company" && (<><p className="ap-muted">{t("This email is not part of a company yet.", "Este correo aún no pertenece a una empresa.")}</p><Link to="/office-setup" className="ap-btn primary">{t("Set up your office", "Configurar su oficina")}</Link></>)}
      <Link to="/demo/office" className="underline font-semibold">{t("See the office with sample data", "Ver la oficina con datos de muestra")}</Link>
    </AppPage>
  );
}
