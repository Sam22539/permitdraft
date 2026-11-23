import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppPage } from "../components/app-shell";
import { SignInForm, useSessionEmail } from "../components/core-offer";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { backend } from "../lib/backend";
import { useLang } from "../lib/lang";
import { getBilling, getTeamDetails, setBillingAddress, setCompanyName, setEmployeeId, setMemberRole } from "../lib/account";
import { ManageSubscriptionButton, useAccess } from "../lib/payments/buy";
import { addMember, confirmInboxCode, createCompany, getOfficeSetup, removeMember, requestInboxCode, type OfficeSetup } from "../lib/office";

export const Route = createFileRoute("/office-setup")({
  head: () => ({ meta: [{ title: "Company Settings and office setup — PermitDraft" }, { name: "description", content: "Set up your company, its technicians and office reviewers, and the verified office inbox that hears when a job is finished." }] }),
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
  const [coName, setCoName] = useState("");
  const [bill, setBill] = useState({ line1: "", line2: "", city: "", state: "", zip: "" });
  const [phones, setPhones] = useState<Record<string, string>>({});
  const [ids, setIds] = useState<Record<string, string>>({});
  const [smsg, setSmsg] = useState("");
  const coreAccess = useAccess("permitdraft_core");

  useEffect(() => {
    if (!email) { setSetup(email === null ? null : undefined); return; }
    let live = true;
    token().then(async (tk) => {
      const s = await getOfficeSetup({ data: { token: tk } });
      if (s.company?.role === "admin") {
        const [b, d] = await Promise.all([getBilling({ data: { token: tk } }), getTeamDetails({ data: { token: tk } })]);
        if (live && b) setBill(b);
        if (live) { setPhones(Object.fromEntries(d.people.map((p) => [p.email, p.phone]))); setIds(Object.fromEntries(s.members.map((m) => [m.email, m.employeeId ?? ""]))); setCoName(s.company.name); }
      }
      return s;
    }).then((s) => { if (live) setSetup(s); }, () => { if (live) { setSetup(null); setMsg(t("Could not read your office setup. Reload to try again.", "No se pudo leer su configuración de oficina. Recargue para intentarlo de nuevo.")); } });
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
      <h1 className="text-3xl">{t("Company Settings and office setup", "Ajustes de la empresa y configuración de oficina")}</h1>
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
            <section className="ap-card" aria-labelledby="os-biz" data-testid="os-business">
              <h2 id="os-biz" className="ap-h2">{t("Business name", "Nombre de la empresa")}</h2>
              <form className="ap-form" onSubmit={(e) => { e.preventDefault(); setSmsg(""); void (async () => { try { const r = await setCompanyName({ data: { token: await token(), name: coName } }); if (r.ok) { setSetup((x) => x && x.company ? { ...x, company: { ...x.company, name: coName.trim() } } : x); setSmsg(t("Business name saved.", "Nombre guardado.")); } else setSmsg(t("Could not save the name.", "No se pudo guardar el nombre.")); } catch { setSmsg(t("Could not save the name.", "No se pudo guardar el nombre.")); } })(); }}>
                <div className="ap-field"><Label htmlFor="os-coname">{t("Business name", "Nombre de la empresa")}</Label>
                  <Input id="os-coname" value={coName} maxLength={120} onChange={(e) => setCoName(e.target.value)} required data-testid="os-coname" /></div>
                <button type="submit" className="ap-btn ghost" data-testid="os-coname-save">{t("Save business name", "Guardar nombre")}</button>
              </form>
              {smsg && <p role="status" className="ap-muted" data-testid="os-smsg">{smsg}</p>}
            </section>
          )}
          {admin && (
            <section className="ap-card" aria-labelledby="os-people" data-testid="os-people">
              <h2 id="os-people" className="ap-h2">{t("People", "Personas")}</h2>
              <p className="ap-muted">{t("Add each person by the address they sign in with. Technicians' finished jobs go to this company; office reviewers and admins open them.", "Agregue a cada persona por el correo con el que inicia sesión. Los trabajos terminados de los técnicos van a esta empresa; los revisores de oficina y administradores los abren.")}</p>
              <ul className="grid gap-4">
                {setup!.members.map((m) => (
                  <li key={m.email} className="grid gap-2" data-testid="os-member">
                    <span className="break-all font-semibold">{m.email}{phones[m.email] ? ` · ${phones[m.email]}` : ""}</span>
                    {m.email === setup!.me ? (
                      <span className="ap-muted">{roleName(m.role)} · {t("you cannot change your own role", "no puede cambiar su propio rol")}</span>
                    ) : (
                      <Select value={m.role} onValueChange={(v) => void run((tk) => setMemberRole({ data: { token: tk, email: m.email, role: v } }).then(async (r) => ({ ok: r.ok, setup: r.ok ? await getOfficeSetup({ data: { token: tk } }) : undefined })), () => t("Could not change that role.", "No se pudo cambiar ese rol."))}>
                        <SelectTrigger className="w-full bg-white min-h-12" aria-label={t(`Role for ${m.email}`, `Rol de ${m.email}`)} data-testid="os-role"><SelectValue /></SelectTrigger>
                        <SelectContent>{ROLES.map(([k, en, es]) => <SelectItem key={k} value={k}>{t(en, es)}</SelectItem>)}</SelectContent>
                      </Select>
                    )}
                    <div className="flex gap-2 items-end">
                      <div className="ap-field flex-1"><Label htmlFor={`os-id-${m.email}`}>{t("Employee ID", "ID de empleado")}</Label>
                        <Input id={`os-id-${m.email}`} value={ids[m.email] ?? ""} maxLength={40} autoComplete="off" onChange={(e) => setIds((x) => ({ ...x, [m.email]: e.target.value }))} data-testid="os-empid" /></div>
                      <button type="button" className="ap-btn ghost !w-auto" disabled={busy} data-testid="os-empid-save" onClick={() => void run((tk) => setEmployeeId({ data: { token: tk, email: m.email, employeeId: ids[m.email] ?? "" } }).then(async (r) => ({ ok: r.ok, reason: r.reason, setup: r.ok ? await getOfficeSetup({ data: { token: tk } }) : undefined })), (r) => r === "taken" ? t("That ID is already used in your company.", "Ese ID ya se usa en su empresa.") : t("Could not save that ID. Use letters, numbers and hyphens.", "No se pudo guardar ese ID. Use letras, números y guiones."))}>{t("Save ID", "Guardar ID")}</button>
                    </div>
                    {m.email !== setup!.me && (
                      <button type="button" className="underline font-semibold text-left" disabled={busy} onClick={() => void run((tk) => removeMember({ data: { token: tk, email: m.email } }), () => t("Could not remove that person.", "No se pudo quitar a esa persona."))}>{t("Remove", "Quitar")}</button>
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
          {admin && (
            <section className="ap-card" aria-labelledby="os-bill" data-testid="os-billing">
              <h2 id="os-bill" className="ap-h2">{t("Billing", "Facturación")}</h2>
              <form className="ap-form" onSubmit={(e) => { e.preventDefault(); setSmsg(""); void (async () => { try { const r = await setBillingAddress({ data: { token: await token(), ...bill } }); setSmsg(r.ok ? t("Billing address saved.", "Dirección de facturación guardada.") : t("Could not save the address.", "No se pudo guardar la dirección.")); } catch { setSmsg(t("Could not save the address.", "No se pudo guardar la dirección.")); } })(); }}>
                {([["line1", "Street address", "Dirección"], ["line2", "Suite or unit (optional)", "Suite o unidad (opcional)"], ["city", "City", "Ciudad"], ["state", "State", "Estado"], ["zip", "ZIP code", "Código postal"]] as const).map(([k, en, es]) => (
                  <div className="ap-field" key={k}><Label htmlFor={`os-b-${k}`}>{t(en, es)}</Label>
                    <Input id={`os-b-${k}`} value={bill[k]} maxLength={k === "zip" ? 20 : 200} onChange={(e) => setBill((b) => ({ ...b, [k]: e.target.value }))} data-testid={`os-b-${k}`} /></div>
                ))}
                <button type="submit" className="ap-btn ghost" data-testid="os-bill-save">{t("Save billing address", "Guardar dirección de facturación")}</button>
              </form>
              <p className="ap-muted">{t("Card details are never stored here. Subscription changes open Stripe's own page for your account.", "Los datos de la tarjeta nunca se guardan aquí. Los cambios de suscripción abren la página de Stripe de su cuenta.")}</p>
              {coreAccess === true
                ? <ManageSubscriptionButton priceHandle="permitdraft_core_4900_usd_monthly" className="ap-btn ghost" data-testid="os-manage-sub">{t("Manage subscription", "Administrar suscripción")}</ManageSubscriptionButton>
                : coreAccess === false ? <p className="ap-muted" data-testid="os-no-sub">{t("No active Core subscription on your admin account.", "No hay suscripción activa de Core en su cuenta de administrador.")}</p> : null}
            </section>
          )}
          {(co.role === "office" || admin) && <Link to="/office-handoff" className="ap-btn ghost">{t("Open office handoff", "Abrir entrega a oficina")}</Link>}
        </>
      )}
      {msg && <p role="alert" className="cx-err" data-testid="os-error">{msg}</p>}
    </AppPage>
  );
}
