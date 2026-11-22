import { ResourceLink } from "../components/resource-link";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppPage } from "../components/app-shell";
import { PACK } from "../lib/rules/data";
import { useLang } from "../lib/lang";
import { AUTHORITIES, HANDOFF_STATES } from "../lib/filing-handoff";

export const Route = createFileRoute("/coverage")({
  head: () => ({ meta: [{ title: "Coverage — PermitDraft" }, { name: "description", content: "PermitDraft’s documentation workflow is open to residential HVAC contractors in California, Arizona and Texas. See what it checks today and what verified rule coverage it does not yet have." }] }),
  component: Coverage,
});

function Coverage() {
  const { t } = useLang();
  const started = Date.now() >= Date.UTC(2026, 10, 23, 8); // Nov 23, 2026 00:00 Pacific (UTC-8)
  return (
    <AppPage>
      <h1 className="text-3xl">{t("What PermitDraft covers", "Qué cubre PermitDraft")}</h1>
      <p className="ap-muted">{t("Today PermitDraft runs a documentation checklist for every job: it makes sure the details and photos an office needs are captured. It does not yet check any law, code or local rule, anywhere.", "Hoy PermitDraft corre una lista de documentación en cada trabajo: verifica que se capturen los datos y fotos que una oficina necesita. Todavía no verifica ninguna ley, código ni regla local, en ningún lugar.")}</p>
      <p className="rd-notice">{t("Draft only. Not a guarantee of compliance. Contractor review and signature required.", "Solo borrador. No garantiza el cumplimiento. Se requiere revisión y firma del contratista.")}</p>
      <section className="ap-card" data-testid="coverage-national">
        <h2 className="ap-h2">{t("California, Arizona and Texas: workflow open, verified rules not yet", "California, Arizona y Texas: flujo abierto, reglas verificadas aún no")}</h2>
        <p>{t("The documentation workflow (job details, photos, notes, office review) is open to residential HVAC contractors in California, Arizona and Texas only. Verified permit rules currently cover no state, county or city, including those three states. The official pages below are handoff references only. For any other jurisdiction, the permit office, dates, fees and requirements are unverified: the office must confirm them.", "El flujo de documentación (datos del trabajo, fotos, notas, revisión de oficina) está abierto solo a contratistas residenciales de HVAC en California, Arizona y Texas. Las reglas de permisos verificadas hoy no cubren ningún estado, condado ni ciudad, incluidos esos tres estados. Las páginas oficiales de abajo son solo referencias de entrega. Para cualquier otra jurisdicción, la oficina de permisos, las fechas, las tarifas y los requisitos no están verificados: la oficina debe confirmarlos.")}</p>
      </section>
      <section className="ap-card" data-testid="coverage-matrix">
        <h2 className="ap-h2">{t("Coverage by kind of job", "Cobertura por tipo de trabajo")}</h2>
        <p className="ap-muted">{t("Supported jobs. Each one is documentation only today, in every area below.", "Trabajos admitidos. Cada uno es solo documentación hoy, en todas las áreas de abajo.")}</p>
        <ul className="rs-list" data-testid="coverage-jobs">
          {PACK.workflows.map((w) => <li key={w.id}><strong>{t(...w.name)}</strong> · {t("Documentation only", "Solo documentación")}</li>)}
        </ul>
        <p className="ap-muted">{t("Verified legal rules: 0. Nothing here checks a law, code or local rule, and there is no nationwide coverage.", "Reglas legales verificadas: 0. Nada aquí verifica una ley, código o regla local, y no hay cobertura nacional.")}</p>
      </section>
      {HANDOFF_STATES.map((s) => (
        <section className="ap-card" key={s.code} data-testid={`coverage-state-${s.code}`}>
          <h2 className="ap-h2">{t(...s.name)}</h2>
          <p className="ap-muted">{t("Official permit pages, opened in a new tab. They are a handoff only: PermitDraft files nothing and checks no local rule.", "Páginas oficiales de permisos, en una pestaña nueva. Son solo una entrega: PermitDraft no presenta nada ni verifica reglas locales.")}</p>
          <ul className="rs-list">
            {AUTHORITIES.filter((x) => x.state === s.code).map((x) => (
              <li key={x.id}>
                <strong>{t(...x.name)}</strong> <span className="ap-muted">· {x.area === "county" ? t("county service area", "área de servicio del condado") : t("city limits", "límites de la ciudad")}</span>
                <ul className="rs-list">
                  {(x.links ?? [{ label: [x.pageTitle, x.pageTitle] as [string, string], url: x.url }]).map((l) => (
                    <li key={l.url}><a href={l.url} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer" className="underline font-semibold" data-testid="coverage-link">{t(...l.label)}</a></li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
          <p className="ap-muted"><Link to="/resources" search={{ state: s.code } as never} className="underline font-semibold">{t(`All ${s.name[0]} resources`, `Todos los recursos de ${s.name[1]}`)}</Link></p>
        </section>
      ))}
      <section className="ap-card" data-testid="coverage-las-vegas">
        <h2 className="ap-h2">{t("Las Vegas, Nevada", "Las Vegas, Nevada")}</h2>
        <p>{started
          ? t("Documentation support for Las Vegas only began on November 23, 2026 (Pacific time).", "El apoyo de documentación solo para Las Vegas comenzó el 23 de noviembre de 2026 (hora del Pacífico).")
          : t("Documentation support for Las Vegas only starts on November 23, 2026 (Pacific time). Until that date it is not available.", "El apoyo de documentación solo para Las Vegas comienza el 23 de noviembre de 2026 (hora del Pacífico). Hasta esa fecha no está disponible.")}</p>
        <p className="ap-muted">{t("Las Vegas only, not the rest of Nevada. PermitDraft has no verified local rules and no official permit handoff for Las Vegas yet.", "Solo Las Vegas, no el resto de Nevada. PermitDraft aún no tiene reglas locales verificadas ni una entrega oficial de permisos para Las Vegas.")}</p>
      </section>
      <section className="ap-card">
        <h2 className="ap-h2">{t("Two different statuses", "Dos estados distintos")}</h2>
        <p><strong>{t("Ready for office review", "Listo para revisión de oficina")}</strong>: {t("every detail and photo on the checklist is captured.", "cada dato y foto de la lista está capturado.")}</p>
        <p><strong>{t("Ready for filing", "Listo para presentar")}</strong>: {t("needs a confirmed jurisdiction, verified rules for that job and no unresolved evidence. It stays “Not ready” until all three are true, and PermitDraft does not file anything.", "requiere jurisdicción confirmada, reglas verificadas para ese trabajo y ninguna evidencia pendiente. Sigue “No listo” hasta cumplir las tres, y PermitDraft no presenta nada.")}</p>
        <p className="ap-muted">{t(`Rule data: ${PACK.packId}, version ${PACK.version}.`, `Datos de reglas: ${PACK.packId}, versión ${PACK.version}.`)}</p>
      </section>
      <ResourceLink stage="permit" className="ap-muted" />
      <Link to="/jobs" className="ap-btn primary">{t("Back to Jobs", "Volver a Trabajos")}</Link>
    </AppPage>
  );
}
