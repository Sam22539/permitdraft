import { Link } from "@tanstack/react-router";
import { PACK } from "../lib/rules/data";
import type { CheckResult, Evaluation, FilingReason } from "../lib/rules/engine";
import { setOfficeJurisdiction } from "../lib/rules/use-evaluation";
import { useLang } from "../lib/lang";
import { selectCls } from "./step-shell";

export const REASON: Record<FilingReason, [string, string]> = {
  jurisdiction_unconfirmed: ["Jurisdiction is not confirmed by the office.", "La oficina no ha confirmado la jurisdicción."],
  no_verified_coverage: ["No verified rules cover this workflow here yet. Only PermitDraft's documentation checklist runs.", "Aún no hay reglas verificadas para este trabajo aquí. Solo corre la lista de documentación de PermitDraft."],
  evidence_unresolved: ["Required evidence is still missing.", "Todavía falta evidencia obligatoria."],
  workflow_unknown: ["The equipment type is not captured.", "No se capturó el tipo de equipo."],
};
const LAYER: Record<string, [string, string]> = { app: ["PermitDraft checklist", "Lista de PermitDraft"] };
const BASIS: Record<string, [string, string]> = { evaluation_date: ["the day the check runs", "el día en que corre la verificación"], install_date: ["install date", "fecha de instalación"], manufacture_date: ["manufacture date", "fecha de fabricación"] };

export function WhyDetails({ r }: { r: CheckResult }) {
  const { t } = useLang();
  return (
    <details className="rd-why" data-testid={`why-${r.ruleId}`}>
      <summary>{t("Why?", "¿Por qué?")}</summary>
      <dl>
        <dt>{t("Why it is asked", "Por qué se pide")}</dt><dd>{t(...r.why)}</dd>
        <dt>{t("Where it comes from", "De dónde viene")}</dt><dd>{r.sources.map((s) => s.title).join("; ")} · {t(...(LAYER[r.layer] ?? [r.layer, r.layer]))}{r.scope === "documentation" ? t(" · not a legal rule", " · no es una regla legal") : ""}</dd>
        <dt>{t("Rule", "Regla")}</dt><dd>{r.ruleId} v{r.ruleVersion} · {t("status", "estado")}: {r.ruleStatus} · {t("effective", "vigente desde")} {r.effectiveFrom} · {t("checked", "revisada")} {r.verifiedOn}</dd>
        <dt>{t("Date basis", "Base de fecha")}</dt><dd>{t(...BASIS[r.dateBasis])}</dd>
        <dt>{t("Evidence looked at", "Evidencia revisada")}</dt><dd>{r.evidence} · {r.status === "met" ? t("found", "encontrada") : t("not found", "no encontrada")}</dd>
      </dl>
    </details>
  );
}

/** One collapsed area for the rationale, sources and rule data of every completed row. */
export function ChecklistDetails({ results }: { results: CheckResult[] }) {
  const { t } = useLang();
  const done = results.filter((r) => r.status === "met");
  if (done.length === 0) return null;
  return (
    <details className="rd-why" data-testid="checklist-details">
      <summary>{t("Checklist details: why each item is asked, sources and rule data", "Detalles de la lista: por qué se pide cada dato, fuentes y datos de reglas")}</summary>
      {done.map((r) => (
        <dl key={r.ruleId} data-testid={`why-${r.ruleId}`}>
          <dt>{t(...r.text)}</dt><dd>{t(...r.why)}</dd>
          <dt>{t("Where it comes from", "De dónde viene")}</dt><dd>{r.sources.map((s) => s.title).join("; ")} · {t(...(LAYER[r.layer] ?? [r.layer, r.layer]))}{r.scope === "documentation" ? t(" · not a legal rule", " · no es una regla legal") : ""}</dd>
          <dt>{t("Rule", "Regla")}</dt><dd>{r.ruleId} v{r.ruleVersion} · {t("status", "estado")}: {r.ruleStatus} · {t("effective", "vigente desde")} {r.effectiveFrom} · {t("checked", "revisada")} {r.verifiedOn} · {t(...BASIS[r.dateBasis])}</dd>
        </dl>
      ))}
    </details>
  );
}

