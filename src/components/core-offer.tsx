import { useEffect, useState } from "react";
import { backend } from "../lib/backend";
import { finishGoogleSignIn, signInWithGoogle } from "../integrations/foundable/sign-in";
import { EmailCodeForm } from "../integrations/foundable/email-code";
import { BuyButton, ManageSubscriptionButton, useAccess } from "../lib/payments/buy";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { AppPage } from "./app-shell";
import { useLang } from "../lib/lang";
import { startCoreTrial } from "../lib/trial";
import { sessionHeaders } from "../lib/payments/buy";
import { Link } from "@tanstack/react-router";
import { PasswordAccountForm } from "./account-form";

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

export type Trial = { state: "loading" | "none" | "active" | "expired"; expiresAt: string | null };

/** The signed-in account's trial, read with the database's own clock (core_trial_status); "none" when signed out. */
export function useCoreTrial(): Trial {
  const [trial, setTrial] = useState<Trial>({ state: "loading", expiresAt: null });
  useEffect(() => {
    let live = true;
    const read = () => {
      backend.auth.getSession().then(({ data: sess }) => sess.session ? Promise.resolve(backend.rpc("core_trial_status")).then((r): { data: any; error: unknown } => r) : ({ data: null, error: null } as { data: any; error: unknown })).then(({ data, error }) => {
        if (!live) return;
        const row = Array.isArray(data) ? data[0] : null;
        if (error) setTrial({ state: "none", expiresAt: null });
        else if (!row) setTrial({ state: "none", expiresAt: null });
        else setTrial({ state: row.active ? "active" : "expired", expiresAt: row.expires_at });
      }, () => { if (live) setTrial({ state: "none", expiresAt: null }); });
    };
    read();
    const { data } = backend.auth.onAuthStateChange(() => read());
    window.addEventListener("core-trial-changed", read);
    return () => { live = false; data.subscription.unsubscribe(); window.removeEventListener("core-trial-changed", read); };
  }, []);
  return trial;
}

export function daysLeft(expiresAt: string | null): number {
  return expiresAt ? Math.max(1, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86400000)) : 0;
}

/** Paid access OR an active trial; null while either is still being read. */
export function useCoreAccess(): boolean | null {
  const paid = useAccess("permitdraft_core");
  const trial = useCoreTrial();
  if (paid === true) return true;
  if (paid === null || trial.state === "loading") return null;
  return trial.state === "active";
}

