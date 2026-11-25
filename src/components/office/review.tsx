import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { useLang } from "../../lib/lang";
import { OfficeCard, OfficeShell } from "./shell";

export type CheckKind = "conflict" | "missing" | "matched";
export type Decision = "use_evidence" | "keep_with_note" | "asked_tech";
export type ReviewCheck = { id: string; field: string; label: string; kind: CheckKind; captured: string | null; evidence: string | null; evidenceSource?: string; evidencePhotoUrl?: string; decision: Decision | null; note?: string | null };
export type ReviewRow = { label: string; value: string; source: string; check?: CheckKind };
export type ReviewData = {
  packetId: string; tracking: string; addr: string; type: string; customer: string; tech: string; sentAt: string; area?: string;
  version: { id: string; n: number; fingerprint: string } | null;
  checks: ReviewCheck[]; rows: ReviewRow[]; photos: { label: string; url?: string; id?: string }[]; activity: { time: string; text: string }[];
  /** The office confirmed it finished checking this version (migration 0030 packet_validations). */
  checked: boolean;
  signature: { requestedTo?: string; failed?: boolean; signedBy?: string; signedAt?: string } | null;
  user: { name: string; role: string };
};
export type ReviewActions = {
  decide: (checkId: string, d: Decision, note?: string) => Promise<string | null>;
  requestSignature: (toEmail: string) => Promise<string | null>;
  completeChecks: () => Promise<string | null>;
};

const shortFp = (fp: string) => `${fp.slice(0, 4)}·${fp.slice(4, 8)}`.toUpperCase();
const PILL: Record<CheckKind, string> = { conflict: "bg-[var(--pd-conflict-bg)] text-[var(--pd-conflict-fg)]", missing: "border border-dashed border-[var(--pd-gray-500)] text-[var(--pd-gray-700)]", matched: "bg-[var(--pd-success-bg)] text-[var(--pd-success-fg)]" };

