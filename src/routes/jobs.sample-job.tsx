import { PacketInfo } from "../components/packet-info";
import { ResourceLink } from "../components/resource-link";
import { CoreGate } from "../components/core-offer";
import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useCorePath, useDemo } from "../components/demo";
import { DemoFeedback } from "../components/demo-feedback";
import { useState } from "react";
import { AppPage } from "../components/app-shell";
import { Checkbox } from "../components/ui/checkbox";
import { InspectionTimeline } from "../components/inspection-timeline";
import { Image } from "../image";
import { useLang } from "../lib/lang";
import { usePhotos, SLOTS } from "../lib/photos";
import { PendingLabel } from "../components/photo-slot";

export const Route = createFileRoute("/jobs/sample-job")({
  head: () => ({ meta: [{ title: "Job #HP-1187 · 4412 Alder Court, Sacramento" }, { name: "description", content: "Next step, paperwork timeline and compliance checks for job HP-1187." }] }),
  validateSearch: (s: Record<string, unknown>): { saved?: "1"; done?: string } => ({ saved: s.saved === "1" || s.saved === 1 ? "1" : undefined, done: typeof s.done === "string" && s.done ? s.done : undefined }),
  component: () => <CoreGate><Detail /></CoreGate>,
});

const STEPS: [string, string][] = [
  ["Get the permit", "Obtener el permiso"],
  ["File compliance form CF1R", "Presentar el formulario CF1R"],
  ["Install the equipment", "Instalar el equipo"],
  ["File installation form CF2R", "Presentar el formulario CF2R"],
  ["Rater test passed CF3R", "Prueba del evaluador aprobada CF3R"],
  ["Pass final inspection", "Aprobar la inspección final"],
];
const CHECKS: [string, string, "g" | "a" | "r"][] = [
  ["Equipment model", "Modelo del equipo", "g"],
  ["Serial number", "Número de serie", "g"],
  ["Refrigerant type R-410A", "Tipo de refrigerante R-410A", "g"],
  ["Outdoor unit location", "Ubicación de la unidad exterior", "g"],
  ["Panel size", "Tamaño del panel", "a"],
  ["Duct sealing answer", "Respuesta de sellado de ductos", "a"],
  ["Refrigerant charge reading", "Lectura de carga de refrigerante", "g"],
];

