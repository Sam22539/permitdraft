import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CoreGate } from "../components/core-offer";
import { AppPage } from "../components/app-shell";
import { PdButton, PdSyncPill } from "../components/pd";
import { loadPhotos, JOB_ID, type PhotoRec } from "../lib/photos";
import { draftJobId, syncPhotos } from "../lib/photo-sync";
import { useLang } from "../lib/lang";

export const Route = createFileRoute("/sync")({
  head: () => ({ meta: [{ title: "Sync — PermitDraft" }, { name: "description", content: "What is still waiting to upload from this phone, and a way to try again." }, { name: "robots", content: "noindex" }] }),
  component: () => <CoreGate><SyncPage /></CoreGate>,
});

const SLOT_LABEL: Record<string, [string, string]> = {
  plate: ["Data plate photo", "Foto de la placa de datos"], outdoor: ["Outdoor unit photo", "Foto de la unidad exterior"],
  gauge: ["Gauge or meter photo", "Foto del manómetro o medidor"], wide: ["Whole-unit photo", "Foto de la unidad completa"],
  panel: ["Panel label photo", "Foto de la etiqueta del panel"], plate_furnace: ["Furnace data plate", "Placa del horno"],
  plate_coil: ["Indoor coil data plate", "Placa del serpentín interior"], plate_outdoor: ["Outdoor unit data plate", "Placa de la unidad exterior"],
};

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
function SyncPage() {
  const { t, lang } = useLang();
  const online = useOnline();
  const [recs, setRecs] = useState<PhotoRec[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [lastTry, setLastTry] = useState<{ at: Date; left: number } | null>(null);
  const refresh = () => loadPhotos(JOB_ID).then(setRecs).catch(() => setRecs([]));
  useEffect(() => { void refresh(); }, []);

  const waiting = (recs ?? []).filter((r) => !r.uploaded);
  const done = (recs ?? []).filter((r) => r.uploaded);
  const tryNow = async () => {
    setBusy(true);
    try { const left = await syncPhotos(draftJobId()); setLastTry({ at: new Date(), left }); } finally { setBusy(false); await refresh(); }
  };
  const time = (d: Date) => d.toLocaleTimeString(lang === "es" ? "es-US" : "en-US", { hour: "numeric", minute: "2-digit" });

  return (
    <AppPage bottom>
      <div className="pd flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-[28px] font-bold tracking-[-0.02em]">{t("Sync", "Sincronizar")}</h1>
          <PdSyncPill state={!online ? "queued" : waiting.length ? "saved" : "delivered"} lang={lang === "es" ? "es" : "en"} />
        </div>
        <p className="text-[15px] text-[var(--pd-gray-700)]" role="status">
          {recs === null ? t("Checking this phone…", "Revisando este teléfono…")
            : waiting.length === 0 ? t("Nothing is waiting. Everything on this phone has uploaded.", "No hay nada pendiente. Todo lo de este teléfono se subió.")
            : online ? t(`${waiting.length} item(s) waiting to upload.`, `${waiting.length} elemento(s) esperando para subir.`)
            : t(`${waiting.length} item(s) waiting. They upload on their own when you have signal.`, `${waiting.length} elemento(s) en espera. Se suben solos cuando tenga señal.`)}
        </p>

        {waiting.length > 0 && (
          <section aria-labelledby="sync-wait" className="flex flex-col gap-2.5">
            <h2 id="sync-wait" className="text-[12px] font-bold uppercase tracking-[0.06em] text-[var(--pd-gray-600)]">{t("Waiting to upload", "Esperando para subir")}</h2>
            {waiting.map((r) => (
              <div key={r.key} className="flex flex-col gap-1 rounded-[16px] border-2 border-[var(--pd-conflict-border)] bg-white px-4 py-3">
                <p className="text-[16px] font-bold">{t(...(SLOT_LABEL[r.slot] ?? [r.slot, r.slot]))}</p>
                <p className="text-[13px] text-[var(--pd-gray-600)]">{t("Saved on this phone", "Guardada en este teléfono")} · {time(new Date(r.savedAt))}</p>
              </div>
            ))}
          </section>
        )}

        {done.length > 0 && (
          <section aria-labelledby="sync-done" className="flex flex-col gap-2.5">
            <h2 id="sync-done" className="text-[12px] font-bold uppercase tracking-[0.06em] text-[var(--pd-gray-600)]">{t("Uploaded", "Subidas")}</h2>
            {done.map((r) => (
              <div key={r.key} className="flex items-center gap-3 rounded-[16px] border border-[var(--pd-gray-200)] bg-white px-4 py-3">
                <span aria-hidden className="grid size-7 place-items-center rounded-full bg-[var(--pd-success-bg)] text-[13px] font-extrabold text-[var(--pd-success-icon)]">✓</span>
                <p className="text-[14px] font-semibold">{t(...(SLOT_LABEL[r.slot] ?? [r.slot, r.slot]))}</p>
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
        <p className="text-center text-[12px] text-[var(--pd-gray-600)]">{t("Nothing counts as sent until the office has it.", "Nada cuenta como enviado hasta que la oficina lo tenga.")}</p>
        <Link to="/jobs" className="text-center text-[14px] font-semibold text-[var(--pd-orange-700)] underline">{t("Back to today's jobs", "Volver a los trabajos de hoy")}</Link>
      </div>
    </AppPage>
  );
}
