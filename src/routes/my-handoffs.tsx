import { createFileRoute, Link } from "@tanstack/react-router";
import { AppPage } from "../components/app-shell";
import { SignInForm, useSessionEmail } from "../components/core-offer";
import { MyHandoffs } from "../components/my-handoffs";
import { useLang } from "../lib/lang";

export const Route = createFileRoute("/my-handoffs")({
  head: () => ({ meta: [{ title: "My handoffs — PermitDraft Core" }, { name: "description", content: "Every job packet you sent to your office, with when it was sent and the office's status." }, { name: "robots", content: "noindex" }] }),
  component: Page,
});

function Page() {
  const { t } = useLang();
  const email = useSessionEmail();
  return (
    <AppPage bottom>
      <Link to="/profile" className="underline font-semibold">{t("← Back to Profile", "← Volver al Perfil")}</Link>
      <h1 className="text-3xl">{t("My handoffs", "Mis entregas")}</h1>
      <p className="ap-muted">{t("Every job packet you sent to your office, newest first, with its status.", "Cada paquete de trabajo que envió a su oficina, del más reciente al más antiguo, con su estado.")}</p>
      {email === undefined && <p className="ap-muted" role="status">{t("Checking your sign-in…", "Comprobando su sesión…")}</p>}
      {email === null && <section className="ap-card"><h2 className="ap-h2">{t("Sign in to see your handoffs", "Inicie sesión para ver sus entregas")}</h2><SignInForm /></section>}
      {email && <section className="ap-card" aria-labelledby="mh-h"><h2 id="mh-h" className="ap-h2">{t("Packets you sent", "Paquetes que envió")}</h2><MyHandoffs /></section>}
    </AppPage>
  );
}