export function Detail() {
  const { t } = useLang();
  const p = useCorePath();
  const demo = useDemo();
  const { saved, done: doneId } = useSearch({ strict: false }) as { saved?: "1"; done?: string };
  const [done, setDone] = useState<boolean[]>(STEPS.map(() => false));
  const [warranty, setWarranty] = useState(false);
  const { photos, pending } = usePhotos();
  const have = SLOTS.filter((k) => photos[k]).length;
  const [sent, setSent] = useState(false);
  const marker = { g: ["Confirmed", "Confirmado"], a: ["NEEDED", "FALTA"], r: ["Blocked", "Bloqueado"] } as const;

  const summary = (title: string, es: string, text: string) => (
    <section className="cx-card calm">
      <h2 className="cx-h">{t(title, es)}</h2>
      <p>{text}</p>
      <Link to={p("/new")} className="ap-edit">{t("Edit", "Editar")}</Link>
    </section>
  );

  return (
    <AppPage bottom capture>
      {saved && (
        <div role="status" className="cx-card calm">
          <p className="font-semibold">{demo ? t("Demo job saved. Nothing is filed.", "Trabajo de demostración guardado. No se presenta nada.") : t("Job saved. This is not permit filing.", "Trabajo guardado. No es la presentación del permiso.")}</p>
          {!demo && doneId && <PacketInfo jobId={doneId} />}
          {doneId && <Link to={p("/permit/draft/$id")} params={{ id: doneId } as never} className="ap-btn primary" data-testid="open-review">{t("Open review draft", "Abrir borrador de revisión")}</Link>}
          {demo && doneId && <DemoFeedback />}
        </div>
      )}
      <h1 className="cx-h1">{t("Job #HP-1187 · 4412 Alder Court, Sacramento")}</h1>
      <Link to="/sample-job" className="ap-btn navy">{t("View sample permit draft", "Ver borrador de permiso de muestra")}</Link>

      <Link to="/sample-job" hash="panel-size" className="cx-card" aria-label={t("View panel size on the sample permit draft", "Ver el tamaño del panel en el borrador de muestra")}>
        <h2 className="cx-h">{t("Your next step", "Su siguiente paso")}</h2>
        <p className="jb-next">{t("Fix 2 missing items", "Corrija 2 datos faltantes")}</p>
        <p className="cx-note">{t("Panel size and duct sealing answer", "Tamaño del panel y respuesta de sellado de ductos")}</p>
      </Link>

      <section className="cx-card calm">
        <h2 className="cx-h">{t("Permit & paperwork", "Permiso y papeleo")}</h2>
        <ul className="ap-tl">
          {STEPS.map(([en, es], i) => (
            <li key={en}>
              <div
                role="button"
                tabIndex={0}
                className="ap-row"
                onClick={() => setDone((d) => d.map((v, k) => (k === i ? !v : v)))}
                onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); setDone((d) => d.map((v, k) => (k === i ? !v : v))); } }}
              >
                <Checkbox checked={done[i]} tabIndex={-1} aria-label={t(en, es)} onClick={(e) => e.stopPropagation()} onCheckedChange={(v) => setDone((d) => d.map((x, k) => (k === i ? v === true : x)))} />
                <span className={done[i] ? "done-text" : ""}>{t(en, es)}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <InspectionTimeline />
      <ResourceLink stage="close_out" />

      <section className="cx-card calm">
        <h2 className="cx-h">{t("Compliance checks", "Verificaciones de cumplimiento")}</h2>
        <ul>
          {CHECKS.map(([en, es, c]) => (
            <li key={en} className="ap-chk">
              <span className={`ap-dot ${c}`} aria-hidden />
              <span style={{ flex: 1 }}>{t(en, es)}</span>
              <strong className="cx-note">{t(marker[c][0], marker[c][1])}</strong>
            </li>
          ))}
        </ul>
      </section>

      <section className="cx-card calm">
        <h2 className="cx-h">{t("Warranty registration", "Registro de garantía")}</h2>
        <label className="ap-chk" style={{ gap: "1rem" }}>
          <Checkbox checked={warranty} onCheckedChange={(v) => setWarranty(v === true)} className="size-8 border-2 border-[#12264a] data-[state=checked]:bg-[#12264a]" />
          <span>{t("Warranty registered with the manufacturer", "Garantía registrada con el fabricante")}</span>
        </label>
        <p className="cx-note">{t("Registration window: 60 days after install", "Plazo de registro: 60 días después de la instalación")}</p>
      </section>

      <section className="cx-card calm">
        <h2 className="cx-h">{t("Photos", "Fotos")}</h2>
        <p>{t(`${have} attached · ${3 - have} required`, `${have} adjuntas · ${3 - have} requeridas`)}</p>
        <p className="ph-pend" data-testid="pending-count">{t(`${pending} photo(s) waiting to upload`, `${pending} foto(s) esperando para subir`)}</p>
        {SLOTS.filter((k) => photos[k]).map((k) => (
          <div key={k} className="ph-thumb"><Image src={photos[k]!.url} alt={k} width={96} height={96} /><PendingLabel p={photos[k]!} /></div>
        ))}
        <Link to={p("/new/photos")} className="ap-edit">{t("Add or change photos", "Agregar o cambiar fotos")}</Link>
      </section>

      {summary("Homeowner & site", "Propietario y sitio", "4412 Alder Court, Sacramento")}
      {summary("Equipment", "Equipo", "Carrier 25HPB536A003 · Heat pump change-out")}
      {summary("Work performed", "Trabajo realizado", "Heat-pump change-out, same pad, left side yard")}

      <button type="button" className="ap-btn primary" onClick={() => setSent(true)}>{t("Send homeowner update", "Enviar actualización al propietario")}</button>
      {sent && <p role="status" className="ap-card font-semibold">{demo ? t("Demo only: nothing is sent", "Solo demo: no se envía nada")}</p>}
    </AppPage>
  );
}
