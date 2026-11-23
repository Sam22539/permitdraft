import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { useLang } from "../lib/lang";
import { AREA_NOTE, AUTHORITIES, HANDOFF_CHECKED_ON, HANDOFF_STATES, IDAHO_REFERENCES, KIND_LABEL, LAS_VEGAS_REFERENCES } from "../lib/filing-handoff";

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
        "For the permitting authorities listed below. PermitDraft does not file permits, does not check local rules and sends nothing: you file through the authority's own channel.",
        "Para las autoridades de permisos de la lista de abajo. PermitDraft no presenta permisos, no verifica reglas locales y no envía nada: usted presenta por el canal propio de la autoridad.",
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
          <p className="ap-muted">{name}:</p>
          <ul className="rs-list" data-testid="fh-links">
            {(a.portals ?? []).map((l) => <li key={l.url}><a href={l.url} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer" className="underline font-semibold" data-testid="fh-link" data-primary="true">{t(...l.label)}</a></li>)}
            {(a.links ?? [{ label: [a.pageTitle, a.pageTitle] as [string, string], url: a.url }]).filter((l) => !a.portals?.some((p) => p.url === l.url)).map((l) => <li key={l.url}><a href={l.url} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer" className="underline font-semibold" data-testid="fh-link">{a.portals ? t("Official guidance: ", "Orientación oficial: ") : ""}{t(...l.label)}</a></li>)}
          </ul>
          {a.scope && (
            <ul className="rs-list" data-testid="fh-scope">
              {a.scope.map((x) => <li key={x[0]} className="ap-muted">{t(...x)}</li>)}
            </ul>
          )}
          <p className="ap-muted">{t(
            `Opens the official page in a new tab (opened ${HANDOFF_CHECKED_ON}). Nothing about the job or customer is sent, and opening it does not file anything. Follow that authority's instructions for how and where to file.`,
            `Abre la página oficial en una pestaña nueva (abierta el ${HANDOFF_CHECKED_ON}). No se envía nada del trabajo ni del cliente, y abrirla no presenta nada. Siga las instrucciones de esa autoridad sobre cómo y dónde presentar.`,
          )}</p>
        </div>
      )}
    </section>
  );
}

/** Idaho: reference-only links, kept apart from the selectable handoff above. */
export function IdahoReference() {
  const { t } = useLang();
  return (
    <section id="idaho-reference" className="ap-card" aria-labelledby="id-h" data-testid="idaho-reference">
      <h2 id="id-h" className="ap-h2">{t("Idaho (reference only)", "Idaho (solo referencia)")}</h2>
      <p className="ap-muted">{t(
        "Idaho is not part of the filing handoff above. These are plain links to official pages. The state and the city are separate offices: confirm which one has jurisdiction and scope for the job's exact address, and do not treat them as interchangeable.",
        "Idaho no forma parte de la entrega de arriba. Son enlaces simples a páginas oficiales. El estado y la ciudad son oficinas distintas: confirme cuál tiene jurisdicción y alcance para la dirección exacta del trabajo y no las trate como intercambiables.",
      )}</p>
      <ul className="rs-list">
        {IDAHO_REFERENCES.map((r) => (
          <li key={r.id} data-testid={`idaho-${r.id}`}>
            <strong>{t(...r.name)}</strong>
            <p className="ap-muted">{t(...r.note)}</p>
            <ul className="rs-list">
              {"portal" in r && r.portal && <li><a href={r.portal.url} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer" className="underline font-semibold" data-testid="idaho-link" data-primary="true">{t(...r.portal.label)}</a></li>}
              <li><a href={r.url} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer" className="underline font-semibold" data-testid="idaho-link">{"portal" in r ? t("Official guidance: ", "Orientación oficial: ") : ""}{r.pageTitle}</a></li>
            </ul>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Las Vegas: reference-only links. Not a filing handoff, not a local rule check, and the County is not a service area. */
export function LasVegasReference() {
  const { t } = useLang();
  return (
    <section id="las-vegas-reference" className="ap-card" aria-labelledby="lv-h" data-testid="las-vegas-reference">
      <h2 id="lv-h" className="ap-h2">{t("Las Vegas, Nevada (reference only)", "Las Vegas, Nevada (solo referencia)")}</h2>
      <p className="ap-muted">{t(
        "Plain links to official pages. The City of Las Vegas and Clark County are separate offices: confirm which one has jurisdiction for the job's exact address, never by its postal city, because some addresses with a Las Vegas mailing name are in unincorporated Clark County. PermitDraft prepares permit documentation for contractor review only. Local rule checks and direct filing are not offered in this rollout, and the Clark County link is not a service area expansion.",
        "Enlaces simples a páginas oficiales. La Ciudad de Las Vegas y el Condado de Clark son oficinas distintas: confirme cuál tiene jurisdicción para la dirección exacta del trabajo, nunca por su ciudad postal, porque algunas direcciones con nombre postal de Las Vegas están en el Condado de Clark no incorporado. PermitDraft prepara documentación de permisos solo para revisión del contratista. La verificación de reglas locales y la presentación directa no se ofrecen en este lanzamiento, y el enlace del Condado de Clark no amplía el área de servicio.",
      )}</p>
      <ul className="rs-list">
        {LAS_VEGAS_REFERENCES.map((r) => (
          <li key={r.id} data-testid={`lv-${r.id}`}>
            <strong>{t(...r.name)}</strong>
            <p className="ap-muted">{t(...r.note)}</p>
            <ul className="rs-list">
              <li><a href={r.url} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer" className="underline font-semibold" data-testid="lv-link">{r.pageTitle}</a> <span className="ap-muted">· {t("opened", "abierta")} {HANDOFF_CHECKED_ON}</span></li>
            </ul>
          </li>
        ))}
      </ul>
    </section>
  );
}
