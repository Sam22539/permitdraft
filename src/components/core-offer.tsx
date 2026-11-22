import { useEffect, useState } from "react";
import { backend } from "../lib/backend";
import { finishGoogleSignIn, signInWithGoogle } from "../integrations/foundable/sign-in";
import { EmailCodeForm } from "../integrations/foundable/email-code";
import { BuyButton, ManageSubscriptionButton, useAccess } from "../lib/payments/buy";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { AppPage } from "./app-shell";
import { useLang } from "../lib/lang";

const PRICE = "permitdraft_core_4900_usd_monthly";

/** The signed-in email, null when signed out, undefined while unknown. */
export function useSessionEmail(): string | null | undefined {
  const [email, setEmail] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    let live = true;
    backend.auth.getSession().then(({ data }) => { if (live) setEmail(data.session?.user.email ?? null); }).catch(() => { if (live) setEmail(null); });
    const { data } = backend.auth.onAuthStateChange((_e, s) => { if (live) setEmail(s?.user.email ?? null); });
    return () => { live = false; data.subscription.unsubscribe(); };
  }, []);
  return email;
}

function SignInForm() {
  const { t } = useLang();
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  useEffect(() => {
    finishGoogleSignIn(backend).then((r) => {
      if (r === "cancelled") setMsg(t("Google sign-in was cancelled.", "Se canceló el inicio de sesión con Google."));
      else if (r === "failed" || r === "not-started") setMsg(t("Google sign-in did not complete. Please try again.", "El inicio de sesión con Google no se completó. Inténtelo de nuevo."));
    }).catch(() => setMsg(t("Google sign-in did not complete. Please try again.", "El inicio de sesión con Google no se completó. Inténtelo de nuevo.")));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setMsg(t("Enter a valid email address.", "Escriba un correo válido.")); return; }
    setBusy(true); setMsg("");
    try {
      const { error } = await backend.auth.signInWithOtp({ email: email.trim() });
      if (error) setMsg(t("We could not send a code. Check the address and try again.", "No pudimos enviar un código. Revise el correo e inténtelo de nuevo."));
      else setStep("code");
    } catch { setMsg(t("We could not send a code. Check the address and try again.", "No pudimos enviar un código. Revise el correo e inténtelo de nuevo.")); }
    setBusy(false);
  };
  const verify = async (code: string) => {
    setBusy(true); setMsg("");
    try {
      const { error } = await backend.auth.verifyOtp({ email: email.trim(), token: code, type: "email" });
      if (error) setMsg(t("That code did not work. Request a new code and try again.", "Ese código no funcionó. Pida un código nuevo e inténtelo de nuevo."));
    } catch { setMsg(t("That code did not work. Request a new code and try again.", "Ese código no funcionó. Pida un código nuevo e inténtelo de nuevo.")); }
    setBusy(false);
  };
  return (
    <div className="ap-form" data-testid="sign-in">
      <button type="button" className="ap-btn ghost" onClick={() => signInWithGoogle()}>{t("Sign in with Google", "Iniciar sesión con Google")}</button>
      {step === "email" ? (
        <form onSubmit={send} className="ap-form" noValidate>
          <div className="ap-field"><Label htmlFor="si-email">{t("Email me a code", "Envíeme un código")}</Label>
            <Input id="si-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={200} /></div>
          <button type="submit" className="ap-btn ghost" disabled={busy}>{t("Email me a code", "Envíeme un código")}</button>
        </form>
      ) : (
        <div className="ap-form">
          <p className="ap-muted">{t("If a code arrives, enter it below; otherwise check the address and try again later.", "Si llega un código, escríbalo abajo; si no, revise el correo e inténtelo más tarde.")}</p>
          <EmailCodeForm label={t("Code from your email", "Código de su correo")} submitLabel={t("Sign in", "Iniciar sesión")} onVerify={verify} busy={busy}
            className="ap-form" labelClassName="ap-field" buttonClassName="ap-btn primary" inputClassName="border-input bg-white rounded-md border px-3" />
          <button type="button" className="ap-btn ghost" onClick={() => { setStep("email"); setMsg(""); }}>{t("Use another address or get a new code", "Usar otro correo u obtener un código nuevo")}</button>
        </div>
      )}
      {msg && <p role="alert" className="ap-muted">{msg}</p>}
    </div>
  );
}

