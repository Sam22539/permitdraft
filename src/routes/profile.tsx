import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { AppPage } from "../components/app-shell";
import { MIN_PASSWORD } from "../components/account-form";
import { SignInForm } from "../components/core-offer";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { backend } from "../lib/backend";
import { useLang } from "../lib/lang";
import { getOfficeSetup, type OfficeSetup } from "../lib/office";
import { readDisplayName, saveDisplayName } from "../lib/profile";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile — PermitDraft Core" }, { name: "description", content: "Your PermitDraft Core profile: display name, verified work email, company and role, and your PermitDraft password." }] }),
  component: ProfilePage,
});

type Me = { id: string; email: string; token: string };
const ROLE: Record<string, [string, string]> = { admin: ["Admin", "Administrador"], office: ["Office reviewer", "Revisor de oficina"], technician: ["Technician", "Técnico"] };

function ProfilePage() {
  const { t } = useLang();
  const [me, setMe] = useState<Me | null | undefined>(undefined);
  useEffect(() => {
    const set = (s: { user: { id: string; email?: string }; access_token: string } | null) =>
      setMe(s?.user.email ? { id: s.user.id, email: s.user.email.toLowerCase(), token: s.access_token } : null);
    backend.auth.getSession().then(({ data }) => set(data.session)).catch(() => setMe(null));
    const { data } = backend.auth.onAuthStateChange((_e, s) => set(s));
    return () => data.subscription.unsubscribe();
  }, []);
  return (
    <AppPage bottom>
      <h1 className="text-3xl">{t("Profile", "Perfil")}</h1>
      {me === undefined && <section className="ap-card"><p className="ap-muted flex items-center gap-2" role="status"><Loader2 className="animate-spin" size={18} aria-hidden />{t("Checking your sign-in…", "Comprobando su sesión…")}</p></section>}
      {me === null && (
        <section className="ap-card" aria-labelledby="pf-in" data-testid="profile-signed-out">
          <h2 id="pf-in" className="ap-h2">{t("Sign in to see your profile", "Inicie sesión para ver su perfil")}</h2>
          <SignInForm />
        </section>
      )}
      {me && <ProfileCards me={me} />}
      <Link to="/settings" className="ap-btn ghost" data-testid="pf-back">{t("Back to Settings", "Volver a Ajustes")}</Link>
    </AppPage>
  );
}

