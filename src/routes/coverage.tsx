import { createFileRoute, Link } from "@tanstack/react-router";
import { AppPage } from "../components/app-shell";
import { PACK } from "../lib/rules/data";
import { useLang } from "../lib/lang";

export const Route = createFileRoute("/coverage")({
  head: () => ({ meta: [{ title: "Coverage — PermitDraft" }, { name: "description", content: "What PermitDraft checks today for each kind of job, and what it does not yet cover." }] }),
  component: Coverage,
});

function Coverage() {
  const { t } = useLang();
  const juris = PACK.jurisdictions.filter((j) => j.layer === "county" || j.layer === "city");
  const cols: [string, string][] = [["Unknown / not confirmed", "Desconocida / sin confirmar"], ...juris.map((j) => [j.name[0], j.name[1]] as [string, string])];
  return (
    <AppPage>
      <h1 className="text-3xl">{t("What PermitDraft covers", "Qué cubre PermitDraft")}</h1>
      <p className="ap-muted">{t("Today PermitDraft runs a documentation checklist for every job: it makes sure the details and photos an office needs are captured. It does not yet check any law, code or local rule, anywhere.", "Hoy PermitDraft corre una lista de documentación en cada trabajo: verifica que se capturen los datos y fotos que una oficina necesita. Todavía no verifica ninguna ley, código ni regla local, en ningún lugar.")}</p>
      <p className="rd-notice">{t("Draft only. Not a guarantee of compliance. Contractor review and signature required.", "Solo borrador. No garantiza el cumplimiento. Se requiere revisión y firma del contratista.")}</p>
      <section className="ap-card" data-testid="coverage-matrix">
        <h2 className="ap-h2">{t("Coverage by kind of job", "Cobertura por tipo de trabajo")}</h2>
        <div className="rd-scroll">
          <table className="rd-table">
            <thead><tr><th scope="col">{t("Job", "Trabajo")}</th>{cols.map((c) => <th scope="col" key={c[0]}>{t(...c)}</th>)}</tr></thead>
            <tbody>
              {PACK.workflows.map((w) => (
                <tr key={w.id}><th scope="row">{t(...w.name)}</th>{cols.map((c) => <td key={c[0]}>{t("Documentation only", "Solo documentación")}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="ap-muted">{t("Verified legal rules: 0. A jurisdiction the office confirms unlocks its official permit office link as a reference, never a check.", "Reglas legales verificadas: 0. Una jurisdicción confirmada por la oficina habilita el enlace a su oficina oficial de permisos como referencia, nunca como verificación.")}</p>
      </section>
      <section className="ap-card">
        <h2 className="ap-h2">{t("Two different statuses", "Dos estados distintos")}</h2>
        <p><strong>{t("Ready for office review", "Listo para revisión de oficina")}</strong>: {t("every detail and photo on the checklist is captured.", "cada dato y foto de la lista está capturado.")}</p>
        <p><strong>{t("Ready for filing", "Listo para presentar")}</strong>: {t("needs a confirmed jurisdiction, verified rules for that job and no unresolved evidence. It stays “Not ready” until all three are true, and PermitDraft does not file anything.", "requiere jurisdicción confirmada, reglas verificadas para ese trabajo y ninguna evidencia pendiente. Sigue “No listo” hasta cumplir las tres, y PermitDraft no presenta nada.")}</p>
        <p className="ap-muted">{t(`Rule data: ${PACK.packId}, version ${PACK.version}.`, `Datos de reglas: ${PACK.packId}, versión ${PACK.version}.`)}</p>
      </section>
      <Link to="/jobs" className="ap-btn primary">{t("Back to Jobs", "Volver a Trabajos")}</Link>
    </AppPage>
  );
}
