import { Link } from "@tanstack/react-router";
import { AppPage } from "./app-shell";
import { useLang } from "../lib/lang";

export function StepShell({ n, title, sub, back, children, next, nextLabel }: {
  n: number; title: [string, string]; sub: [string, string]; back: string; next?: string; nextLabel?: [string, string]; children: React.ReactNode;
}) {
  const { t } = useLang();
  return (
    <AppPage bottom>
      <h1 className="text-3xl">{t(...title)}</h1>
      <div>
        <p className="font-semibold">{t(...sub)}</p>
        <div className="ap-prog mt-2" role="progressbar" aria-label={`Step ${n} of 5`} aria-valuenow={n} aria-valuemin={0} aria-valuemax={5}><div style={{ width: `${n * 20}%` }} /></div>
      </div>
      <section className="ap-card">
        {children}
        <div className="ap-two">
          <Link to={back} className="ap-btn ghost">{t("Back", "Atrás")}</Link>
          {next ? (
            <Link to={next} className="ap-btn primary">{t(...(nextLabel ?? ["Next", "Siguiente"]))}</Link>
          ) : null}
        </div>
      </section>
      <p className="ap-muted">{t("Practice screen with a sample job. Not connected to real permit filing.", "Pantalla de práctica con un trabajo de muestra. No está conectada a la presentación real de permisos.")}</p>
    </AppPage>
  );
}

export const selectCls = "w-full min-h-[56px] rounded-md border border-input bg-white px-3 text-lg";
