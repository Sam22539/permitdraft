import { useState } from "react";
import { backend } from "../lib/backend";
import { useLang } from "../lib/lang";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MIN_PASSWORD = 8;

/** An internal path only: starts with one slash, no scheme, no protocol-relative or backslash tricks. */
export function safeRedirect(raw: unknown, fallback = "/jobs"): string {
  const s = typeof raw === "string" ? raw.trim() : "";
  if (!s.startsWith("/") || s.startsWith("//") || s.includes("\\") || /[\u0000-\u001f]/.test(s) || s.length > 500) return fallback;
  if (s.startsWith("/sign-in")) return fallback;
  return s;
}

/**
 * PermitDraft's own password, never a mailbox password. Sign in, create an account, or reset a forgotten password;
 * `fallback` is the emailed-code sign-in shown on its own tab. `onSignedIn` runs after a password sign-in.
 */
export function PasswordAccountForm({ fallback, onSignedIn }: { fallback: React.ReactNode; onSignedIn?: () => void }) {
  const { t } = useLang();
  const [tab, setTab] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [ok, setOk] = useState("");
  const [sent, setSent] = useState(false);
  const clean = email.trim().toLowerCase();
  const go = (v: string) => { setTab(v); setMsg(""); setOk(""); setPassword(""); };

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault(); setMsg(""); setOk("");
    if (!EMAIL.test(clean) || !password) { setMsg(t("Enter your work email and your PermitDraft password.", "Escriba su correo de trabajo y su contraseña de PermitDraft.")); return; }
    setBusy(true);
    try {
      const { error } = await backend.auth.signInWithPassword({ email: clean, password });
      if (error) {
        const unconfirmed = /confirm/i.test(error.message);
        setMsg(unconfirmed
          ? t("Confirm your email first: open the link we sent when you created your account.", "Primero confirme su correo: abra el enlace que enviamos al crear su cuenta.")
          : t("That email and password did not match. Try again, use Forgot password, or sign in with an emailed code.", "El correo y la contraseña no coinciden. Inténtelo de nuevo, use ¿Olvidó su contraseña? o inicie sesión con un código por correo."));
      } else onSignedIn?.();
    } catch { setMsg(t("We could not sign you in. Please try again.", "No pudimos iniciar su sesión. Inténtelo de nuevo.")); }
    setBusy(false);
  };

  const signUp = async (e: React.FormEvent) => {
    e.preventDefault(); setMsg(""); setOk("");
    if (!EMAIL.test(clean)) { setMsg(t("Enter a valid work email.", "Escriba un correo de trabajo válido.")); return; }
    if (password.length < MIN_PASSWORD) { setMsg(t(`Choose a password of at least ${MIN_PASSWORD} characters.`, `Elija una contraseña de al menos ${MIN_PASSWORD} caracteres.`)); return; }
    setBusy(true);
    try {
      const { data, error } = await backend.auth.signUp({ email: clean, password });
      if (error) {
        setMsg(/password/i.test(error.message)
          ? t("That password is too weak. Choose a longer one you do not use anywhere else.", "Esa contraseña es muy débil. Elija una más larga que no use en otro lugar.")
          : t("We could not create the account. Check the address and try again.", "No pudimos crear la cuenta. Revise el correo e inténtelo de nuevo."));
      } else if (data.session) {
        onSignedIn?.();
      } else {
        // An address that already has an account answers with no identities and sends nothing: send a reset so the owner of that mailbox can set a password.
        if (data.user && (data.user.identities ?? []).length === 0) await backend.auth.resetPasswordForEmail(clean).catch(() => undefined);
        setPassword("");
        setOk(t("Check your email. If this address is new, open the confirmation link to finish your account. If it already has a PermitDraft account, we sent a link to set your password instead.", "Revise su correo. Si esta dirección es nueva, abra el enlace de confirmación para terminar su cuenta. Si ya tiene una cuenta de PermitDraft, le enviamos un enlace para establecer su contraseña."));
      }
    } catch { setMsg(t("We could not create the account. Please try again.", "No pudimos crear la cuenta. Inténtelo de nuevo.")); }
    setBusy(false);
  };

  const forgot = async (e: React.FormEvent) => {
    e.preventDefault(); setMsg(""); setOk("");
    if (!EMAIL.test(clean)) { setMsg(t("Enter a valid work email.", "Escriba un correo de trabajo válido.")); return; }
    setBusy(true);
    try {
      const { error } = await backend.auth.resetPasswordForEmail(clean);
      if (error && !/not found|no user/i.test(error.message)) setMsg(t("The email could not be sent right now. Please try again in a few minutes.", "No se pudo enviar el correo ahora. Inténtelo de nuevo en unos minutos."));
      else setSent(true);
    } catch { setMsg(t("The email could not be sent right now. Please try again in a few minutes.", "No se pudo enviar el correo ahora. Inténtelo de nuevo en unos minutos.")); }
    setBusy(false);
  };

  const emailField = (id: string) => (
    <div className="ap-field"><Label htmlFor={id}>{t("Work email", "Correo de trabajo")}</Label>
      <Input id={id} type="email" autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={254} required /></div>
  );
  const passwordField = (id: string, isNew: boolean) => (
    <div className="ap-field"><Label htmlFor={id}>{isNew ? t("Create a PermitDraft password", "Cree una contraseña de PermitDraft") : t("PermitDraft password", "Contraseña de PermitDraft")}</Label>
      <Input id={id} type="password" autoComplete={isNew ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} maxLength={200} minLength={isNew ? MIN_PASSWORD : undefined} required aria-describedby="acct-pw-note" /></div>
  );

  return (
    <div className="ap-form" data-testid="account-form">
      <Tabs value={tab} onValueChange={go} className="ap-acct-tabs">
        <TabsList className="ap-acct-tablist" aria-label={t("Account", "Cuenta")}>
          <TabsTrigger value="signin" data-testid="tab-signin">{t("Sign in", "Iniciar sesión")}</TabsTrigger>
          <TabsTrigger value="signup" data-testid="tab-signup">{t("Create account", "Crear cuenta")}</TabsTrigger>
          <TabsTrigger value="code" data-testid="tab-code">{t("Email code", "Código")}</TabsTrigger>
        </TabsList>
        <p id="acct-pw-note" className="ap-muted">{t("Use your work email and a password just for PermitDraft. Never enter your email account's own password.", "Use su correo de trabajo y una contraseña solo para PermitDraft. Nunca escriba la contraseña de su cuenta de correo.")}</p>
        <TabsContent value="signin">
          <form onSubmit={signIn} className="ap-form" noValidate data-testid="pw-signin">
            {emailField("acct-in-email")}
            {passwordField("acct-in-pw", false)}
            <button type="submit" className="ap-btn primary" disabled={busy} data-testid="pw-signin-submit">{t("Sign in", "Iniciar sesión")}</button>
            <button type="button" className="underline font-semibold text-left" onClick={() => go("forgot")} data-testid="forgot-link">{t("Forgot password?", "¿Olvidó su contraseña?")}</button>
          </form>
        </TabsContent>
        <TabsContent value="signup">
          <form onSubmit={signUp} className="ap-form" noValidate data-testid="pw-signup">
            {emailField("acct-up-email")}
            {passwordField("acct-up-pw", true)}
            <p className="ap-muted">{t(`At least ${MIN_PASSWORD} characters. We email you a link to confirm the address before you can sign in. Your company access comes only from your company admin's Office setup.`, `Al menos ${MIN_PASSWORD} caracteres. Le enviamos un enlace para confirmar la dirección antes de iniciar sesión. El acceso a su empresa viene solo de la Configuración de oficina de su administrador.`)}</p>
            <button type="submit" className="ap-btn primary" disabled={busy} data-testid="pw-signup-submit">{t("Create account", "Crear cuenta")}</button>
          </form>
        </TabsContent>
        <TabsContent value="forgot">
          <form onSubmit={forgot} className="ap-form" noValidate data-testid="pw-forgot">
            <p className="ap-muted">{t("Enter your work email and we will send a one-time link to set a new PermitDraft password. Signed up with an emailed code before? Use this to add a password to the same account.", "Escriba su correo de trabajo y le enviaremos un enlace de un solo uso para establecer una contraseña nueva de PermitDraft. ¿Antes entraba con un código? Use esto para agregar una contraseña a la misma cuenta.")}</p>
            {emailField("acct-fg-email")}
            <button type="submit" className="ap-btn primary" disabled={busy} data-testid="pw-forgot-submit">{t("Email me a reset link", "Envíeme un enlace")}</button>
            <button type="button" className="underline font-semibold text-left" onClick={() => go("signin")} data-testid="back-signin">{t("Back to sign in", "Volver a iniciar sesión")}</button>
          </form>
        </TabsContent>
        <TabsContent value="code">{fallback}</TabsContent>
      </Tabs>
      <Dialog open={sent} onOpenChange={(o) => { if (!o) { setSent(false); go("signin"); } }}>
        <DialogContent data-testid="forgot-dialog" role="alertdialog" className="max-w-[calc(100%-2rem)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("Check your inbox", "Revise su bandeja de entrada")}</DialogTitle>
            <DialogDescription>{t("If an account exists for that email address, we’ll send a password reset link. Check your inbox and spam folder.", "Si existe una cuenta para esa dirección de correo, enviaremos un enlace para restablecer la contraseña. Revise su bandeja de entrada y la carpeta de spam.")}</DialogDescription>
          </DialogHeader>
          <button type="button" className="ap-btn primary" onClick={() => { setSent(false); go("signin"); }} data-testid="forgot-dialog-back">{t("Back to sign in", "Volver a iniciar sesión")}</button>
        </DialogContent>
      </Dialog>
      {ok && <p role="status" className="ap-muted" data-testid="acct-ok">{ok}</p>}
      {msg && <p role="alert" className="ap-muted" data-testid="acct-msg">{msg}</p>}
    </div>
  );
}
