import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppPage } from "../components/app-shell";
import { useLang } from "../lib/lang";

export const Route = createFileRoute("/jobs/")({
  head: () => ({ meta: [{ title: "Jobs — PermitDraft" }, { name: "description", content: "Your jobs, their status and the next step for each." }] }),
  component: Jobs,
});

type Status = "Draft" | "Missing info" | "Done" | "Blocked";
type Job = { id: string; addr: string; who?: [string, string]; equip: string; date: string; status: Status; next?: string; sample?: boolean; href?: boolean };

const JOBS: Job[] = [
  { id: "hp-1187", addr: "Job #HP-1187 · 4412 Alder Court, Sacramento", who: ["MR", "Marcus Reyes"], equip: "Heat pump change-out", date: "Nov 18, 2026", status: "Missing info", next: "Next: fix 2 missing items", href: true },
  { id: "s1", addr: "7 Demo Lane", equip: "Gas furnace", date: "Nov 17, 2026", status: "Draft", next: "Next: finish job details (7 left)", sample: true },
  { id: "s2", addr: "33 Sample Rd", equip: "Heat pump AC", date: "Nov 16, 2026", status: "Blocked", next: "Refrigerant not allowed in California", sample: true },
  { id: "s3", addr: "92 Placeholder Ct", equip: "Ductless mini-split", date: "Nov 15, 2026", status: "Draft", sample: true },
];
const cls: Record<Status, string> = { Draft: "draft", "Missing info": "missing", Done: "done", Blocked: "blocked" };
const esStatus: Record<Status, string> = { Draft: "Borrador", "Missing info": "Falta información", Done: "Listo", Blocked: "Bloqueado" };
type Chip = "All" | "Drafts" | "Missing info" | "In progress";
const chips: [Chip, string][] = [["All", "Todos"], ["Drafts", "Borradores"], ["Missing info", "Falta información"], ["In progress", "En curso"]];

function Jobs() {
  const { t, lang } = useLang();
  const [chip, setChip] = useState<Chip>("All");
  const shown = JOBS.filter((j) =>
    chip === "All" ? true : chip === "Drafts" ? j.status === "Draft" : chip === "Missing info" ? j.status === "Missing info" : j.status === "Missing info",
  );
  const count = (s: Status) => JOBS.filter((j) => j.status === s).length;

  return (
    <AppPage bottom wide>
      <header className="jb-head">
        <div className="jb-title">
          <h1>{t("Jobs", "Trabajos")}</h1>
          <span className="jb-offline"><span className="jb-dot" aria-hidden />{t("Saves offline", "Guarda sin conexión")}</span>
        </div>
        <p className="jb-trial">{t("14 days left in your free trial · See plan", "Quedan 14 días de su prueba gratis · Ver plan")}</p>
      </header>
      <div className="jb-counts">
        <div className="jb-count"><strong>{count("Missing info")}</strong><span>{t("Missing info", "Falta información")}</span></div>
        <div className="jb-count"><strong>0</strong><span>{t("Waiting on rater", "Esperando al evaluador")}</span></div>
        <div className="jb-count"><strong>{count("Done")}</strong><span>{t("Done", "Listo")}</span></div>
      </div>
      <div className="jb-chipwrap">
        <div className="jb-chips" role="group" aria-label={t("Filter jobs", "Filtrar trabajos")}>
          {chips.map(([c, es]) => (
            <button key={c} type="button" className="jb-chip" aria-pressed={chip === c} onClick={() => setChip(c)}>{t(c, es)}</button>
          ))}
        </div>
      </div>
      {shown.map((j) => {
        const body = (
          <>
            <div className="jb-top">
              <span className="jb-addr">{j.addr}</span>
              <span className={`jb-badge ${cls[j.status]}`}>{lang === "es" ? esStatus[j.status] : j.status}</span>
            </div>
            {j.who && <div className="jb-who"><span className="jb-init">{j.who[0]}</span><span>{j.who[1]}</span></div>}
            <p className="jb-meta">{j.equip} · {j.date}{j.sample && <span className="jb-tag">{t("Sample", "Muestra")}</span>}</p>
            {j.next && <p className="jb-next">{j.next}</p>}
          </>
        );
        return j.href ? (
          <Link key={j.id} to="/jobs/hp-1187" className={`jb-job ${cls[j.status]}`}>{body}</Link>
        ) : (
          <div key={j.id} className={`jb-job ${cls[j.status]}`}>{body}</div>
        );
      })}
    </AppPage>
  );
}
