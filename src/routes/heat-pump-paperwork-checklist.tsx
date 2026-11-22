import { createFileRoute, Link } from "@tanstack/react-router";
import { ClipboardList, Camera, Gauge, FileSearch, Landmark } from "lucide-react";
import { AppPage } from "../components/app-shell";
import { Image } from "../image";
import { useEffect, useState } from "react";
import { Checkbox } from "../components/ui/checkbox";
import { useLang } from "../lib/lang";

const title = "Heat Pump Change-Out Paperwork Checklist — PermitDraft";
const description = "A free field-to-office checklist for residential heat pump change-outs: job details, nameplate and wide photos, commissioning readings, and office review before a permit draft is filed. No sign-in.";

export const Route = createFileRoute("/heat-pump-paperwork-checklist")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "article" },
    ],
  }),
  component: Checklist,
});

type Item = [string, string];
type Group = { id: string; icon: typeof Camera; h: Item; who: Item; items: Item[] };

const STORE = "pd-heat-pump-checklist-v1";

const GROUPS: Group[] = [
  {
    id: "before-job", icon: ClipboardList,
    h: ["Before the job", "Antes del trabajo"],
    who: ["Office or technician", "Oficina o técnico"],
    items: [
      ["Record the job address.", "Anote la dirección del trabajo."],
      ["Record the work date.", "Anote la fecha del trabajo."],
      ["Record the technician doing the work.", "Anote el técnico que hace el trabajo."],
      ["Write the scope: what stays and what changes.", "Escriba el alcance: qué se queda y qué cambia."],
      ["Note the permit authority, if known.", "Anote la autoridad de permisos, si se conoce."],
      ["Flag any electrical or duct changes.", "Marque cualquier cambio eléctrico o de ductos."],
    ],
  },
  {
    id: "before-leaving", icon: Camera,
    h: ["Before leaving the site: photos", "Antes de salir del sitio: fotos"],
    who: ["Technician", "Técnico"],
    items: [
      ["Take readable close-ups of the model and serial nameplate on the indoor unit.", "Tome primeros planos legibles de la placa de modelo y serie de la unidad interior."],
      ["Take readable close-ups of the model and serial nameplate on the outdoor unit.", "Tome primeros planos legibles de la placa de modelo y serie de la unidad exterior."],
      ["Tag each photo with its unit (indoor or outdoor).", "Etiquete cada foto con su unidad (interior o exterior)."],
      ["Take wide photos showing the installed equipment.", "Tome fotos amplias que muestren el equipo instalado."],
      ["Take wide photos of relevant changes, such as the disconnect, ducts or condensate routing, where applicable.", "Tome fotos amplias de los cambios relevantes, como el desconectador, los ductos o la ruta del condensado, cuando aplique."],
      ["Reopen the photos and retake any label that is blurry or hidden by glare.", "Vuelva a abrir las fotos y repita cualquier etiqueta borrosa o tapada por reflejos."],
    ],
  },
  {
    id: "readings", icon: Gauge,
    h: ["Before leaving the site: readings", "Antes de salir del sitio: lecturas"],
    who: ["Technician", "Técnico"],
    items: [
      ["Record each applicable commissioning reading with its value and units.", "Anote cada lectura de puesta en marcha que aplique con su valor y unidades."],
      ["Note where it was taken: indoor or outdoor.", "Anote dónde se tomó: interior o exterior."],
      ["Note the time, the technician and the source of each reading.", "Anote la hora, el técnico y la fuente de cada lectura."],
      ["Write down any exceptions or follow-up.", "Escriba cualquier excepción o seguimiento."],
    ],
  },
  {
    id: "office-review", icon: FileSearch,
    h: ["Office review", "Revisión de la oficina"],
    who: ["Office", "Oficina"],
    items: [
      ["Match each model and serial number to its photo.", "Compare cada número de modelo y de serie con su foto."],
      ["Link each draft value to the evidence it came from.", "Vincule cada valor del borrador con la evidencia de donde salió."],
      ["Mark missing or conflicting information NEEDED.", "Marque como NECESARIO lo que falte o no coincida."],
      ["Send NEEDED items back to the technician before marking the draft ready for office review.", "Devuelva al técnico lo NECESARIO antes de marcar el borrador listo para revisión de la oficina."],
    ],
  },
  {
    id: "before-filing", icon: Landmark,
    h: ["Before filing", "Antes de presentar"],
    who: ["Office", "Oficina"],
    items: [
      ["Confirm the permit authority for this address.", "Confirme la autoridad de permisos para esta dirección."],
      ["Confirm the applicable forms and supporting documents with that authority.", "Confirme con esa autoridad los formularios y documentos de respaldo que aplican."],
    ],
  },
];

