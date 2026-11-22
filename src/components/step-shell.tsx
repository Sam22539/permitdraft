import { Link } from "@tanstack/react-router";
import { AppPage } from "./app-shell";
import { useLang } from "../lib/lang";
import { useCorePath } from "./demo";

const STEP_NAMES: [string, string][] = [["Site", "Sitio"], ["Equipment", "Equipo"], ["Work", "Trabajo"], ["Checks", "Revisión"], ["Photos", "Fotos"]];

export function StepHead({ n, title }: { n: number; title: [string, string] }) {
  const { t } = useLang();
  return (
    <header className="cx-head">
      <h1>{t(...title)}</h1>
      <div>
        <p className="cx-stepline">
          <strong>{t(`Step ${n} of 5`, `Paso ${n} de 5`)}</strong>
          <span>{t(...STEP_NAMES[n - 1])}</span>
        </p>
        <div role="progressbar" aria-label={t(`Step ${n} of 5`, `Paso ${n} de 5`)} aria-valuenow={n} aria-valuemin={0} aria-valuemax={5} className="mt-2">
          <ol className="cx-dots" aria-hidden>
            {STEP_NAMES.map((_, i) => <li key={i} className={i + 1 < n ? "done" : i + 1 === n ? "now" : ""} />)}
          </ol>
        </div>
      </div>
    </header>
  );
}

export function StepShell({ n, title, sub, back, children, next, nextLabel }: {
  n: number; title: [string, string]; sub: [string, string]; back: string; next?: string; nextLabel?: [string, string]; children: React.ReactNode;
}) {
  const { t } = useLang();
  const p = useCorePath();
  return (
    <AppPage bottom capture>
      <StepHead n={n} title={title} />
      <p className="cx-note">{t(...sub).split(" · ").slice(1).join(" · ") || t(...sub)}</p>
      <section className="cx-card">
        {children}
        <div className="cx-actions">
          {next ? <Link to={p(next)} className="ap-btn primary">{t(...(nextLabel ?? ["Next", "Siguiente"]))}</Link> : null}
          <Link to={p(back)} className="cx-back">{t("Back", "Atrás")}</Link>
        </div>
      </section>
      <p className="cx-note">{t("Practice screen with a sample job. Not connected to real permit filing.", "Pantalla de práctica con un trabajo de muestra. No está conectada a la presentación real de permisos.")}</p>
    </AppPage>
  );
}

export const selectCls = "";