/** Sign-in for Core: a PermitDraft password first, Google, and the emailed code kept as a fallback. */
export function SignInForm({ onSignedIn }: { onSignedIn?: () => void } = {}) {
  const { t } = useLang();
  const [msg, setMsg] = useState("");
  useEffect(() => {
    finishGoogleSignIn(backend).then((r) => {
      if (r === "signed-in") onSignedIn?.();
      else if (r === "cancelled") setMsg(t("Google sign-in was cancelled.", "Se canceló el inicio de sesión con Google."));
      else if (r === "failed" || r === "not-started") setMsg(t("Google sign-in did not complete. Please try again.", "El inicio de sesión con Google no se completó. Inténtelo de nuevo."));
    }).catch(() => setMsg(t("Google sign-in did not complete. Please try again.", "El inicio de sesión con Google no se completó. Inténtelo de nuevo.")));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className="ap-form" data-testid="sign-in">
      <PasswordAccountForm onSignedIn={onSignedIn} fallback={<EmailCodeSignIn onSignedIn={onSignedIn} />} />
      <button type="button" className="ap-btn ghost" onClick={() => signInWithGoogle()}>{t("Sign in with Google", "Iniciar sesión con Google")}</button>
      {msg && <p role="alert" className="ap-muted">{msg}</p>}
    </div>
  );
}

/** The emailed one-time code sign-in, kept as the fallback for anyone without a PermitDraft password. */
function EmailCodeSignIn({ onSignedIn }: { onSignedIn?: () => void }) {
  const { t } = useLang();
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
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
      else onSignedIn?.();
    } catch { setMsg(t("That code did not work. Request a new code and try again.", "Ese código no funcionó. Pida un código nuevo e inténtelo de nuevo.")); }
    setBusy(false);
  };
  return (
    <div className="ap-form" data-testid="code-sign-in">
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
  const trial = useCoreTrial();
  const [asked, setAsked] = useState(false);
  const [starting, setStarting] = useState(false);
  const [err, setErr] = useState("");
  const H = heading;
  const start = async () => {
    setStarting(true); setErr("");
    try {
      const h = await sessionHeaders();
      const token = h ? Object.values(h as Record<string, string>)[0] : null;
      if (!token) throw new Error("auth");
      await startCoreTrial({ data: { token } });
      window.dispatchEvent(new Event("core-trial-changed"));
    } catch { setErr(t("We could not start your trial. Please try again.", "No pudimos iniciar su prueba. Inténtelo de nuevo.")); }
    setStarting(false);
  };
  const expiry = trial.expiresAt ? new Date(trial.expiresAt).toLocaleDateString(undefined, { dateStyle: "medium" }) : "";
  return (
    <section id="core-offer" className="ap-card ap-subscribe" aria-labelledby="sub-h" data-testid="subscribe">
      <H id="sub-h">PermitDraft Core</H>
      <p>{t("Try Core free for 14 days: no card needed. Subscribing is optional and nothing is billed automatically.", "Pruebe Core gratis por 14 días: sin tarjeta. Suscribirse es opcional y no se cobra nada automáticamente.")}</p>
      <p className="ap-muted">{t("Includes field capture, jobs, draft review and inspection tracking, also during an active free trial. Jobs save in this browser; on Finish, photos are saved to your account and one private packet goes to the office.", "Incluye captura de campo, trabajos, revisión de borradores y seguimiento de inspecciones, también durante la prueba gratis activa. Los trabajos se guardan en este navegador; al Finalizar, las fotos se guardan en su cuenta y un paquete privado va a la oficina.")}</p>
      <p className="ap-muted">{t("It does not verify permit rules and does not file anything for you. The public sample and coverage page stay free.", "No verifica reglas de permisos ni presenta nada por usted. La muestra pública y la página de cobertura siguen siendo gratis.")}</p>
      {email ? (
        <p className="ap-muted" data-testid="signed-in-as">{t("Signed in as", "Sesión iniciada como")} {email} · <button type="button" className="underline font-semibold" onClick={() => { void backend.auth.signOut(); }}>{t("Sign out", "Cerrar sesión")}</button></p>
      ) : null}
      {access !== true && trial.state === "active" && <p role="status" data-testid="trial-active"><strong>{t(`Your free trial is active until ${expiry}.`, `Su prueba gratis está activa hasta el ${expiry}.`)}</strong></p>}
      {access !== true && trial.state === "expired" && <p role="status" data-testid="trial-expired"><strong>{t(`Your free trial ended on ${expiry}. Your work is saved; subscribe to keep using Core.`, `Su prueba gratis terminó el ${expiry}. Su trabajo está guardado; suscríbase para seguir usando Core.`)}</strong></p>}
      {access === true && <p role="status" data-testid="core-active"><strong>{t("Your Core access is active.", "Su acceso a Core está activo.")}</strong></p>}
      <div className="ap-subscribe-actions">
        {access !== true && email && trial.state === "none" && (
          <button type="button" className="ap-btn primary" data-testid="start-trial" disabled={starting} onClick={() => { void start(); }}>{t("Start free trial", "Comenzar prueba gratis")}</button>
        )}
        {access !== true && (
          <BuyButton priceHandle={PRICE} audience="signed_in" onSignIn={() => setAsked(true)} className="ap-btn primary">{t("Subscribe to PermitDraft Core", "Suscribirse a PermitDraft Core")}</BuyButton>
        )}
        <ManageSubscriptionButton priceHandle={PRICE} className="ap-btn ghost">{t("Manage subscription", "Administrar suscripción")}</ManageSubscriptionButton>
      </div>
      <p className="ap-muted" data-testid="offer-demo">{t("Want to see it first?", "¿Quiere verlo primero?")} <Link to="/demo" className="underline font-semibold">{t("Try the free demo", "Probar la demo gratis")}</Link>{t(": every step, no sign-in or card.", ": todos los pasos, sin iniciar sesión ni tarjeta.")}</p>
      {err && <p role="alert" className="ap-muted">{err}</p>}
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
  const access = useCoreAccess();
  if (access === true) return <>{children}</>;
  return (
    <AppPage core>
      <h1 className="cx-h1">{t("PermitDraft Core", "PermitDraft Core")}</h1>
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
