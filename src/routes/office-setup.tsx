import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppPage } from "../components/app-shell";
import { SignInForm, useSessionEmail } from "../components/core-offer";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { backend } from "../lib/backend";
import { useLang } from "../lib/lang";
import { addMember, confirmInboxCode, createCompany, getOfficeSetup, removeMember, requestInboxCode, type OfficeSetup } from "../lib/office";

export const Route = createFileRoute("/office-setup")({
  head: () => ({ meta: [{ title: "Office setup — PermitDraft" }, { name: "description", content: "Set up your company, its technicians and office reviewers, and the verified office inbox that hears when a job is finished." }] }),
  component: OfficeSetupPage,
});

type Role = "admin" | "office" | "technician";
const ROLES: [Role, string, string][] = [["technician", "Technician", "Técnico"], ["office", "Office reviewer", "Revisor de oficina"], ["admin", "Admin", "Administrador"]];

async function token() {
  const { data } = await backend.auth.getSession();
  const t = data.session?.access_token;
  if (!t) throw new Error("auth");
  return t;
}

function OfficeSetupPage() {
  const { t } = useLang();
  const email = useSessionEmail();
  const [setup, setSetup] = useState<OfficeSetup | null | undefined>(undefined);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [mEmail, setMEmail] = useState("");
  const [mRole, setMRole] = useState<Role>("technician");
  const [inbox, setInbox] = useState("");
  const [code, setCode] = useState("");

  useEffect(() => {
    if (!email) { setSetup(email === null ? null : undefined); return; }
    let live = true;
    token().then((tk) => getOfficeSetup({ data: { token: tk } })).then((s) => { if (live) setSetup(s); }, () => { if (live) { setSetup(null); setMsg(t("Could not read your office setup. Reload to try again.", "No se pudo leer su configuración de oficina. Recargue para intentarlo de nuevo.")); } });
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email]);

  async function run(fn: (tk: string) => Promise<{ ok: boolean; setup?: OfficeSetup; reason?: string }>, fail: (reason?: string) => string, done?: () => void) {
    setBusy(true); setMsg("");
    try {
      const r = await fn(await token());
      if (r.ok && r.setup) { setSetup(r.setup); done?.(); } else setMsg(fail(r.reason));
    } catch { setMsg(fail()); }
    setBusy(false);
  }
  const roleName = (r: Role) => { const x = ROLES.find(([k]) => k === r)!; return t(x[1], x[2]); };
  const co = setup?.company;
  const admin = co?.role === "admin";

  return (
    <AppPage bottom>
      <h1 className="text-3xl">{t("Office setup", "Configuración de oficina")}</h1>
      <p className="ap-muted">{t("When a technician finishes a job, PermitDraft emails your company's verified office inbox a link to review it. Only signed-in office reviewers of your company can open it.", "Cuando un técnico termina un trabajo, PermitDraft envía al buzón verificado de su empresa un enlace para revisarlo. Solo los revisores de oficina de su empresa con sesión iniciada pueden abrirlo.")}</p>

      {email === null && (
        <section className="ap-card" aria-labelledby="os-sign">
          <h2 id="os-sign" className="ap-h2">{t("Sign in", "Iniciar sesión")}</h2>
          <SignInForm />
        </section>
      )}
      {email && setup === undefined && <p className="ap-muted" role="status">{t("Loading…", "Cargando…")}</p>}

      {setup && !co && (
        <section className="ap-card" aria-labelledby="os-new" data-testid="os-no-company">
          <h2 id="os-new" className="ap-h2">{t("Your company", "Su empresa")}</h2>
          <p className="ap-muted">{t(`${setup.me} is not part of a company yet. Ask your company's admin to add this address, or create your company and become its admin.`, `${setup.me} todavía no pertenece a una empresa. Pida al administrador de su empresa que agregue este correo, o cree su empresa y sea su administrador.`)}</p>
          <form className="ap-form" onSubmit={(e) => { e.preventDefault(); if (name.trim()) void run((tk) => createCompany({ data: { token: tk, name } }), () => t("Could not create the company. You may already belong to one: reload.", "No se pudo crear la empresa. Quizá ya pertenece a una: recargue.")); }}>
            <div className="ap-field"><Label htmlFor="os-name">{t("Company name", "Nombre de la empresa")}</Label>
              <Input id="os-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} required data-testid="os-company-name" /></div>
            <button type="submit" className="ap-btn primary" disabled={busy} data-testid="os-create">{t("Create company", "Crear empresa")}</button>
          </form>
        </section>
      )}

      {co && (
        <>
          <section className="ap-card" aria-labelledby="os-co" data-testid="os-company">
            <h2 id="os-co" className="ap-h2">{co.name}</h2>
            <p className="ap-muted">{t(`You are signed in as ${setup!.me}, ${roleName(co.role).toLowerCase()} of this company.`, `Sesión iniciada como ${setup!.me}, ${roleName(co.role).toLowerCase()} de esta empresa.`)}</p>
          </section>

          <section className="ap-card" aria-labelledby="os-inbox" data-testid="os-inbox">
            <h2 id="os-inbox" className="ap-h2">{t("Office inbox", "Buzón de oficina")}</h2>
            {setup!.inbox?.email && setup!.inbox.verifiedAt ? (
              <p role="status" data-testid="os-inbox-status" data-status="verified"><strong>{t("Verified:", "Verificado:")}</strong> {setup!.inbox.email}. {t("Finished jobs email this inbox.", "Los trabajos terminados envían correo a este buzón.")}</p>
            ) : (
              <p role="status" data-testid="os-inbox-status" data-status="none"><strong>{t("Not set up.", "Sin configurar.")}</strong> {t("No office email goes out until an admin verifies an inbox. Packets are still saved.", "No sale ningún correo a la oficina hasta que un administrador verifique un buzón. Los paquetes se siguen guardando.")}</p>
            )}
            {admin && (
              <>
                <form className="ap-form" onSubmit={(e) => { e.preventDefault(); void run((tk) => requestInboxCode({ data: { token: tk, email: inbox } }), (r) => r === "wait" ? t("A code was just sent. Wait a minute before asking again.", "Se acaba de enviar un código. Espere un minuto antes de pedir otro.") : r === "email" ? t("The code email could not be sent to that address, so nothing changed.", "No se pudo enviar el correo con el código a esa dirección, así que nada cambió.") : t("Check the address and try again.", "Revise la dirección e inténtelo de nuevo.")); }}>
                  <div className="ap-field"><Label htmlFor="os-inbox-email">{setup!.inbox?.email ? t("Change the office inbox", "Cambiar el buzón de oficina") : t("Office inbox address", "Dirección del buzón de oficina")}</Label>
                    <Input id="os-inbox-email" type="email" value={inbox} onChange={(e) => setInbox(e.target.value)} maxLength={254} required autoComplete="off" data-testid="os-inbox-email" /></div>
                  <button type="submit" className="ap-btn ghost" disabled={busy} data-testid="os-send-code">{t("Email a verification code", "Enviar un código de verificación")}</button>
                </form>
                {setup!.inbox?.pending && (
                  <form className="ap-form" onSubmit={(e) => { e.preventDefault(); void run((tk) => confirmInboxCode({ data: { token: tk, code } }), (r) => r === "wrong" ? t("That code is not right. Check the email and try again.", "Ese código no es correcto. Revise el correo e inténtelo de nuevo.") : t("That code has expired. Email a new one.", "Ese código venció. Envíe uno nuevo."), () => setCode("")); }}>
                    <p className="ap-muted" data-testid="os-pending">{t(`A code was emailed to ${setup!.inbox.pending}. Enter it here to verify that inbox.`, `Se envió un código a ${setup!.inbox.pending}. Escríbalo aquí para verificar ese buzón.`)}</p>
                    <div className="ap-field"><Label htmlFor="os-code">{t("Code from that inbox", "Código de ese buzón")}</Label>
                      <Input id="os-code" value={code} onChange={(e) => setCode(e.target.value)} inputMode="numeric" autoComplete="one-time-code" required data-testid="os-code" /></div>
                    <button type="submit" className="ap-btn primary" disabled={busy} data-testid="os-verify">{t("Verify inbox", "Verificar buzón")}</button>
                  </form>
                )}
              </>
            )}
            {!admin && <p className="ap-muted">{t("Only your company's admin can change the office inbox.", "Solo el administrador de su empresa puede cambiar el buzón de oficina.")}</p>}
          </section>

          {admin && (
            <section className="ap-card" aria-labelledby="os-people" data-testid="os-people">
              <h2 id="os-people" className="ap-h2">{t("People", "Personas")}</h2>
              <p className="ap-muted">{t("Add each person by the address they sign in with. Technicians' finished jobs go to this company; office reviewers and admins open them.", "Agregue a cada persona por el correo con el que inicia sesión. Los trabajos terminados de los técnicos van a esta empresa; los revisores de oficina y administradores los abren.")}</p>
              <ul className="grid gap-2">
                {setup!.members.map((m) => (
                  <li key={m.email} className="flex items-center justify-between gap-2" data-testid="os-member">
                    <span className="break-all">{m.email} · {roleName(m.role)}</span>
                    {m.email !== setup!.me && (
                      <button type="button" className="underline font-semibold" disabled={busy} onClick={() => void run((tk) => removeMember({ data: { token: tk, email: m.email } }), () => t("Could not remove that person.", "No se pudo quitar a esa persona."))}>{t("Remove", "Quitar")}</button>
                    )}
                  </li>
                ))}
              </ul>
              <form className="ap-form" onSubmit={(e) => { e.preventDefault(); void run((tk) => addMember({ data: { token: tk, email: mEmail, role: mRole } }), (r) => r === "taken" ? t("That address already belongs to a company.", "Ese correo ya pertenece a una empresa.") : t("Check the address and try again.", "Revise el correo e inténtelo de nuevo."), () => setMEmail("")); }}>
                <div className="ap-field"><Label htmlFor="os-m-email">{t("Their sign-in email", "Su correo de inicio de sesión")}</Label>
                  <Input id="os-m-email" type="email" value={mEmail} onChange={(e) => setMEmail(e.target.value)} maxLength={254} required autoComplete="off" data-testid="os-member-email" /></div>
                <div className="ap-field"><Label htmlFor="os-m-role">{t("Role", "Rol")}</Label>
                  <Select value={mRole} onValueChange={(v) => setMRole(v as Role)}>
                    <SelectTrigger id="os-m-role" className="w-full bg-white"><SelectValue /></SelectTrigger>
                    <SelectContent>{ROLES.map(([k, en, es]) => <SelectItem key={k} value={k}>{t(en, es)}</SelectItem>)}</SelectContent>
                  </Select></div>
                <button type="submit" className="ap-btn ghost" disabled={busy} data-testid="os-add">{t("Add person", "Agregar persona")}</button>
              </form>
            </section>
          )}
          {(co.role === "office" || admin) && <Link to="/office-handoff" className="ap-btn ghost">{t("Open office handoff", "Abrir entrega a oficina")}</Link>}
        </>
      )}
      {msg && <p role="alert" className="cx-err" data-testid="os-error">{msg}</p>}
    </AppPage>
  );
}
