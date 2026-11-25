import { useState } from "react";
import { useLang } from "../../lib/lang";

export type SignData = {
  addr: string; versionN: number; fingerprint: string; area?: string; reviewer?: string;
  rows: { label: string; value: string; note?: string }[]; photos: number;
  signed: { by: string; at: string } | null;
};

const shortFp = (fp: string) => `${fp.slice(0, 4)}·${fp.slice(4, 8)}`.toUpperCase();

/** The contractor signs one exact version (docs/design/mockups/ContractorSign.dc.html). Any later change needs a new signature. */
export function SignVersion({ data, onSign, sample }: { data: SignData; onSign: (name: string) => Promise<string | null>; sample?: boolean }) {
  const { t } = useLang();
  const [ok, setOk] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const n = data.versionN;
  return (
    <div className="pd-ui min-h-screen bg-[var(--pd-gray-50)]">
      <header className="flex h-16 items-center gap-2.5 bg-[var(--pd-navy-900)] px-5 text-white">
        <img src="/generated-assets/company-logo-white.png" alt="" className="size-8" />
        <span className="font-display text-[20px] font-bold">PermitDraft</span>
        {sample && <span className="ml-2 rounded-full bg-[var(--pd-orange-700)] px-3 py-1 text-[12px] font-bold uppercase">{t("Sample", "Muestra")}</span>}
      </header>
      <main className="mx-auto flex max-w-[640px] flex-col gap-5 px-4 py-8">
        <div>
          <p className="text-[14px] font-semibold text-[var(--pd-gray-700)]">{t("Permit draft for your signature", "Borrador de permiso para su firma")}</p>
          <h1 className="font-display text-[30px] font-bold leading-tight !text-[var(--pd-navy-900)]">{data.addr}</h1>
        </div>
        <section className="overflow-hidden rounded-[16px] border border-[var(--pd-gray-200)] bg-white">
          <div className="flex items-center justify-between gap-3 border-b border-[var(--pd-gray-200)] bg-[var(--pd-gray-50)] px-4 py-3">
            <span className="text-[15px] font-bold">{t(`Version ${n}`, `Versión ${n}`)}</span>
            <span className="font-mono text-[14px]">{t("Fingerprint", "Huella")} {shortFp(data.fingerprint)}</span>
          </div>
          {data.rows.map((r) => (
            <div key={r.label} className="flex justify-between gap-4 border-b border-[var(--pd-gray-100)] px-4 py-3 text-[15px] last:border-0">
              <span className="text-[var(--pd-gray-700)]">{r.label}</span>
              <span className="text-right font-semibold">{r.value}{r.note && <span className="block text-[13px] font-normal text-[var(--pd-success-fg)]">{r.note}</span>}</span>
            </div>
          ))}
          <div className="flex justify-between gap-4 border-t border-[var(--pd-gray-100)] px-4 py-3 text-[15px]"><span className="text-[var(--pd-gray-700)]">{t("Evidence", "Evidencia")}</span><span className="font-semibold">{t(`${data.photos} photos`, `${data.photos} fotos`)}</span></div>
          {data.reviewer && <div className="flex justify-between gap-4 border-t border-[var(--pd-gray-100)] px-4 py-3 text-[15px]"><span className="text-[var(--pd-gray-700)]">{t("Reviewed by office", "Revisado por la oficina")}</span><span className="font-semibold">{data.reviewer}</span></div>}
        </section>
        <p className="rounded-[12px] bg-[var(--pd-notice-bg)] p-4 text-[14px] text-[var(--pd-conflict-fg)]">{t(`Draft — not a guarantee of compliance. You file it yourself on ${data.area ?? "your city's"} official permit portal.`, `Borrador — no garantiza el cumplimiento. Usted lo presenta en el portal oficial de permisos de ${data.area ?? "su ciudad"}.`)}</p>
        {data.signed ? (
          <p role="status" className="rounded-[16px] border border-[var(--pd-success-border)] bg-[var(--pd-success-soft-bg)] p-4 text-[16px] font-semibold text-[var(--pd-success-fg)]">{t(`Version ${n} signed by ${data.signed.by} · ${data.signed.at}`, `Versión ${n} firmada por ${data.signed.by} · ${data.signed.at}`)}</p>
        ) : (
          <form className="flex flex-col gap-3" onSubmit={async (e) => { e.preventDefault(); if (!ok || !name.trim()) return; setBusy(true); setErr(""); const r = await onSign(name.trim()); setBusy(false); if (r) setErr(r); }}>
            <label className="flex items-start gap-3 text-[16px]"><input type="checkbox" checked={ok} onChange={(e) => setOk(e.target.checked)} className="mt-1 size-5 accent-[var(--pd-orange-700)]" />{t(`I reviewed version ${n} and it matches the work done.`, `Revisé la versión ${n} y coincide con el trabajo hecho.`)}</label>
            <label htmlFor="sig-name" className="text-[14px] font-semibold">{t("Your full name", "Su nombre completo")}</label>
            <input id="sig-name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={200} autoComplete="name" className="h-12 rounded-[12px] border border-[var(--pd-gray-300)] bg-white px-3 text-[16px]" />
            {err && <p role="alert" className="text-[14px] text-[var(--pd-danger-fg)]">{err}</p>}
            <button type="submit" disabled={busy || !ok || !name.trim()} className="h-14 rounded-[14px] bg-[var(--pd-orange-700)] text-[17px] font-bold text-white hover:bg-[var(--pd-orange-800)] disabled:bg-[var(--pd-gray-200)] disabled:text-[var(--pd-gray-700)]">{busy ? t("Signing…", "Firmando…") : t(`Sign version ${n}`, `Firmar versión ${n}`)}</button>
            <p className="text-center text-[13px] text-[var(--pd-gray-600)]">{t(`Any change after signing creates version ${n + 1} and needs a new signature.`, `Cualquier cambio después de firmar crea la versión ${n + 1} y necesita una nueva firma.`)}</p>
          </form>
        )}
      </main>
    </div>
  );
}
