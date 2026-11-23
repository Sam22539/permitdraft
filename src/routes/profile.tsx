import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { AppPage } from "../components/app-shell";
import { MIN_PASSWORD } from "../components/account-form";
import { SignInForm } from "../components/core-offer";
import { MyHandoffs } from "../components/my-handoffs";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { getMyAccount, saveMyAccount } from "../lib/account";
import { backend } from "../lib/backend";
import { useLang } from "../lib/lang";
import { getOfficeSetup, type OfficeSetup } from "../lib/office";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Account — PermitDraft" }, { name: "description", content: "Your PermitDraft account: identity, work email, phone, language, notifications, recent handoffs and security." }] }),
  component: ProfilePage,
});

type Me = { id: string; email: string; token: string; verified: boolean };
const ROLE: Record<string, [string, string]> = { admin: ["Admin", "Administrador"], office: ["Office reviewer", "Revisor de oficina"], technician: ["Technician", "Técnico"] };
const initials = (n: string, email: string) => {
  const parts = (n.trim() || email.split("@")[0]).split(/[\s._-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "?") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
};

function ProfilePage() {
  const { t } = useLang();
  const [me, setMe] = useState<Me | null | undefined>(undefined);
  useEffect(() => {
    const set = (s: { user: { id: string; email?: string; email_confirmed_at?: string | null }; access_token: string } | null) =>
      setMe(s?.user.email ? { id: s.user.id, email: s.user.email.toLowerCase(), token: s.access_token, verified: !!s.user.email_confirmed_at } : null);
    backend.auth.getSession().then(({ data }) => set(data.session)).catch(() => setMe(null));
    const { data } = backend.auth.onAuthStateChange((_e, s) => set(s));
    return () => data.subscription.unsubscribe();
  }, []);
  return (
    <AppPage bottom>
      <h1 className="text-3xl">{t("Your account", "Su cuenta")}</h1>
      {me === undefined && <section className="ap-card"><p className="ap-muted flex items-center gap-2" role="status"><Loader2 className="animate-spin" size={18} aria-hidden />{t("Checking your sign-in…", "Comprobando su sesión…")}</p></section>}
      {me === null && (
        <section className="ap-card" aria-labelledby="pf-in" data-testid="profile-signed-out">
          <h2 id="pf-in" className="ap-h2">{t("Sign in to see your account", "Inicie sesión para ver su cuenta")}</h2>
          <SignInForm />
        </section>
      )}
      {me && <ProfileCards me={me} />}
      <Link to="/settings" className="ap-btn ghost" data-testid="pf-back">{t("Company settings", "Ajustes de la empresa")}</Link>
    </AppPage>
  );
}

function ProfileCards({ me }: { me: Me }) {
  const { t, lang, setLang } = useLang();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [empId, setEmpId] = useState<string | null>(null);
  const [notifyC, setNotifyC] = useState(true);
  const [notifyR, setNotifyR] = useState(true);
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [nmsg, setNmsg] = useState("");
  const [setup, setSetup] = useState<OfficeSetup | null | undefined>(undefined);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [pwMsg, setPwMsg] = useState("");
  const [savingPw, setSavingPw] = useState(false);
  const [verified, setVerified] = useState(me.verified);
  const [vStep, setVStep] = useState<"idle" | "code">("idle");
  const [vCode, setVCode] = useState("");
  const [vMsg, setVMsg] = useState("");

  useEffect(() => {
    let live = true;
    getMyAccount({ data: { token: me.token } }).then((a) => {
      if (!live) return;
      setName(a.prefs.displayName); setPhone(a.prefs.workPhone); setNotifyC(a.prefs.notifyCorrection); setNotifyR(a.prefs.notifyReceipt); setEmpId(a.employeeId);
    }).catch(() => undefined);
    getOfficeSetup({ data: { token: me.token } }).then((s) => { if (live) setSetup(s); }).catch(() => { if (live) setSetup(null); });
    return () => { live = false; };
  }, [me.token]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setMsg("");
    const n = name.trim();
    if ([...n].length < 1 || [...n].length > 80) { setMsg(t("Enter a name of 1 to 80 characters.", "Escriba un nombre de 1 a 80 caracteres.")); return; }
    if (phone.trim() && !/^[0-9+()\-.\s]{7,30}$/.test(phone.trim())) { setMsg(t("Enter a phone number with digits only, or leave it empty.", "Escriba un teléfono solo con dígitos, o déjelo vacío.")); return; }
    setSaving(true);
    try { await saveMyAccount({ data: { token: me.token, displayName: n, workPhone: phone.trim() } }); setName(n); setMsg(t("Profile saved.", "Perfil guardado.")); }
    catch { setMsg(t("We could not save your profile. Please try again.", "No pudimos guardar su perfil. Inténtelo de nuevo.")); }
    setSaving(false);
  };
  const pickLang = (l: "en" | "es") => { setLang(l); void saveMyAccount({ data: { token: me.token, language: l } }).catch(() => undefined); };
  const toggle = async (k: "notifyCorrection" | "notifyReceipt", v: boolean) => {
    if (k === "notifyCorrection") setNotifyC(v); else setNotifyR(v);
    setNmsg("");
    try { await saveMyAccount({ data: { token: me.token, [k]: v } }); setNmsg(t("Notification choice saved.", "Preferencia de avisos guardada.")); }
    catch { setNmsg(t("Could not save. Try again.", "No se pudo guardar. Inténtelo de nuevo.")); if (k === "notifyCorrection") setNotifyC(!v); else setNotifyR(!v); }
  };
  const sendCode = async () => {
    setVMsg("");
    const { error } = await backend.auth.signInWithOtp({ email: me.email, options: { shouldCreateUser: false } });
    if (error) setVMsg(t("We could not send a code. Try again later.", "No pudimos enviar un código. Inténtelo más tarde.")); else setVStep("code");
  };
  const confirmCode = async (e: React.FormEvent) => {
    e.preventDefault(); setVMsg("");
    const { data, error } = await backend.auth.verifyOtp({ email: me.email, token: vCode.trim(), type: "email" });
    if (error) setVMsg(t("That code did not work. Request a new one.", "Ese código no funcionó. Pida uno nuevo."));
    else { setVerified(!!data.user?.email_confirmed_at); setVStep("idle"); setVCode(""); }
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
  const isAdmin = setup?.company?.role === "admin";
  return (
    <>
      <section className="ap-card" aria-labelledby="pf-me" data-testid="profile-card">
        <h2 id="pf-me" className="ap-h2">{t("Who you are", "Quién es usted")}</h2>
        <div className="pf-id">
          <div className="pf-avatar" aria-hidden data-testid="pf-initials">{initials(name, me.email)}</div>
          <div className="grid">
            <strong className="text-xl" data-testid="pf-card-name">{name || me.email}</strong>
            <span className="ap-muted" data-testid="pf-company">{setup === undefined ? t("Loading…", "Cargando…") : setup?.company ? setup.company.name : t("Not part of a company yet", "Aún no pertenece a una empresa")}</span>
            <span className="ap-muted" data-testid="pf-role">{role ? t(role[0], role[1]) : "—"}</span>
          </div>
        </div>
        <p className="ap-muted">{t("Company and role come only from your company admin. You cannot change them here.", "La empresa y el rol vienen solo del administrador de su empresa. No se cambian aquí.")}</p>
      </section>

      <section className="ap-card" aria-labelledby="pf-det">
        <h2 id="pf-det" className="ap-h2">{t("Your details", "Sus datos")}</h2>
        <form onSubmit={save} className="ap-form" noValidate>
          <div className="ap-field"><Label htmlFor="pf-name">{t("Display name", "Nombre para mostrar")}</Label>
            <Input id="pf-name" autoComplete="name" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} data-testid="pf-name" /></div>
          <div className="ap-field"><Label htmlFor="pf-phone">{t("Work phone (optional)", "Teléfono de trabajo (opcional)")}</Label>
            <Input id="pf-phone" type="tel" autoComplete="tel" value={phone} maxLength={30} onChange={(e) => setPhone(e.target.value)} data-testid="pf-phone" />
            <p className="ap-muted">{t("Only people in your company can see it. Never homeowners and never on paperwork.", "Solo las personas de su empresa pueden verlo. Nunca los propietarios ni los documentos.")}</p></div>
          <button type="submit" className="ap-btn primary" disabled={saving} data-testid="pf-save">{t("Save profile", "Guardar perfil")}</button>
          {msg && <p role="status" className="ap-muted" data-testid="pf-name-msg">{msg}</p>}
        </form>
        <dl className="ap-form" data-testid="pf-facts">
          <div><dt className="font-semibold">{t("Work email", "Correo de trabajo")}</dt>
            <dd className="ap-muted"><span data-testid="pf-email">{me.email}</span>{" "}
              <span className={`pf-badge ${verified ? "ok" : "no"}`} data-testid="pf-verified">{verified ? t("Verified", "Verificado") : t("Not verified", "Sin verificar")}</span></dd></div>
          <div><dt className="font-semibold">{t("Employee ID", "ID de empleado")}</dt>
            <dd className="ap-muted" data-testid="pf-empid">{empId ?? t("Not assigned yet. Your company admin assigns it.", "Aún sin asignar. Su administrador lo asigna.")}</dd></div>
        </dl>
        {!verified && vStep === "idle" && <button type="button" className="ap-btn ghost" onClick={() => void sendCode()} data-testid="pf-verify">{t("Verify my email", "Verificar mi correo")}</button>}
        {!verified && vStep === "code" && (
          <form onSubmit={confirmCode} className="ap-form">
            <div className="ap-field"><Label htmlFor="pf-vcode">{t("Code from your email", "Código de su correo")}</Label>
              <Input id="pf-vcode" inputMode="numeric" autoComplete="one-time-code" value={vCode} onChange={(e) => setVCode(e.target.value)} data-testid="pf-vcode" /></div>
            <button type="submit" className="ap-btn primary" data-testid="pf-vconfirm">{t("Confirm code", "Confirmar código")}</button>
          </form>
        )}
        {vMsg && <p role="status" className="ap-muted">{vMsg}</p>}
      </section>

      <section className="ap-card" aria-labelledby="pf-lang">
        <h2 id="pf-lang" className="ap-h2">{t("Language", "Idioma")}</h2>
        <div className="flex gap-2" role="group" aria-label={t("Language", "Idioma")}>
          <button type="button" className={`ap-btn ${lang === "en" ? "primary" : "ghost"}`} aria-pressed={lang === "en"} data-testid="pf-en" onClick={() => pickLang("en")}>English</button>
          <button type="button" className={`ap-btn ${lang === "es" ? "primary" : "ghost"}`} aria-pressed={lang === "es"} data-testid="pf-es" onClick={() => pickLang("es")}>Español</button>
        </div>
      </section>

      <section className="ap-card" aria-labelledby="pf-not" data-testid="notify-card">
        <h2 id="pf-not" className="ap-h2">{t("Email me when…", "Envíeme un correo cuando…")}</h2>
        <label className="pf-check"><input type="checkbox" checked={notifyC} onChange={(e) => void toggle("notifyCorrection", e.target.checked)} data-testid="pf-notify-correction" />{t("the office asks me for a correction", "la oficina me pida una corrección")}</label>
        <label className="pf-check"><input type="checkbox" checked={notifyR} onChange={(e) => void toggle("notifyReceipt", e.target.checked)} data-testid="pf-notify-receipt" />{t("the office receives my packet", "la oficina reciba mi paquete")}</label>
        {nmsg && <p role="status" className="ap-muted" data-testid="pf-notify-msg">{nmsg}</p>}
      </section>

      <section className="ap-card" aria-labelledby="pf-rec" data-testid="recent-handoffs">
        <h2 id="pf-rec" className="ap-h2">{t("My recent handoffs", "Mis entregas recientes")}</h2>
        <MyHandoffs limit={3} />
        <Link to="/my-handoffs" className="underline font-semibold" data-testid="pf-all-handoffs">{t("See all my handoffs", "Ver todas mis entregas")}</Link>
        {setup?.company && (setup.company.role === "admin" || setup.company.role === "office") && <Link to="/office-handoff" className="underline font-semibold">{t("Company packets (office)", "Paquetes de la empresa (oficina)")}</Link>}
      </section>

      {isAdmin && (
        <section className="ap-card" aria-labelledby="pf-co">
          <h2 id="pf-co" className="ap-h2">{t("Company Settings", "Ajustes de la empresa")}</h2>
          <Link to="/office-setup" className="ap-btn ghost" data-testid="pf-company-settings">{t("Open Company Settings", "Abrir Ajustes de la empresa")}</Link>
        </section>
      )}

      <section className="ap-card" aria-labelledby="pf-pw" data-testid="password-card">
        <h2 id="pf-pw" className="ap-h2">{t("Security", "Seguridad")}</h2>
        <p className="ap-muted">{t("Set or change the password you use with your work email. If you forget it, sign out and use Forgot password or the emailed code.", "Establezca o cambie la contraseña que usa con su correo de trabajo. Si la olvida, cierre sesión y use ¿Olvidó su contraseña? o el código por correo.")}</p>
        <form onSubmit={changePw} className="ap-form" noValidate>
          <input type="email" autoComplete="username" value={me.email} readOnly hidden />
          <div className="ap-field"><Label htmlFor="pf-pw1">{t("New password", "Contraseña nueva")}</Label>
            <Input id="pf-pw1" type="password" autoComplete="new-password" value={pw} maxLength={200} onChange={(e) => setPw(e.target.value)} data-testid="pf-pw1" /></div>
          <div className="ap-field"><Label htmlFor="pf-pw2">{t("Repeat new password", "Repita la contraseña nueva")}</Label>
            <Input id="pf-pw2" type="password" autoComplete="new-password" value={pw2} maxLength={200} onChange={(e) => setPw2(e.target.value)} data-testid="pf-pw2" /></div>
          <button type="submit" className="ap-btn primary" disabled={savingPw} data-testid="pf-pw-save">{t("Change password", "Cambiar contraseña")}</button>
          {pwMsg && <p role="status" className="ap-muted" data-testid="pf-pw-msg">{pwMsg}</p>}
        </form>
        <button type="button" className="ap-btn ghost" onClick={() => { void backend.auth.signOut(); }} data-testid="pf-signout">{t("Sign out", "Cerrar sesión")}</button>
      </section>
    </>
  );
}
