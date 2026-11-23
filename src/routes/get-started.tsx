import { createFileRoute } from "@tanstack/react-router";
import { AppPage } from "../components/app-shell";
import { CoreOffer } from "../components/core-offer";
import { useLang } from "../lib/lang";

export const Route = createFileRoute("/get-started")({
  head: () => ({ meta: [{ title: "Get started with PermitDraft" }, { name: "description", content: "Try the free PermitDraft demo with no sign-in, request Early Access, or manage an existing subscription." }] }),
  component: GetStarted,
});

function GetStarted() {
  const { t } = useLang();
  return (
    <AppPage>
      <div className="gs-wrap">
        <p className="hp-eyebrow">{t("PermitDraft", "PermitDraft")}</p>
        <h1 className="gs-h1">{t("Get started with", "Comience con")} <span>{t("the demo.", "la demo.")}</span></h1>
        <p className="gs-lead">{t("Try every step on a sample job, free and with no sign-in. Existing subscribers can sign in at the bottom of the card.", "Pruebe cada paso con un trabajo de muestra, gratis y sin iniciar sesión. Los suscriptores actuales pueden iniciar sesión al final de la tarjeta.")}</p>
        <CoreOffer heading="h2" />
      </div>
    </AppPage>
  );
}