/** Office review of one sealed packet version (docs/design/mockups/OfficeReview.dc.html). Conflict ≠ Missing. */
export function PacketReview({ data, actions, sample, backTo }: { data: ReviewData; actions: ReviewActions; sample?: boolean; backTo: string }) {
  const { t } = useLang();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [noteFor, setNoteFor] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [email, setEmail] = useState("");
  const kindName = (k: CheckKind) => (k === "conflict" ? t("Conflict", "Conflicto") : k === "missing" ? t("Missing", "Falta") : t("Matched", "Coincide"));
  // "Ask the tech" records a question; the item stays open until the office decides or the tech answers.
  const pending = (c: ReviewCheck) => c.kind !== "matched" && (!c.decision || c.decision === "asked_tech");
  const open = data.checks.filter(pending);
  const conflicts = data.checks.filter((c) => c.kind === "conflict" && pending(c));
  const missing = data.checks.filter((c) => c.kind === "missing" && pending(c));
  const matched = data.rows.filter((r) => r.check === "matched").length;
  const asked = data.checks.filter((c) => c.decision === "asked_tech");
  const run = async (f: () => Promise<string | null>) => { setBusy(true); setErr(""); const e = await f(); setBusy(false); if (e) setErr(e); };
  const v = data.version;

  const rail = (
    <>
      <OfficeCard title={t(`Photos · ${data.photos.length}`, `Fotos · ${data.photos.length}`)}>
        {data.photos.length === 0 ? <p className="text-[14px] text-[var(--pd-gray-600)]">{t("No photos in this version.", "No hay fotos en esta versión.")}</p> : (
          <div className="grid grid-cols-2 gap-2">{data.photos.map((p, i) => p.url
            ? <a key={p.id ?? i} href={p.url} target="_blank" rel="noreferrer" className="relative block h-24 overflow-hidden rounded-[10px] bg-[var(--pd-photo-placeholder)]"><img src={p.url} alt={p.label} className="size-full object-cover" /><span className="absolute inset-x-0 bottom-0 bg-black/60 px-2 py-1 text-[12px] text-white">{p.label}</span></a>
            : <div key={p.id ?? i} className="flex h-24 items-end rounded-[10px] bg-[var(--pd-photo-placeholder)] p-2 text-[12px] text-white">{p.label}</div>)}</div>
        )}
      </OfficeCard>
      <OfficeCard title={t("Send for signature", "Enviar para firma")}>
        {data.signature?.signedBy ? (
          <p className="text-[14px] font-semibold text-[var(--pd-success-fg)]">{t(`Signed by ${data.signature.signedBy}`, `Firmado por ${data.signature.signedBy}`)} · {data.signature.signedAt}</p>
        ) : data.signature?.requestedTo && !data.signature.failed ? (
          <p className="text-[14px]">{t(`Signature request queued for ${data.signature.requestedTo}. It shows as delivered once the email service confirms.`, `Solicitud de firma en cola para ${data.signature.requestedTo}. Aparece como entregada cuando el servicio de correo lo confirme.`)}</p>
        ) : (
          <form className="flex flex-col gap-2.5" onSubmit={(e) => { e.preventDefault(); if (email.trim()) void run(() => actions.requestSignature(email.trim())); }}>
            {data.signature?.failed && <p role="alert" className="text-[14px] font-semibold text-[var(--pd-danger-fg)]">{t(`The email to ${data.signature.requestedTo} did not go through. Check the address and send again.`, `El correo a ${data.signature.requestedTo} no se entregó. Revise la dirección y envíe de nuevo.`)}</p>}
            {!data.checked && v && (
              <div className="flex flex-col gap-2 rounded-[12px] border border-dashed border-[var(--pd-gray-500)] p-3">
                <p className="text-[14px]">{t("Mark this version checked once every value has been compared with its photo and every conflict or missing item is recorded.", "Marque esta versión como revisada cuando cada valor se haya comparado con su foto y cada conflicto o dato faltante esté anotado.")}</p>
                <button type="button" disabled={busy} onClick={() => void run(() => actions.completeChecks())} className="h-11 rounded-[10px] bg-[var(--pd-navy-900)] text-[14px] font-bold text-white">{t(`Checks complete for version ${v.n}`, `Revisión completa de la versión ${v.n}`)}</button>
              </div>
            )}
            <p className="text-[14px] text-[var(--pd-gray-700)]">{open.length ? t(`Resolve ${open.length} open ${open.length === 1 ? "item" : "items"} first.`, `Primero resuelva ${open.length} ${open.length === 1 ? "pendiente" : "pendientes"}.`) : t("Everything is resolved. The contractor signs this exact version.", "Todo está resuelto. El contratista firma esta versión exacta.")}</p>
            <label className="text-[13px] font-semibold" htmlFor="sig-to">{t("Contractor email", "Correo del contratista")}</label>
            <input id="sig-to" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} disabled={open.length > 0 || !v || !data.checked} className="h-11 rounded-[10px] border border-[var(--pd-gray-300,var(--pd-gray-300))] px-3 text-[15px] disabled:bg-[var(--pd-gray-50)]" />
            <button type="submit" disabled={busy || open.length > 0 || !v || !data.checked} className="h-12 rounded-[12px] bg-[var(--pd-orange-700)] text-[15px] font-bold text-white hover:bg-[var(--pd-orange-800)] disabled:bg-[var(--pd-gray-200)] disabled:text-[var(--pd-gray-700)]">
              {v ? t(`Send version ${v.n} for signature`, `Enviar versión ${v.n} para firma`) : t("Send for signature", "Enviar para firma")}
            </button>
          </form>
        )}
        <p className="mt-3 text-[12px] text-[var(--pd-gray-600)]">{t("Draft only. Not filed. The contractor signs this exact version.", "Solo borrador. No presentado. El contratista firma esta versión exacta.")}</p>
      </OfficeCard>
      <OfficeCard title={t("Activity", "Actividad")}>
        <ul className="flex flex-col gap-2">{data.activity.map((a, i) => <li key={i} className="grid grid-cols-[52px_1fr] gap-2 text-[13px]"><span className="font-mono text-[var(--pd-gray-600)]">{a.time}</span><span>{a.text}</span></li>)}</ul>
      </OfficeCard>
    </>
  );

  return (
    <OfficeShell active="jobs" user={data.user} sample={sample} rail={rail}>
      <div className="flex flex-wrap items-center gap-3 text-[14px]">
        <Link to={backTo as never} className="font-semibold text-[var(--pd-orange-700)] underline">← {t("Office dashboard", "Panel de oficina")}</Link>
        <span className="text-[var(--pd-gray-600)]">{data.tracking} · {data.addr}</span>
        {v && <span className="ml-auto rounded-full border border-[var(--pd-gray-200)] bg-white px-3 py-1 font-mono text-[13px]">{t("Packet", "Paquete")} v{v.n} · {shortFp(v.fingerprint)}</span>}
      </div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[28px] font-bold leading-tight !text-[var(--pd-navy-900)]">{data.type}</h1>
          <p className="text-[14px] text-[var(--pd-gray-700)]">{data.customer} · {t("captured by", "capturado por")} {data.tech} · {data.sentAt}{data.area ? ` · ${data.area}` : ""}</p>
        </div>
        <span className="rounded-[8px] bg-[var(--pd-info-bg)] px-3 py-1.5 text-[14px] font-semibold text-[var(--pd-info-fg)]">{open.length ? t("Office review", "Revisión de oficina") : t("Ready for signature", "Listo para firma")}</span>
      </div>
      {!v && <p role="status" className="rounded-[12px] border border-[var(--pd-gray-200)] bg-white p-4 text-[14px]">{t("This packet has no sealed version yet. It is sealed when the technician sends it (after the database update is live).", "Este paquete aún no tiene una versión sellada. Se sella cuando el técnico lo envía (cuando la actualización de la base de datos esté activa).")}</p>}
      {err && <p role="alert" className="rounded-[12px] border border-[var(--pd-danger-fg)] bg-[var(--pd-danger-soft-bg)] p-3 text-[14px] text-[var(--pd-danger-fg)]">{err}</p>}

      <section className="grid gap-3 md:grid-cols-3" aria-label={t("Check summary", "Resumen de revisión")}>
        <div className="rounded-[16px] border border-[var(--pd-conflict-soft-border)] bg-[var(--pd-conflict-bg)] p-4 text-[var(--pd-conflict-fg)]"><p className="text-[12px] font-bold uppercase tracking-[0.06em]">{t("Conflicts", "Conflictos")}</p><p className="font-display text-[30px] font-bold">{conflicts.length}</p><p className="text-[13px]">{t("Evidence disagrees. You decide.", "La evidencia no coincide. Usted decide.")}</p></div>
        <div className="rounded-[16px] border-2 border-dashed border-[var(--pd-gray-500)] bg-white p-4"><p className="text-[12px] font-bold uppercase tracking-[0.06em]">{t("Missing", "Falta")}</p><p className="font-display text-[30px] font-bold">{missing.length}</p><p className="text-[13px] text-[var(--pd-gray-700)]">{t("The tech still has to capture these.", "El técnico todavía tiene que capturarlos.")}</p></div>
        <div className="rounded-[16px] border border-[var(--pd-success-border)] bg-[var(--pd-success-soft-bg)] p-4 text-[var(--pd-success-fg)]"><p className="text-[12px] font-bold uppercase tracking-[0.06em]">{t("Matched", "Coincide")}</p><p className="font-display text-[30px] font-bold">{matched}</p><p className="text-[13px]">{t("Value and evidence agree.", "El valor y la evidencia coinciden.")}</p></div>
      </section>

      {[...conflicts, ...missing].map((c) => (
        <section key={c.id} className={`rounded-[16px] bg-white p-5 ${c.kind === "conflict" ? "border-2 border-[var(--pd-conflict-border)]" : "border-2 border-dashed border-[var(--pd-gray-500)]"}`} data-testid={`check-${c.field}`}>
          <h2 className="mb-3 flex items-center gap-2 text-[17px] font-bold"><span className={`rounded-full px-2.5 py-0.5 text-[12px] ${PILL[c.kind]}`}>{kindName(c.kind)}</span>{c.label}</h2>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-[12px] bg-[var(--pd-gray-50)] p-3"><p className="text-[13px] text-[var(--pd-gray-700)]">{t(`${data.tech} entered`, `${data.tech} ingresó`)}</p><p className="font-display text-[24px] font-bold">{c.captured ?? t("Nothing yet", "Nada todavía")}</p></div>
            {c.kind === "conflict" && <div className="rounded-[12px] bg-[var(--pd-gray-50)] p-3"><p className="text-[13px] text-[var(--pd-gray-700)]">{c.evidenceSource ?? t("Evidence reads", "La evidencia dice")}</p><p className="font-display text-[24px] font-bold">{c.evidence}</p></div>}
            {c.kind === "conflict" && (c.evidencePhotoUrl
              ? <a href={c.evidencePhotoUrl} target="_blank" rel="noreferrer" className="block min-h-24 overflow-hidden rounded-[12px] bg-[var(--pd-photo-placeholder)]"><img src={c.evidencePhotoUrl} alt={t(`${c.label} evidence photo`, `Foto de evidencia: ${c.label}`)} className="size-full max-h-40 object-cover" /></a>
              : <div className="grid min-h-24 place-items-center rounded-[12px] bg-[var(--pd-photo-placeholder)] text-[13px] text-[var(--pd-gray-200)]">{t("Evidence photo in the Photos panel", "Foto de evidencia en el panel de Fotos")}</div>)}
          </div>
          {c.kind === "conflict" ? (
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" disabled={busy} onClick={() => void run(() => actions.decide(c.id, "use_evidence"))} className="h-11 rounded-[10px] bg-[var(--pd-orange-700)] px-4 text-[14px] font-bold text-white hover:bg-[var(--pd-orange-800)]">{t(`Use photo value (${c.evidence})`, `Usar valor de la foto (${c.evidence})`)}</button>
              <button type="button" disabled={busy} onClick={() => void run(() => actions.decide(c.id, "asked_tech"))} className="h-11 rounded-[10px] border border-[var(--pd-gray-300)] bg-white px-4 text-[14px] font-semibold">{t(`Ask ${data.tech} to confirm`, `Pedir a ${data.tech} que confirme`)}</button>
              <button type="button" disabled={busy} onClick={() => { setNoteFor(c.id); setNote(""); }} className="h-11 rounded-[10px] border border-[var(--pd-gray-300)] bg-white px-4 text-[14px] font-semibold">{t(`Keep ${c.captured}, add note`, `Mantener ${c.captured}, agregar nota`)}</button>
            </div>
          ) : (
            <p className="mt-3 text-[14px] text-[var(--pd-gray-700)]">{t("Waiting on the technician. A missing item can't be decided in the office.", "Esperando al técnico. Un dato faltante no se puede decidir en la oficina.")}</p>
          )}
          {noteFor === c.id && (
            <form className="mt-3 flex flex-col gap-2" onSubmit={(e) => { e.preventDefault(); if (note.trim()) void run(async () => { const r = await actions.decide(c.id, "keep_with_note", note.trim()); if (!r) setNoteFor(null); return r; }); }}>
              <label htmlFor={`note-${c.id}`} className="text-[13px] font-semibold">{t("Note for the packet (required)", "Nota para el paquete (obligatoria)")}</label>
              <textarea id={`note-${c.id}`} value={note} onChange={(e) => setNote(e.target.value)} required maxLength={1000} className="min-h-20 rounded-[10px] border border-[var(--pd-gray-300)] p-3 text-[15px]" />
              <button type="submit" disabled={busy} className="h-11 self-start rounded-[10px] bg-[var(--pd-navy-900)] px-4 text-[14px] font-bold text-white">{t("Save decision", "Guardar decisión")}</button>
            </form>
          )}
        </section>
      ))}
      {asked.length > 0 && <p role="status" data-testid="asked-tech" className="rounded-[12px] border border-[var(--pd-conflict-soft-border)] bg-[var(--pd-conflict-soft-bg)] p-3 text-[14px] text-[var(--pd-conflict-fg)]">{t(`Waiting on ${data.tech} for: `, `Esperando a ${data.tech} para: `)}{asked.map((a) => a.label).join(", ")}</p>}

      <OfficeCard title={t("Captured details", "Detalles capturados")} action={<span className="text-[13px] text-[var(--pd-gray-600)]">{t("Every value shows where it came from", "Cada valor muestra de dónde vino")}</span>}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-[14px]">
            <thead><tr className="border-b border-[var(--pd-gray-200)] text-[13px] text-[var(--pd-gray-700)]">{[t("Field", "Campo"), t("Value", "Valor"), t("Source", "Fuente"), t("Check", "Revisión")].map((h) => <th key={h} scope="col" className="px-2 py-2.5 font-semibold">{h}</th>)}</tr></thead>
            <tbody>{data.rows.map((r) => (
              <tr key={r.label} className="border-b border-[var(--pd-gray-100)] last:border-0">
                <td className="px-2 py-2.5 text-[var(--pd-gray-700)]">{r.label}</td><td className="px-2 py-2.5 font-bold">{r.value}</td><td className="px-2 py-2.5">{r.source}</td>
                <td className="px-2 py-2.5">{r.check && <span className={`rounded-[6px] px-2 py-0.5 text-[13px] font-semibold ${PILL[r.check]}`}>{kindName(r.check)}</span>}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </OfficeCard>
    </OfficeShell>
  );
}