function ProfileCards({ me }: { me: Me }) {
  const { t } = useLang();
  const [name, setName] = useState("");
  const [nameMsg, setNameMsg] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [setup, setSetup] = useState<OfficeSetup | null | undefined>(undefined);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [pwMsg, setPwMsg] = useState("");
  const [savingPw, setSavingPw] = useState(false);

  useEffect(() => {
    let live = true;
    readDisplayName(me.id).then((n) => { if (live) setName(n ?? ""); }).catch(() => undefined);
    getOfficeSetup({ data: { token: me.token } }).then((s) => { if (live) setSetup(s); }).catch(() => { if (live) setSetup(null); });
    return () => { live = false; };
  }, [me.id, me.token]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setNameMsg("");
    const n = name.trim();
    if (n.length < 1 || n.length > 80) { setNameMsg(t("Enter a name of 1 to 80 characters.", "Escriba un nombre de 1 a 80 caracteres.")); return; }
    setSavingName(true);
    try { await saveDisplayName(me.id, n); setName(n); setNameMsg(t("Display name saved.", "Nombre guardado.")); }
    catch { setNameMsg(t("We could not save your name. Please try again.", "No pudimos guardar su nombre. Inténtelo de nuevo.")); }
    setSavingName(false);
  };

  const changePw = async (e: React.FormEvent) => {
    e.preventDefault(); setPwMsg("");
    if (pw.length < MIN_PASSWORD) { setPwMsg(t(`Use at least ${MIN_PASSWORD} characters.`, `Use al menos ${MIN_PASSWORD} caracteres.`)); return; }
    if (pw !== pw2) { setPwMsg(t("The two passwords do not match.", "Las dos contraseñas no coinciden.")); return; }
    setSavingPw(true);
    try {
      const { error } = await backend.auth.updateUser({ password: pw });
      if (error) setPwMsg(/reauth|recent/i.test(error.message)
        ? t("For your security, sign out and use Forgot password to set it with a one-time email link.", "Por seguridad, cierre sesión y use ¿Olvidó su contraseña? para establecerla con un enlace de un solo uso.")
        : /same|different/i.test(error.message) ? t("Choose a password different from your current one.", "Elija una contraseña distinta de la actual.")
        : t("We could not change your password. Choose a stronger one and try again.", "No pudimos cambiar su contraseña. Elija una más segura e inténtelo de nuevo."));
      else { setPw(""); setPw2(""); setPwMsg(t("Password saved. Use it with your work email next time you sign in.", "Contraseña guardada. Úsela con su correo de trabajo la próxima vez.")); }
    } catch { setPwMsg(t("We could not change your password. Please try again.", "No pudimos cambiar su contraseña. Inténtelo de nuevo.")); }
    setSavingPw(false);
  };

  const role = setup?.company ? ROLE[setup.company.role] : null;
  return (
    <>
      <section className="ap-card" aria-labelledby="pf-me" data-testid="profile-card">
        <h2 id="pf-me" className="ap-h2">{t("Your details", "Sus datos")}</h2>
        <form onSubmit={save} className="ap-form" noValidate>
          <div className="ap-field"><Label htmlFor="pf-name">{t("Display name", "Nombre para mostrar")}</Label>
            <Input id="pf-name" autoComplete="name" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} data-testid="pf-name" /></div>
          <button type="submit" className="ap-btn primary" disabled={savingName} data-testid="pf-save">{t("Save name", "Guardar nombre")}</button>
          {nameMsg && <p role="status" className="ap-muted" data-testid="pf-name-msg">{nameMsg}</p>}
        </form>
        <dl className="ap-form" data-testid="pf-facts">
          <div><dt className="font-semibold">{t("Work email (verified)", "Correo de trabajo (verificado)")}</dt><dd className="ap-muted" data-testid="pf-email">{me.email}</dd></div>
          <div><dt className="font-semibold">{t("Company", "Empresa")}</dt><dd className="ap-muted" data-testid="pf-company">{setup === undefined ? t("Loading…", "Cargando…") : setup?.company ? setup.company.name : t("Not part of a company yet", "Aún no pertenece a una empresa")}</dd></div>
          <div><dt className="font-semibold">{t("Role", "Rol")}</dt><dd className="ap-muted" data-testid="pf-role">{setup === undefined ? t("Loading…", "Cargando…") : role ? t(role[0], role[1]) : "—"}</dd></div>
        </dl>
        <p className="ap-muted">{t("Company and role come only from your company admin's ", "La empresa y el rol vienen solo de la ")}<Link to="/office-setup" className="underline font-semibold">{t("Office setup", "Configuración de oficina")}</Link>{t(". You cannot change them here.", " de su administrador. No se cambian aquí.")}</p>
      </section>
      <section className="ap-card" aria-labelledby="pf-pw" data-testid="password-card">
        <h2 id="pf-pw" className="ap-h2">{t("PermitDraft password", "Contraseña de PermitDraft")}</h2>
        <p className="ap-muted">{t("Set or change the password you use with your work email. Not your email account's password.", "Establezca o cambie la contraseña que usa con su correo de trabajo. No es la contraseña de su cuenta de correo.")}</p>
        <form onSubmit={changePw} className="ap-form" noValidate>
          <input type="email" autoComplete="username" value={me.email} readOnly hidden />
          <div className="ap-field"><Label htmlFor="pf-pw1">{t("New password", "Contraseña nueva")}</Label>
            <Input id="pf-pw1" type="password" autoComplete="new-password" value={pw} maxLength={200} onChange={(e) => setPw(e.target.value)} data-testid="pf-pw1" /></div>
          <div className="ap-field"><Label htmlFor="pf-pw2">{t("Repeat new password", "Repita la contraseña nueva")}</Label>
            <Input id="pf-pw2" type="password" autoComplete="new-password" value={pw2} maxLength={200} onChange={(e) => setPw2(e.target.value)} data-testid="pf-pw2" /></div>
          <button type="submit" className="ap-btn primary" disabled={savingPw} data-testid="pf-pw-save">{t("Save password", "Guardar contraseña")}</button>
          {pwMsg && <p role="status" className="ap-muted" data-testid="pf-pw-msg">{pwMsg}</p>}
        </form>
        <button type="button" className="ap-btn ghost" onClick={() => { void backend.auth.signOut(); }} data-testid="pf-signout">{t("Sign out", "Cerrar sesión")}</button>
      </section>
    </>
  );
}