/** Two separate statuses, the one next action, and why filing is not ready. */
export function ReadinessCard({ ev, capId, jur }: { ev: Evaluation; capId: string; jur: string }) {
  const { t } = useLang();
  const n = ev.missing.length;
  return (
    <section className="rd-card" data-testid="readiness" aria-labelledby="rd-h">
      <h2 id="rd-h" className="ap-h2">{t("Status", "Estado")}</h2>
      <div className="rd-two">
        <div className={`rd-state ${ev.officeReview.ready ? "ok" : "no"}`} data-testid="office-status">
          <span>{t("Ready for office review", "Listo para revisión de oficina")}</span>
          <strong>{ev.officeReview.ready ? t("Yes", "Sí") : t("Not yet", "Todavía no")}</strong>
        </div>
        <div className="rd-state no" data-testid="filing-status">
          <span>{t("Ready for filing", "Listo para presentar")}</span>
          <strong>{t("Not ready", "No está listo")}</strong>
        </div>
      </div>
      <div className="rd-next" data-testid="next-action">
        <span className="rd-label">{t("Next step", "Siguiente paso")}</span>
        <strong>
          {ev.next.kind === "capture" && ev.next.item ? `${t(...ev.next.item.text)}: ${t(...ev.next.item.todo)}` : ev.next.kind === "jurisdiction" ? t("Office: confirm the jurisdiction below.", "Oficina: confirme la jurisdicción abajo.") : t("Review this draft with the office. Nothing is filed from PermitDraft.", "Revise este borrador con la oficina. PermitDraft no presenta nada.")}
        </strong>
        {n > 1 && <span className="ap-muted">{t(`${n - 1} more item(s) after this one.`, `${n - 1} dato(s) más después de este.`)}</span>}
      </div>
      <details className="rd-why" data-testid="filing-why">
        <summary>{t("Why is filing not ready?", "¿Por qué no está listo para presentar?")}</summary>
        <ul>{ev.filing.reasons.map((r) => <li key={r}>{t(...REASON[r])}</li>)}</ul>
        <p className="ap-muted">{t("PermitDraft does not file anything in this version.", "PermitDraft no presenta nada en esta versión.")}</p>
      </details>
      <div className="ap-field">
        <label htmlFor="office-jur" className="font-semibold">{t("Jurisdiction (office confirms)", "Jurisdicción (la oficina confirma)")}</label>
        <select id="office-jur" className={selectCls} value={jur} onChange={(e) => setOfficeJurisdiction(capId, e.target.value)} data-testid="office-jur">
          <option value="">{t("Unknown: not confirmed", "Desconocida: sin confirmar")}</option>
          {PACK.jurisdictions.filter((j) => j.layer === "county" || j.layer === "city").map((j) => <option key={j.code} value={j.code}>{t(...j.name)}</option>)}
        </select>
        <p className="ap-muted">{ev.jurisdiction.known ? t("Confirmed by the office. This does not add verified rules.", "Confirmada por la oficina. Esto no agrega reglas verificadas.") : t("Never guessed from a ZIP code or city name.", "Nunca se adivina por código postal o nombre de ciudad.")}</p>
      </div>
      {ev.references.length > 0 && (
        <div data-testid="references">
          <h3 className="font-semibold">{t("Where to look (references, not checks)", "Dónde consultar (referencias, no verificaciones)")}</h3>
          <ul>{ev.references.map((x) => (
            <li key={x.title[0]}><a href={x.url} target="_blank" rel="noopener noreferrer" className="underline font-semibold">{t(...x.title)}</a>{x.note && <span className="ap-muted"> {t(...x.note)}</span>}</li>
          ))}</ul>
        </div>
      )}
    </section>
  );
}

export function CoverageLine({ ev }: { ev: Evaluation }) {
  const { t } = useLang();
  return (
    <p className="rd-cov" data-testid="coverage">
      <strong>{t("Coverage: documentation only", "Cobertura: solo documentación")}</strong>
      {" · "}{ev.workflow ? t(...ev.workflow.name) : t("Equipment not captured", "Equipo no capturado")}
      {" · "}{t(`${ev.coverage.verifiedLegalRules} verified legal rules`, `${ev.coverage.verifiedLegalRules} reglas legales verificadas`)}
      {" · "}<Link to="/coverage" className="underline font-semibold">{t("What this means", "Qué significa")}</Link>
    </p>
  );
}
