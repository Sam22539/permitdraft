import { PageJumps } from "../components/page-jumps";
import { ResourceLink } from "../components/resource-link";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppPage } from "../components/app-shell";
import { PACK } from "../lib/rules/data";
import { useLang } from "../lib/lang";
import { AUTHORITIES, HANDOFF_STATES } from "../lib/filing-handoff";

export const Route = createFileRoute("/coverage")({
  head: () => ({ meta: [{ title: "Coverage — PermitDraft" }, { name: "description", content: "PermitDraft’s documentation workflow is open to residential HVAC contractors in California, Arizona, Texas and Las Vegas, Nevada. See what it checks today and what verified rule coverage it does not yet have." }] }),
  component: Coverage,
});

function Coverage() {
  const { t } = useLang();
  return (
    <AppPage>
      <h1 className="text-3xl">{t("What PermitDraft covers", "Qué cubre PermitDraft")}</h1>
      <PageJumps items={[
        { id: "cv-areas", label: ["Service areas", "Áreas de servicio"] },
        { id: "cv-docs", label: ["Documentation", "Documentación"] },
        { id: "cv-rules", label: ["Verified rules", "Reglas verificadas"] },
        { id: "cv-official", label: ["Official pages", "Páginas oficiales"] },
        { id: "cv-las-vegas", label: ["Las Vegas", "Las Vegas"] },
        { id: "cv-statuses", label: ["Statuses", "Estados"] },
      ]} />
      <section id="cv-areas" aria-labelledby="cv-areas-h" data-testid="coverage-areas">
        <h2 id="cv-areas-h" className="ap-h2">{t("Residential HVAC service areas", "Áreas de servicio de HVAC residencial")}</h2>
        <ul className="cv-areas">
          <li>California</li><li>Arizona</li><li>Texas</li><li>Las Vegas, Nevada</li>
        </ul>
        <p className="ap-muted">{t("Las Vegas only, not the rest of Nevada.", "Solo Las Vegas, no el resto de Nevada.")}</p>
      </section>
      <section id="cv-docs" className="ap-card" data-testid="coverage-national">
        <h2 className="ap-h2">{t("Documentation support: open in these areas", "Apoyo de documentación: abierto en estas áreas")}</h2>
        <p>{t("Every job runs a documentation checklist: job details, photos, notes and office review, so the office gets what it needs.", "Cada trabajo corre una lista de documentación: datos del trabajo, fotos, notas y revisión de oficina, para que la oficina reciba lo que necesita.")}</p>
        <ul className="rs-list" data-testid="coverage-jobs">
          {PACK.workflows.map((w) => <li key={w.id}><strong>{t(...w.name)}</strong> · {t("Documentation only", "Solo documentación")}</li>)}
        </ul>
      </section>
      <section id="cv-rules" className="ap-card" data-testid="coverage-matrix">
        <h2 className="ap-h2">{t("Verified local rules and filing: not yet", "Reglas locales verificadas y presentación: aún no")}</h2>
        <p>{t("Verified permit rules cover no state, county or city, including the areas above. Nothing here checks a law, code or local rule, there is no nationwide coverage, and PermitDraft files nothing.", "Las reglas de permisos verificadas no cubren ningún estado, condado ni ciudad, incluidas las áreas de arriba. Nada aquí verifica una ley, código o regla local, no hay cobertura nacional y PermitDraft no presenta nada.")}</p>
        <p className="ap-muted">{t("Verified legal rules: 0. The official pages below are handoff references only. For any other jurisdiction, the permit office, dates, fees and requirements are unverified: the office must confirm them.", "Reglas legales verificadas: 0. Las páginas oficiales de abajo son solo referencias de entrega. Para cualquier otra jurisdicción, la oficina de permisos, las fechas, las tarifas y los requisitos no están verificados: la oficina debe confirmarlos.")}</p>
      </section>
      <p className="rd-notice">{t("Draft only. Not a guarantee of compliance. Contractor review and signature required.", "Solo borrador. No garantiza el cumplimiento. Se requiere revisión y firma del contratista.")}</p>
      {HANDOFF_STATES.map((s) => (
        <section id={s.code === HANDOFF_STATES[0].code ? "cv-official" : undefined} className="ap-card" key={s.code} data-testid={`coverage-state-${s.code}`}>
          <h2 className="ap-h2">{t(...s.name)}</h2>
          <p className="ap-muted">{t("Official permit pages, for handoff only. Each opens in a new tab.", "Páginas oficiales de permisos, solo para la entrega. Cada una se abre en una pestaña nueva.")}</p>
          <ul className="rs-list">
            {AUTHORITIES.filter((x) => x.state === s.code && !x.handoffOnly).map((x) => (
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
      <section id="cv-las-vegas" className="ap-card" data-testid="coverage-las-vegas">
        <h2 className="ap-h2">{t("Las Vegas, Nevada", "Las Vegas, Nevada")}</h2>
        <p>{t("Service for residential HVAC contractors in Las Vegas, Nevada is effective November 23, 2026 (Pacific time).", "El servicio para contratistas residenciales de HVAC en Las Vegas, Nevada rige desde el 23 de noviembre de 2026 (hora del Pacífico).")}</p>
        <p className="ap-muted">{t("Permit documentation for contractor review is offered; local rule checks and direct filing are not. Official City of Las Vegas and Clark County pages are listed as reference only on Resources; the County reference is not a service area expansion.", "Se ofrece documentación de permisos para revisión del contratista; la verificación de reglas locales y la presentación directa no. Las páginas oficiales de la Ciudad de Las Vegas y del Condado de Clark se listan solo como referencia en Recursos; la referencia del Condado no amplía el área de servicio.")} <Link to="/resources" hash="las-vegas-reference" className="underline font-semibold">{t("Las Vegas references", "Referencias de Las Vegas")}</Link></p>
      </section>
      <section id="cv-statuses" className="ap-card">
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
