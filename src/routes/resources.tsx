import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppPage } from "../components/app-shell";
import { useLang } from "../lib/lang";
import { FilingHandoff, IdahoReference, LasVegasReference } from "../components/filing-handoff";
import {
  CATEGORIES, DATASET_VERSION, FEDERAL, GENERATED_ON, STAGES, STATES, STATE_LINKS, completeness, isOutbound, isStateCode, type Category, type ResourceLink, type Stage,
} from "../lib/resources/data";

type Search = { state?: string; stage?: Stage; cat?: Category };
export const Route = createFileRoute("/resources")({
  head: () => ({ meta: [{ title: "Official resources — PermitDraft" }, { name: "description", content: "Public official links for residential HVAC contractors in California, Arizona, Texas and Las Vegas, Nevada, plus federal references. Only pages PermitDraft actually opened are marked verified." }] }),
  validateSearch: (s: Record<string, unknown>): Search => ({
    state: isStateCode(s.state) ? s.state : undefined,
    stage: STAGES.some((x) => x.id === s.stage) ? (s.stage as Stage) : undefined,
    cat: CATEGORIES.some((x) => x.id === s.cat) ? (s.cat as Category) : undefined,
  }),
  component: Resources,
});

function Item({ l }: { l: ResourceLink }) {
  const { t } = useLang();
  const out = isOutbound(l);
  const status = out ? t("Verified", "Verificado") : l.status === "not_applicable" ? t("Not applicable", "No aplica") : l.status === "not_found" ? t("Not found", "No encontrado") : t("Pending: not yet verified", "Pendiente: aún sin verificar");
  return (
    <li className="rs-item" data-testid="resource-item" data-status={out ? "verified" : "pending"}>
      <strong>{out ? <a href={l.url!} target="_blank" rel="noopener noreferrer" className="underline">{t(l.label_en, l.label_es)}</a> : t(l.label_en, l.label_es)}</strong>
      <span className={`rs-badge${out ? " ok" : ""}`}>{status}{l.tag_en ? ` · ${t(l.tag_en, l.tag_es ?? l.tag_en)}` : ""}{l.volatile ? ` · ${t("changes often", "cambia seguido")}` : ""}</span>
      {out && <span className="ap-muted">{l.page_title} · {l.agency} · {t("checked", "revisado")} {l.checked_on}</span>}
      {out && l.note_en && <span className="ap-muted">{t(l.note_en, l.note_es ?? l.note_en)}</span>}
      {!out && l.note_en && <span className="ap-muted">{t(l.note_en, l.note_es ?? l.note_en)}</span>}
      {!out && !l.note_en && l.status !== "unverified" && <span className="ap-muted">{l.notes}</span>}
      {!out && !l.note_en && l.status === "unverified" && l.notes && !l.notes.startsWith("Pending") && <span className="ap-muted">{l.notes}</span>}
    </li>
  );
}