/** Core's offer: sign in, subscribe, manage. Where `compact`, no heading text above the price. */
export function CoreOffer({ heading = "h2" }: { heading?: "h2" | "h3" }) {
  const { t } = useLang();
  const email = useSessionEmail();
  const access = useAccess("permitdraft_core");
  const [asked, setAsked] = useState(false);
  const H = heading;
  return (
    <section className="ap-card ap-subscribe" aria-labelledby="sub-h" data-testid="subscribe">
      <H id="sub-h">PermitDraft Core</H>
      <p><strong>{t("US$49/month", "US$49/mes")}</strong> · {t("renews monthly", "se renueva mensualmente")}</p>
      <p className="ap-muted">{t("Core field capture, draft review and inspection tracking. Jobs and photos still save in this browser only; nothing syncs between devices.", "Captura de campo, revisión de borradores y seguimiento de inspecciones de Core. Los trabajos y las fotos se siguen guardando solo en este navegador; nada se sincroniza entre dispositivos.")}</p>
      <p className="ap-muted">{t("It does not verify permit rules and does not file anything for you. The public sample, coverage page and pilot signup stay free.", "No verifica reglas de permisos ni presenta nada por usted. La muestra pública, la página de cobertura y el registro al piloto siguen siendo gratis.")}</p>
      {email ? (
        <p className="ap-muted" data-testid="signed-in-as">{t("Signed in as", "Sesión iniciada como")} {email} · <button type="button" className="underline font-semibold" onClick={() => { void backend.auth.signOut(); }}>{t("Sign out", "Cerrar sesión")}</button></p>
      ) : null}
      {access === true && <p role="status" data-testid="core-active"><strong>{t("Your Core access is active.", "Su acceso a Core está activo.")}</strong></p>}
      <div className="ap-subscribe-actions">
        {access !== true && (
          <BuyButton priceHandle={PRICE} audience="signed_in" onSignIn={() => setAsked(true)} className="ap-btn primary">{t("Subscribe to PermitDraft Core", "Suscribirse a PermitDraft Core")}</BuyButton>
        )}
        <ManageSubscriptionButton priceHandle={PRICE} className="ap-btn ghost">{t("Manage subscription", "Administrar suscripción")}</ManageSubscriptionButton>
      </div>
      {email === null && asked && <SignInForm />}
      {email === null && !asked && (
        <button type="button" className="underline font-semibold text-left" onClick={() => setAsked(true)}>{t("Sign in to your account", "Inicie sesión en su cuenta")}</button>
      )}
    </section>
  );
}

/** Wraps a Core route: its paid part for a subscriber, the offer for everyone else. */
export function CoreGate({ children }: { children: React.ReactNode }) {
  const { t } = useLang();
  const access = useAccess("permitdraft_core");
  if (access === true) return <>{children}</>;
  return (
    <AppPage>
      <h1>{t("PermitDraft Core", "PermitDraft Core")}</h1>
      {access === null ? (
        <p className="ap-muted" role="status">{t("Checking your access…", "Comprobando su acceso…")}</p>
      ) : (
        <>
          <p className="ap-muted">{t("This part of PermitDraft is for Core subscribers: field capture, draft review and inspection tracking.", "Esta parte de PermitDraft es para suscriptores de Core: captura de campo, revisión de borradores y seguimiento de inspecciones.")}</p>
          <CoreOffer heading="h2" />
        </>
      )}
    </AppPage>
  );
}
