import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { AppPage } from "../components/app-shell";
import { safeRedirect } from "../components/account-form";
import { SignInForm, useSessionEmail } from "../components/core-offer";
import { useLang } from "../lib/lang";

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
      <h1 className="text-3xl">{t("Sign in to PermitDraft", "Inicie sesión en PermitDraft")}</h1>
      <section className="ap-card" aria-label={t("Account", "Cuenta")}>
        {email === undefined ? <p className="ap-muted flex items-center gap-2" role="status"><Loader2 className="animate-spin" size={18} aria-hidden />{t("Checking your sign-in…", "Comprobando su sesión…")}</p>
          : email ? <p className="ap-muted" role="status">{t("Signed in. Taking you back…", "Sesión iniciada. Volviendo…")}</p>
          : <SignInForm onSignedIn={() => void navigate({ to: to as never })} />}
      </section>
      <p className="ap-muted">{t("Just looking?", "¿Solo quiere ver?")} <Link to="/demo" className="underline font-semibold">{t("Try the free demo", "Probar la demo gratis")}</Link>{t(": no sign-in needed.", ": sin iniciar sesión.")}</p>
    </AppPage>
  );
}
