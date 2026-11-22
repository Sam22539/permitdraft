import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { useLang } from "../lib/lang";
import { AREA_NOTE, AUTHORITIES, HANDOFF_CHECKED_ON, HANDOFF_STATES, KIND_LABEL } from "../lib/filing-handoff";

/** Official filing handoff: the contractor picks and confirms the authority; the link only opens its official page. Nothing is sent or filed. */
export function FilingHandoff() {
  const { t } = useLang();
  const [pick, setPick] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const a = AUTHORITIES.find((x) => x.id === pick);
  const name = a ? t(...a.name) : "";
  return (
    <section id="filing-handoff" className="ap-card fh" aria-labelledby="fh-h" data-testid="filing-handoff">
      <h2 id="fh-h" className="ap-h2">{t("Official HVAC filing handoff", "Entrega para presentar el permiso de HVAC")}</h2>
      <p className="ap-muted">{t(
        "For the initial shortlist of nine permitting authorities below. PermitDraft does not file permits, does not check local rules and sends nothing: you file through the authority's own channel.",
        "Para la lista inicial de nueve autoridades de permisos de abajo. PermitDraft no presenta permisos, no verifica reglas locales y no envía nada: usted presenta por el canal propio de la autoridad.",
      )}</p>

      <h3 className="fh-step">{t("1. Check the exact address and its authority", "1. Verifique la dirección exacta y su autoridad")}</h3>
      <p className="ap-muted">{t(
        "Confirm which office issues permits for the job's exact street address. Do not go by the city or county in the mailing address: postal names do not follow city limits or county service areas. If the authority is not on this list, use its own official site.",
        "Confirme qué oficina emite permisos para la dirección exacta del trabajo. No se guíe por la ciudad o el condado de la dirección postal: los nombres postales no siguen los límites de las ciudades ni las áreas de servicio de los condados. Si la autoridad no está en esta lista, use su propio sitio oficial.",
      )}</p>
      <RadioGroup value={pick} onValueChange={(v) => { setPick(v); setConfirmed(false); }} aria-labelledby="fh-h" className="fh-groups" data-testid="fh-options">
        {HANDOFF_STATES.map((s) => (
          <div key={s.code} className="fh-group" role="group" aria-label={t(...s.name)}>
            <span className="font-semibold">{t(...s.name)}</span>
            {AUTHORITIES.filter((x) => x.state === s.code).map((x) => (
              <Label key={x.id} htmlFor={`fh-${x.id}`} className="fh-option">
                <RadioGroupItem id={`fh-${x.id}`} value={x.id} data-testid={`fh-opt-${x.id}`} />
                <span>{t(...x.name)} <span className="ap-muted">· {x.area === "county" ? t("county service area", "área de servicio del condado") : t("city limits", "límites de la ciudad")}</span></span>
              </Label>
            ))}
          </div>
        ))}
      </RadioGroup>

      {a && (
        <>
          <p className="rd-cov" data-testid="fh-area">{t(...AREA_NOTE[a.area])}</p>
          <Label htmlFor="fh-confirm" className="fh-option">
            <Checkbox id="fh-confirm" checked={confirmed} onCheckedChange={(v) => setConfirmed(v === true)} data-testid="fh-confirm" />
            <span>{t(`I checked the job's exact address and confirmed that ${name} is its permitting authority.`, `Verifiqué la dirección exacta del trabajo y confirmé que ${name} es su autoridad de permisos.`)}</span>
          </Label>
        </>
      )}

      <h3 className="fh-step">{t("2. Review your draft", "2. Revise su borrador")}</h3>
      <p className="ap-muted">{t("Open the job's review draft, capture anything marked NEEDED, and have the contractor review and sign. The draft is not a permit form for any authority.", "Abra el borrador de revisión del trabajo, capture lo marcado como NECESARIO y haga que el contratista lo revise y firme. El borrador no es un formulario de permiso de ninguna autoridad.")} <Link to="/jobs" className="underline font-semibold">{t("Go to Jobs", "Ir a Trabajos")}</Link></p>

      <h3 className="fh-step">{t("3. Use the official filing channel", "3. Use el canal oficial para presentar")}</h3>
      {!a ? (
        <p className="ap-muted" data-testid="fh-wait">{t("Choose the permitting authority in step 1 to see its official page.", "Elija la autoridad de permisos en el paso 1 para ver su página oficial.")}</p>
      ) : !confirmed ? (
        <p className="ap-muted" data-testid="fh-wait">{t(`Confirm in step 1 that ${name} is the authority for this address to see its official page.`, `Confirme en el paso 1 que ${name} es la autoridad para esta dirección para ver su página oficial.`)}</p>
      ) : (
        <div className="fh-out" data-testid="fh-out">
          <span className="rs-badge" data-testid="fh-kind">{t(...KIND_LABEL[a.kind])}</span>
          <p className="ap-muted">{t(`${name}:`, `${name}:`)} <a href={a.url} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer" className="underline font-semibold" data-testid="fh-link">{a.pageTitle}</a></p>
          <p className="ap-muted">{t(
            `Opens the official page in a new tab (opened ${HANDOFF_CHECKED_ON}). Nothing about the job or customer is sent, and opening it does not file anything. Follow that authority's instructions for how and where to file.`,
            `Abre la página oficial en una pestaña nueva (abierta el ${HANDOFF_CHECKED_ON}). No se envía nada del trabajo ni del cliente, y abrirla no presenta nada. Siga las instrucciones de esa autoridad sobre cómo y dónde presentar.`,
          )}</p>
        </div>
      )}
    </section>
  );
}