function Checklist() {
  const { t } = useLang();
  const [done, setDone] = useState<Record<string, boolean>>({});
  useEffect(() => {
    try { setDone(JSON.parse(localStorage.getItem(STORE) || "{}")); } catch { /* ignore */ }
  }, []);
  const toggle = (id: string, v: boolean) => setDone((d) => {
    const n = { ...d, [id]: v };
    if (!v) delete n[id];
    try { localStorage.setItem(STORE, JSON.stringify(n)); } catch { /* ignore */ }
    return n;
  });
  return (
    <AppPage>
      <section className="lp-hero" aria-labelledby="ck-h1">
        <Image src="/generated-assets/company-logo.png" alt="" width={64} height={64} className="lp-mark" />
        <p className="lp-kicker">{t("Free checklist · no sign-in", "Lista gratis · sin iniciar sesión")}</p>
        <h1 id="ck-h1">{t("Heat Pump Change-Out Paperwork Checklist", "Lista de papeleo para cambio de bomba de calor")}</h1>
        <p className="ap-muted">{t("Use this checklist to capture the evidence your office needs to prepare a residential heat pump permit draft.", "Use esta lista para capturar la evidencia que su oficina necesita para preparar un borrador de permiso de bomba de calor residencial.")}</p>
        <Link to="/" hash="core-offer" className="ap-btn primary" data-testid="ck-trial-top">{t("Start your PermitDraft trial", "Comience su prueba de PermitDraft")}</Link>
        <p className="lp-sub">{t("14 days free, no card.", "14 días gratis, sin tarjeta.")} <Link to="/hvac-permits" className="lp-link">{t("How PermitDraft works", "Cómo funciona PermitDraft")}</Link></p>
      </section>

      {GROUPS.map((g, gi) => (
        <section key={g.id} className="lp-sec" aria-labelledby={`ck-${g.id}`} data-testid={`ck-${g.id}`}>
          <div className="ck-head">
            <span className="lp-icon"><g.icon size={22} aria-hidden /></span>
            <div>
              <p className="ck-step">{t(`Step ${gi + 1} of ${GROUPS.length}`, `Paso ${gi + 1} de ${GROUPS.length}`)} · {t(g.who[0], g.who[1])}</p>
              <h2 id={`ck-${g.id}`} className="lp-h2">{t(g.h[0], g.h[1])}</h2>
            </div>
          </div>
          <ul className="ck-list">
            {g.items.map((it, i) => {
              const id = `ck-${g.id}-${i + 1}`;
              return (
                <li key={id}>
                  <label htmlFor={id} className="ck-row">
                    <Checkbox id={id} checked={!!done[id]} onCheckedChange={(v) => toggle(id, v === true)} />
                    <span>{t(it[0], it[1])}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      <section className="lp-sec" aria-labelledby="ck-keep">
        <h2 id="ck-keep" className="lp-h2">{t("Keep these apart", "Mantenga esto separado")}</h2>
        <p className="rd-cov">{t("Keep the job’s documentation separate from jurisdiction-specific requirements, and keep office review separate from filing. A draft that is ready for office review is not yet ready to file.", "Mantenga la documentación del trabajo separada de los requisitos propios de cada jurisdicción, y la revisión de la oficina separada de la presentación. Un borrador listo para revisión de la oficina todavía no está listo para presentar.")} <Link to="/coverage" className="lp-link">{t("What PermitDraft covers", "Qué cubre PermitDraft")}</Link></p>
      </section>

      <section className="lp-close" aria-labelledby="ck-end">
        <h2 id="ck-end" className="lp-h2">{t("Capture this checklist on every job", "Capture esta lista en cada trabajo")}</h2>
        <p>{t("PermitDraft walks your tech through these photos and readings, links each draft value to its evidence and marks what is NEEDED.", "PermitDraft guía a su técnico por estas fotos y lecturas, vincula cada valor del borrador con su evidencia y marca lo NECESARIO.")}</p>
        <Link to="/" hash="core-offer" className="ap-btn primary" data-testid="ck-trial">{t("Start your PermitDraft trial", "Comience su prueba de PermitDraft")}</Link>
        <p className="lp-sub on-dark">{t("14 days free, no card.", "14 días gratis, sin tarjeta.")} <Link to="/demo" className="lp-link">{t("Try the free demo", "Probar la demo gratis")}</Link></p>
      </section>
    </AppPage>
  );
}
