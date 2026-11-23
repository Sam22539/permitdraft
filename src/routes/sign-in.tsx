import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { AppPage } from "../components/app-shell";
import { safeRedirect } from "../components/account-form";
import { SignInForm, useSessionEmail } from "../components/core-offer";
import { useLang } from "../lib/lang";
import { Image } from "../image";

export const Route = createFileRoute("/sign-in")({
  validateSearch: (s: Record<string, unknown>): { redirect?: string } => (typeof s.redirect === "string" ? { redirect: s.redirect.slice(0, 500) } : {}),
  head: () => ({ meta: [{ title: "Sign in or create your account — PermitDraft" }, { name: "description", content: "Sign in to PermitDraft with your work email and PermitDraft password, create an account, or reset a forgotten password." }] }),
  component: SignInPage,
});

function SignInPage() {
  const { t } = useLang();
  const { redirect } = Route.useSearch();
  const to = safeRedirect(redirect);
  const email = useSessionEmail();
  const navigate = useNavigate();
  useEffect(() => { if (email) void navigate({ to: to as never }); }, [email, to, navigate]);
  return (
    <AppPage>
      <div className="sg-welcome">
        <div className="sg-photo"><Image src="/generated-assets/07845502ccc4fa8e1a8c5493226e58e5cb230ccb49320202394999a723c45628.webp" alt="" width={780} height={440} priority /></div>
        <p className="sg-hero-h">{t("From the Field to the ", "Del campo a la ")}<span>{t("Office.", "oficina.")}</span></p>
        <p className="sg-hero-p">{t("Capture jobsite information, equipment details, compliance documentation, and required photos, then send a completed permit package directly to your office for review.", "Capture la información del sitio, los detalles del equipo, la documentación de cumplimiento y las fotos requeridas, y luego envíe un paquete de permiso completo directamente a su oficina para revisión.")}</p>
      </div>
      <h1 className="text-3xl">{t("Sign in to PermitDraft", "Inicie sesión en PermitDraft")}</h1>
      <section className="ap-card" aria-label={t("Account", "Cuenta")}>
        {email === undefined ? <p className="ap-muted flex items-center gap-2" role="status"><Loader2 className="animate-spin" size={18} aria-hidden />{t("Checking your sign-in…", "Comprobando su sesión…")}</p>
          : email ? <p className="ap-muted" role="status">{t("Signed in. Taking you back…", "Sesión iniciada. Volviendo…")}</p>
          : <SignInForm onSignedIn={() => void navigate({ to: to as never })} />}
      </section>
      <Link to="/demo" className="ap-btn ghost sg-demo">{t("Try Free Demo", "Probar la demo gratis")}</Link>
      <p className="ap-muted sg-demo-line">{t("Just looking?", "¿Solo quiere ver?")} <Link to="/demo" className="underline font-semibold">{t("Try the free demo", "Probar la demo gratis")}</Link>{t(": no sign-in needed.", ": sin iniciar sesión.")}</p>
    </AppPage>
  );
}
