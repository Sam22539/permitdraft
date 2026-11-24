import { Link, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { Image } from "../image";
import { useLang } from "../lib/lang";
import { SignInForm, useSessionEmail } from "./core-offer";

/** The home page's account panel: the site's own sign-in, create-account and reset form. */
export function SignInCard() {
  const { t } = useLang();
  const email = useSessionEmail();
  const navigate = useNavigate();
  return (
    <section className="hp-signin" aria-labelledby="hp-signin-h" data-testid="home-sign-in">
      <h2 id="hp-signin-h">{t("Log in to PermitDraft", "Inicie sesión en PermitDraft")}</h2>
      {email ? (
        <>
          <p className="hp-small">{t("Signed in as", "Sesión iniciada como")} {email}</p>
          <Link to="/jobs" className="ap-btn primary" data-testid="home-open-jobs">{t("Open my jobs", "Abrir mis trabajos")}</Link>
          <Link to="/profile" className="ap-btn ghost">{t("Account", "Cuenta")}</Link>
        </>
      ) : email === undefined ? (
        <p className="hp-small flex items-center gap-2" role="status"><Loader2 className="animate-spin" size={18} aria-hidden />{t("Checking your sign-in…", "Comprobando su sesión…")}</p>
      ) : (
        <>
          <p className="hp-small">{t("Open your jobs, drafts and office handoffs.", "Abra sus trabajos, borradores y entregas a la oficina.")}</p>
          <SignInForm onSignedIn={() => void navigate({ to: "/jobs" })} />
        </>
      )}
    </section>
  );
}

/** A drawing of the real Jobs and Job site screens, filled with the demo's sample job. */
export function ScreenPreview() {
  const { t } = useLang();
  const rows: [string, string, string, boolean][] = [
    ["4412 Alder Court, Sacramento", "Marcus Reyes · " + t("Heat pump change-out", "Cambio de bomba de calor"), t("Missing info", "Falta información"), true],
    ["7 Demo Lane", t("Gas furnace", "Furnace de gas"), t("In progress", "En curso"), false],
    ["92 Maple Court", t("Ductless mini-split", "Mini-split sin ductos"), t("In progress", "En curso"), false],
  ];
  return (
    <div className="hp-devices" role="img" aria-label={t("Sample PermitDraft screens: the Jobs dashboard on a laptop beside an outdoor condenser, filled with the demo's sample job", "Pantallas de muestra de PermitDraft: el panel de trabajos en una laptop junto a una unidad exterior, con el trabajo de muestra de la demo")}>
      <div className="hp-photo"><Image src="/generated-assets/07845502ccc4fa8e1a8c5493226e58e5cb230ccb49320202394999a723c45628.webp" alt="" width={1200} height={800} priority /></div>
      <div className="hp-laptop" aria-hidden>
        <div className="hp-screen">
          <div className="hp-scr-side"><Image src="/generated-assets/company-logo.png" alt="" width={18} height={18} /><i className="on" /><i /><i /><i /><i /></div>
          <div className="hp-scr-main">
            <div className="hp-scr-top"><b>{t("Jobs", "Trabajos")}</b><span className="hp-scr-btn">+ {t("New job", "Nuevo trabajo")}</span></div>
            <div className="hp-scr-metrics">
              <span><b>4</b>{t("Total jobs", "Total")}</span><span><b>2</b>{t("In progress", "En curso")}</span><span className="w"><b>1</b>{t("Missing info", "Falta info")}</span><span className="g"><b>0</b>{t("Ready for review", "Listos")}</span>
            </div>
            <div className="hp-scr-table">
              {rows.map((r) => <div key={r[0]} className="hp-scr-row"><span><b>{r[0]}</b><em>{r[1]}</em></span><span className={`hp-scr-badge${r[3] ? " w" : ""}`}>{r[2]}</span></div>)}
            </div>
          </div>
        </div>
        <div className="hp-base" />
      </div>
    </div>
  );
}
