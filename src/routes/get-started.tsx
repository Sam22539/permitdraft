import { createFileRoute } from "@tanstack/react-router";
import { AppPage } from "../components/app-shell";
import { CoreOffer } from "../components/core-offer";
import { useLang } from "../lib/lang";

export const Route = createFileRoute("/get-started")({
  head: () => ({ meta: [{ title: "Get started with PermitDraft Core" }, { name: "description", content: "Sign in, start your free 14-day PermitDraft Core trial, subscribe or manage your subscription." }] }),
  component: GetStarted,
});

function GetStarted() {
  const { t } = useLang();
  return (
    <AppPage>
      <div className="gs-wrap">
        <p className="hp-eyebrow">{t("PermitDraft Core", "PermitDraft Core")}</p>
        <h1 className="gs-h1">{t("Get started with", "Comience con")} <span>{t("Core.", "Core.")}</span></h1>
        <p className="gs-lead">{t("Sign in, try Core free for 14 days, and subscribe only if it fits your crew.", "Inicie sesión, pruebe Core gratis por 14 días y suscríbase solo si le conviene.")}</p>
        <CoreOffer heading="h2" />
      </div>
    </AppPage>
  );
}
