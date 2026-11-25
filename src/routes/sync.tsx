import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CoreGate } from "../components/core-offer";
import { AppPage } from "../components/app-shell";
import { PdButton, PdSyncPill } from "../components/pd";
import { loadPhotos, JOB_ID, type PhotoRec } from "../lib/photos";
import { draftJobId, syncPhotos } from "../lib/photo-sync";
import { useLang } from "../lib/lang";
import { useDemo } from "../components/demo";

export const Route = createFileRoute("/sync")({
  head: () => ({ meta: [{ title: "Sync — PermitDraft" }, { name: "description", content: "What is still waiting to upload from this phone, and a way to try again." }, { name: "robots", content: "noindex" }] }),
  component: () => <CoreGate><SyncPage /></CoreGate>,
});


function useOnline() {
  const [on, setOn] = useState(true);
  useEffect(() => {
    const up = () => setOn(navigator.onLine);
    up(); window.addEventListener("online", up); window.addEventListener("offline", up);
    return () => { window.removeEventListener("online", up); window.removeEventListener("offline", up); };
  }, []);
  return on;
}

/** The technician's Sync tab (docs/design/MOBILE_APP_PROMPT.md, screen 7): what is still on this phone, and Try again now. */
export function SyncPage() {
  const { t, lang } = useLang();
  const demo = useDemo();
  const online = useOnline();
  const [recs, setRecs] = useState<PhotoRec[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [lastTry, setLastTry] = useState<{ at: Date; left: number } | null>(null);
  const refresh = () => loadPhotos(JOB_ID).then(setRecs).catch(() => setRecs([]));
  useEffect(() => { void refresh(); }, []);

  const waiting = (recs ?? []).filter((r) => !r.uploaded);
    const tryNow = async () => {
    setBusy(true);
    try { const left = demo ? waiting.length : await syncPhotos(draftJobId()); setLastTry({ at: new Date(), left }); } finally { setBusy(false); await refresh(); }
  };
  // When signal comes back (or the page opens online with photos waiting), try once on its own; Try again stays available.
  const pending = waiting.length;
  useEffect(() => { if (online && pending > 0 && !demo && !busy) void tryNow(); }, [online, pending > 0]); // eslint-disable-line react-hooks/exhaustive-deps
  const time = (d: Date) => d.toLocaleTimeString(lang === "es" ? "es-US" : "en-US", { hour: "numeric", minute: "2-digit" });

  const today = new Date().toLocaleDateString(lang === "es" ? "es-US" : "en-US", { weekday: "long", month: "short", day: "numeric" });
  const jobs = [...new Set((recs ?? []).map((r) => r.job))].map((job) => {
    const all = (recs ?? []).filter((r) => r.job === job), up = all.filter((r) => r.uploaded).length;
    return { job, total: all.length, up, last: Math.max(...all.map((r) => r.savedAt)) };
  });
  const open = jobs.filter((j) => j.up < j.total), delivered = jobs.filter((j) => j.up === j.total && j.total > 0);
  const label = (job: string) => (job === JOB_ID ? "PD-1187 · 1187 Oak St" : job.toUpperCase());

  return (
    <AppPage bottom>
      <div className="pd-ui -mx-4 -mt-4 flex flex-col">
        <header className="flex flex-col gap-2 bg-[var(--pd-navy-900)] px-5 pb-6 pt-5 text-white">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[14px] text-[#C9D2E0]">{today}</p>
            {!online
              ? <span className="rounded-full bg-[var(--pd-conflict-bg)] px-3 py-1 text-[13px] font-bold text-[var(--pd-conflict-fg)]">{t("No signal", "Sin señal")}</span>
              : recs === null ? null
              : waiting.length ? <PdSyncPill state="saved" lang={lang === "es" ? "es" : "en"} />
              : <span className="rounded-full border border-[#2A3F63] px-3 py-1 text-[13px] font-bold text-white">{recs.length ? t("Photos uploaded", "Fotos subidas") : t("Nothing waiting", "Nada pendiente")}</span>}
          </div>
          <h1 className="font-display text-[32px] font-bold tracking-[-0.02em] !text-white">{t("Sync", "Sincronizar")}</h1>
          <p className="text-[15px] leading-snug text-[#C9D2E0]" role="status">
            {recs === null ? t("Checking this phone…", "Revisando este teléfono…")
              : open.length === 0 ? t("Every photo on this phone has uploaded. A job reaches the office only after Finish & Send.", "Todas las fotos de este teléfono se subieron. Un trabajo llega a la oficina solo después de Finalizar y enviar.")
              : t(`${open.length} ${open.length === 1 ? "job" : "jobs"} waiting to upload · they upload on their own when this screen is open and you have signal`, `${open.length} ${open.length === 1 ? "trabajo" : "trabajos"} esperando para subir · se suben solos cuando esta pantalla está abierta y tiene señal`)}
          </p>
        </header>
        <div className="flex flex-col gap-4 px-4 pt-5">
          {open.length > 0 && (
            <section aria-labelledby="sync-wait" className="flex flex-col gap-3">
              <h2 id="sync-wait" className="text-[12px] font-bold uppercase tracking-[0.08em] !text-[var(--pd-gray-600)]">{t("Waiting to upload", "Esperando para subir")}</h2>
              {open.map((j) => (
                <div key={j.job} className="flex flex-col gap-2 rounded-[16px] border-2 border-[var(--pd-conflict-border)] bg-white px-4 py-4">
                  <p className="text-[17px] font-bold">{label(j.job)}</p>
                  <div className="flex justify-between text-[14px]"><span className="text-[var(--pd-gray-600)]">{t("Photos", "Fotos")}</span><span className="font-semibold">{t(`${j.up} of ${j.total} uploaded`, `${j.up} de ${j.total} subidas`)}</span></div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-[var(--pd-gray-100)]" role="progressbar" aria-valuemin={0} aria-valuemax={j.total} aria-valuenow={j.up} aria-label={t("Photos uploaded", "Fotos subidas")}>
                    <div className="h-full rounded-full bg-[var(--pd-orange-500)]" style={{ width: `${Math.max(6, (j.up / j.total) * 100)}%` }} />
                  </div>
                  <div className="flex justify-between text-[14px]"><span className="text-[var(--pd-gray-600)]">{t("Saved on phone", "Guardado en el teléfono")}</span><span className="font-semibold text-[var(--pd-conflict-fg)]">{time(new Date(j.last))}{online ? "" : t(" · no signal", " · sin señal")}</span></div>
                </div>
              ))}
            </section>
          )}
          {delivered.length > 0 && (
            <section aria-labelledby="sync-done" className="flex flex-col gap-3">
              <h2 id="sync-done" className="text-[12px] font-bold uppercase tracking-[0.08em] !text-[var(--pd-gray-600)]">{t("Uploaded", "Subidos")}</h2>
              {delivered.map((j) => (
                <div key={j.job} className="flex items-center gap-3 rounded-[16px] border border-[var(--pd-gray-200)] bg-white px-4 py-3">
                  <span aria-hidden className="grid size-8 place-items-center rounded-full bg-[var(--pd-success-bg)] text-[14px] font-extrabold text-[var(--pd-success-icon)]">✓</span>
                  <div><p className="text-[15px] font-bold">{label(j.job)}</p><p className="text-[13px] text-[var(--pd-gray-600)]">{t(`All ${j.total} photos uploaded`, `Las ${j.total} fotos subidas`)}</p></div>
                </div>
              ))}
            </section>
          )}
          {lastTry && (
            <p className="text-[13px] text-[var(--pd-gray-600)]" role="status">
              {t(`Last try ${time(lastTry.at)}: `, `Último intento ${time(lastTry.at)}: `)}
              {lastTry.left === 0 ? t("everything uploaded.", "todo se subió.") : t(`${lastTry.left} still waiting${online ? "" : " · no signal"}.`, `${lastTry.left} aún en espera${online ? "" : " · sin señal"}.`)}
            </p>
          )}
          <PdButton size="lg" onClick={() => { void tryNow(); }} disabled={busy || waiting.length === 0}>
            {busy ? t("Trying…", "Intentando…") : t("Try again now", "Intentar de nuevo")}
          </PdButton>
          <p className="text-center text-[13px] text-[var(--pd-gray-600)]">{demo ? t("Demo: nothing uploads or is sent. ", "Demo: nada se sube ni se envía. ") : ""}{t("Nothing counts as sent until the office has it.", "Nada cuenta como enviado hasta que la oficina lo tenga.")}</p>
          <Link to={demo ? "/demo" : "/jobs"} className="pb-4 text-center text-[14px] font-semibold text-[var(--pd-orange-700)] underline">{t("Back to today's jobs", "Volver a los trabajos de hoy")}</Link>
        </div>
      </div>
    </AppPage>
  );
}
