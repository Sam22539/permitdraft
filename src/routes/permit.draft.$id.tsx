import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppPage } from "../components/app-shell";
import { Image } from "../image";
import { useCaptured } from "../lib/captured";
import { activeType, captureSummary, DUCT_LABEL, fieldSets, uncategorized } from "../lib/capture-fields";
import { useLang } from "../lib/lang";
import { loadPhotos, SLOTS, type Slot } from "../lib/photos";

export const Route = createFileRoute("/permit/draft/$id")({
  head: () => ({ meta: [{ title: "Review draft — PermitDraft" }, { name: "description", content: "Review draft built from what was captured on the job, each value with where it came from." }] }),
  component: Review,
});

const SLOT_LABEL: Record<Slot, [string, string]> = {
  plate: ["Data plate (model and serial)", "Placa de datos (modelo y serie)"],
  outdoor: ["Outdoor unit with left side yard and clearance", "Unidad exterior con patio lateral izquierdo y espacio libre"],
  gauge: ["Refrigerant gauge or meter reading", "Lectura del manómetro o medidor de refrigerante"],
};

function Review() {
  const { id } = Route.useParams();
  const { t, lang } = useLang();
  const all = useCaptured();
  const [mounted, setMounted] = useState(false);
  const [urls, setUrls] = useState<Partial<Record<Slot, string>>>({});
  const [photoErr, setPhotoErr] = useState(false);
  useEffect(() => setMounted(true), []);
  const cap = all.find((c) => c.id === id);

  useEffect(() => {
    if (!cap) return;
    let dead = false;
    const made: string[] = [];
    loadPhotos(id).then((recs) => {
      if (dead) return;
      const m: Partial<Record<Slot, string>> = {};
      for (const r of recs) { const u = URL.createObjectURL(r.blob); made.push(u); m[r.slot] = u; }
      setUrls(m);
    }).catch(() => !dead && setPhotoErr(true));
    return () => { dead = true; made.forEach((u) => URL.revokeObjectURL(u)); };
  }, [id, !!cap]);

  if (!cap) {
    return (
      <AppPage bottom>
        <h1 className="text-3xl">{t("Review draft", "Borrador de revisión")}</h1>
        <p className="ap-muted">{mounted ? t("This captured job is not saved on this device.", "Este trabajo capturado no está guardado en este dispositivo.") : t("Loading…", "Cargando…")}</p>
        <Link to="/jobs" className="ap-btn ghost">{t("Back to Jobs", "Volver a Trabajos")}</Link>
      </AppPage>
    );
  }

  const sm = captureSummary(cap, lang);
  const when = new Date(cap.finishedAt).toLocaleString(lang === "es" ? "es-US" : "en-US", { dateStyle: "medium", timeStyle: "short" });
  const extra = uncategorized(cap);
  const missingReq = fieldSets(cap).filter((f) => f.required && String(cap.values[f.key] ?? "").trim() === "");
  const missNames = missingReq.map((f) => t(...f.label)).join(", ");
  const dash = t("Not captured", "No capturado");

  return (
    <AppPage bottom>
      <h1 className="text-3xl">{t("Review draft", "Borrador de revisión")}</h1>
      <p className="ap-muted">{sm.addr} · {activeType(cap) || sm.equip}</p>
      <p className="ap-muted">{t(`Finished ${when}. Practice job, not connected to real permit filing. Every value below is exactly what was captured; nothing here is confirmed by a reviewer yet.`, `Finalizado ${when}. Trabajo de práctica, no conectado a la presentación real de permisos. Cada valor es exactamente lo capturado; nada está confirmado por un revisor todavía.`)}</p>
      <p className="ap-next" data-testid="review-missing">{sm.missing > 0 ? t(`${sm.missing} item(s) not captured`, `${sm.missing} dato(s) sin capturar`) : t("Nothing missing from capture", "No falta nada de la captura")}</p>
      <p className="ap-next" data-testid="review-status">{missingReq.length > 0
        ? t(`Not ready for office review: ${missingReq.length} required detail(s) still missing: ${missNames}`, `No listo para revisión de oficina: faltan ${missingReq.length} dato(s) obligatorio(s): ${missNames}`)
        : t("Ready to send to office review. Every required detail is captured, but nothing is confirmed by a reviewer yet.", "Listo para enviar a revisión de oficina. Cada dato obligatorio está capturado, pero ningún revisor ha confirmado nada todavía.")}</p>

      <section className="ap-card" data-testid="review-fields">
        <h2 className="ap-h2">{t("Captured details", "Datos capturados")}</h2>
        <ul>
          {fieldSets(cap).map((f) => {
            const raw = cap.values[f.key];
            const has = raw !== undefined && String(raw).trim() !== "";
            const def = cap.formDefaults[f.key];
            let shown = "";
            if (f.kind === "check") shown = raw === "1" ? t("Ticked by the tech", "Marcado por el técnico") : "";
            else if (f.kind === "duct" && has) shown = DUCT_LABEL[raw] ? t(...DUCT_LABEL[raw]) : raw;
            else if (has) shown = raw;
            else if (def) shown = def;
            if (f.key === "ductReason" && cap.values.duct !== "exempt" && !has) return null;
            const prov = has || (f.kind === "check" && raw === "1")
              ? t(`Entered by the tech in step ${f.step} of the capture · not yet confirmed`, `Ingresado por el técnico en el paso ${f.step} de la captura · sin confirmar`)
              : def
                ? t(`Form default shown in step ${f.step}, never edited by the tech · not yet confirmed`, `Valor predeterminado del paso ${f.step}, nunca editado por el técnico · sin confirmar`)
                : f.kind === "check" ? t("Not ticked in the capture", "No marcado en la captura") : t(`Not entered in step ${f.step}`, `No ingresado en el paso ${f.step}`);
            return (
              <li key={f.key} className="ap-chk" style={{ display: "grid", gap: ".15rem" }} data-testid={`rv-${f.key}`}>
                <span className="ap-muted">{t(...f.label)}</span>
                <strong>{shown || dash}</strong>
                <span className="ap-muted text-sm">{prov}</span>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="ap-card" data-testid="review-photos">
        <h2 className="ap-h2">{t("Photos", "Fotos")}</h2>
        {SLOTS.map((s) => {
          const ref = cap.photos.find((p) => p.slot === s);
          return (
            <div key={s} className="ph-ev" data-testid={`rv-photo-${s}`}>
              <p className="font-semibold">{t(...SLOT_LABEL[s])}</p>
              {ref ? (
                <>
                  {urls[s] ? <Image src={urls[s]!} alt={t(...SLOT_LABEL[s])} width={240} height={240} /> : <p className="ap-muted">{photoErr ? t("Could not read this photo on this device.", "No se pudo leer esta foto en este dispositivo.") : t("Loading photo…", "Cargando foto…")}</p>}
                  <p className="ap-muted text-sm">{t(`Photo ${ref.name}, saved on this device ${new Date(ref.savedAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })} · Waiting to upload. Shown as evidence only; it does not confirm any value.`, `Foto ${ref.name}, guardada en este dispositivo ${new Date(ref.savedAt).toLocaleString("es-US", { dateStyle: "medium", timeStyle: "short" })} · Esperando para subir. Solo como evidencia; no confirma ningún valor.`)}</p>
                </>
              ) : <p className="ap-next">{t("No photo captured", "Sin foto capturada")}</p>}
            </div>
          );
        })}
      </section>

      {extra.length > 0 && (
        <section className="ap-card" data-testid="review-extra">
          <h2 className="ap-h2">{t("Other captured details", "Otros datos capturados")}</h2>
          <p className="ap-muted">{t("Saved as entered; they match no field of this draft. Kept as evidence.", "Guardados tal como se ingresaron; no coinciden con ningún campo de este borrador. Se conservan como evidencia.")}</p>
          <ul>
            {extra.map(([k, v]) => (
              <li key={k} className="ap-chk" style={{ display: "grid", gap: ".15rem" }}>
                <span className="ap-muted">{k}</span><strong>{v}</strong>
                <span className="ap-muted text-sm">{t("Entered by the tech during capture · not yet confirmed", "Ingresado por el técnico durante la captura · sin confirmar")}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Link to="/jobs" className="ap-btn ghost">{t("Back to Jobs", "Volver a Trabajos")}</Link>
    </AppPage>
  );
}