function Resources() {
  const { t } = useLang();
  const nav = useNavigate({ from: "/resources" });
  const { state, stage, cat } = Route.useSearch();
  const set = (p: Partial<Search>) => nav({ search: (prev: Search) => ({ ...prev, ...p }), replace: true });
  const keep = (l: ResourceLink) => (!stage || l.show_in_app_stage === stage) && (!cat || l.category === cat);
  const fed = FEDERAL.filter(keep);
  const stateLinks = state ? STATE_LINKS[state].filter(keep) : [];
  const stateName = state ? STATES.find(([c]) => c === state)![1] : "";
  const c = completeness();
  return (
    <AppPage>
      <h1 className="text-3xl">{t("Official resources", "Recursos oficiales")}</h1>
      <p className="ap-muted">{t("Public links to official agencies for residential HVAC work in California, Arizona, Texas and Las Vegas, Nevada (not the rest of Nevada), plus federal references. They are for reference only: they do not check any law, do not change a job's readiness and are not part of permit eligibility.", "Enlaces públicos a agencias oficiales para trabajo residencial de HVAC en California, Arizona, Texas y Las Vegas, Nevada (no el resto de Nevada), más referencias federales. Son solo de referencia: no verifican ninguna ley, no cambian la preparación de un trabajo y no forman parte de la elegibilidad del permiso.")}</p>
      <p className="rd-notice">{t("Draft only. Not a guarantee of compliance. Contractor review and signature required.", "Solo borrador. No garantiza el cumplimiento. Se requiere revisión y firma del contratista.")}</p>

      <section className="ap-card" aria-labelledby="rs-checklist" data-testid="resources-checklist">
        <h2 id="rs-checklist" className="ap-h2">{t("Heat pump change-out paperwork checklist", "Lista de papeleo para cambio de bomba de calor")}</h2>
        <p className="ap-muted">{t("The photos, readings and office checks a residential heat pump permit draft needs. Free, no sign-in.", "Las fotos, lecturas y revisiones de oficina que necesita un borrador de permiso de bomba de calor residencial. Gratis, sin iniciar sesión.")}</p>
        <Link to="/heat-pump-paperwork-checklist" className="ap-btn ghost" data-testid="rs-open-checklist">{t("Open the checklist", "Abrir la lista")}</Link>
      </section>

      <FilingHandoff />
      <LasVegasReference />
      <IdahoReference />

      <section className="ap-card rs-filters" aria-label={t("Filters", "Filtros")}>
        <label htmlFor="rs-state" className="font-semibold">{t("State", "Estado")}</label>
        <select id="rs-state" className="rs-select" value={state ?? ""} onChange={(e) => set({ state: e.target.value || undefined })}>
          <option value="">{t("Federal only (no state chosen)", "Solo federal (sin estado)")}</option>
          {STATES.map(([code, name]) => <option key={code} value={code}>{name} ({code})</option>)}
        </select>
        <span className="font-semibold">{t("Job stage", "Etapa del trabajo")}</span>
        <div className="rs-chips" role="group" aria-label={t("Job stage", "Etapa del trabajo")}>
          <button type="button" className="rs-chip" aria-pressed={!stage} onClick={() => set({ stage: undefined })}>{t("All", "Todas")}</button>
          {STAGES.map((s) => <button key={s.id} type="button" className="rs-chip" aria-pressed={stage === s.id} onClick={() => set({ stage: s.id })}>{t(s.en, s.es)}</button>)}
        </div>
        <span className="font-semibold">{t("Category", "Categoría")}</span>
        <div className="rs-chips" role="group" aria-label={t("Category", "Categoría")}>
          <button type="button" className="rs-chip" aria-pressed={!cat} onClick={() => set({ cat: undefined })}>{t("All", "Todas")}</button>
          {CATEGORIES.map((s) => <button key={s.id} type="button" className="rs-chip" aria-pressed={cat === s.id} onClick={() => set({ cat: s.id })}>{t(s.en, s.es)}</button>)}
        </div>
      </section>

      <section className="ap-card" data-testid="resources-federal">
        <h2 className="ap-h2">{t("Federal", "Federal")}</h2>
        {fed.length ? <ul className="rs-list">{fed.map((l) => <Item key={l.key} l={l} />)}</ul> : <p className="ap-muted">{t("No federal entries match these filters.", "Ninguna entrada federal coincide con estos filtros.")}</p>}
      </section>

      <section className="ap-card" data-testid="resources-state">
        <h2 className="ap-h2">{state ? stateName : t("State", "Estado")}</h2>
        {!state ? <p className="ap-muted">{t("Choose a state above to see its entries. PermitDraft never picks a state for you from an address.", "Elija un estado arriba para ver sus entradas. PermitDraft nunca elige un estado por usted a partir de una dirección.")}</p>
          : <>
            <p className="ap-muted" data-testid="state-counts">{t(`${stateName}: ${STATE_LINKS[state].filter(isOutbound).length} verified of ${STATE_LINKS[state].length} link types; the rest are pending research.`, `${stateName}: ${STATE_LINKS[state].filter(isOutbound).length} verificados de ${STATE_LINKS[state].length} tipos de enlace; el resto está pendiente de investigación.`)}</p>
            {stateLinks.length ? <ul className="rs-list">{stateLinks.map((l) => <Item key={l.key} l={l} />)}</ul> : <p className="ap-muted">{t("No entries match these filters.", "Ninguna entrada coincide con estos filtros.")}</p>}
          </>}
      </section>

      <section className="ap-card" data-testid="resources-counts">
        <h2 className="ap-h2">{t("How complete is this directory?", "¿Qué tan completo está este directorio?")}</h2>
        <dl className="rs-count">
          <dt>{t("States you can select (CA, AZ, TX)", "Estados seleccionables (CA, AZ, TX)")}</dt><dd>{c.selectorStates}</dd>
          <dt>{t("States with at least one verified link", "Estados con al menos un enlace verificado")}</dt><dd>{c.statesWithVerified}</dd>
          <dt>{t("State link types tracked", "Tipos de enlace estatal rastreados")}</dt><dd>{c.stateLinksTotal}</dd>
          <dt>{t("State links verified", "Enlaces estatales verificados")}</dt><dd>{c.stateVerified}</dd>
          <dt>{t("State links not applicable / not found", "Enlaces estatales no aplica / no encontrados")}</dt><dd>{c.stateNotApplicable} / {c.stateNotFound}</dd>
          <dt>{t("State links pending", "Enlaces estatales pendientes")}</dt><dd>{c.statePending}</dd>
          <dt>{t("Federal links verified of total", "Enlaces federales verificados del total")}</dt><dd>{c.federal.verified} / {c.federal.total}</dd>
          <dt>{t("Federal links pending", "Enlaces federales pendientes")}</dt><dd>{c.federal.pending}</dd>
        </dl>
        <p className="ap-muted">{t(`Directory version ${DATASET_VERSION}, ${GENERATED_ON}. A link is marked verified only after its page was opened and its title and date recorded. Missing coverage never affects a job's readiness.`, `Directorio versión ${DATASET_VERSION}, ${GENERATED_ON}. Un enlace se marca verificado solo después de abrir su página y registrar su título y fecha. La falta de cobertura nunca afecta la preparación de un trabajo.`)}</p>
      </section>
      <Link to="/jobs" className="ap-btn primary">{t("Back to Jobs", "Volver a Trabajos")}</Link>
    </AppPage>
  );
}
