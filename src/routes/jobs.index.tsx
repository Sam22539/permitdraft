import { CoreGate, daysLeft, useCoreTrial } from "../components/core-offer";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppPage } from "../components/app-shell";
import { STATE_LABEL, fmtDate } from "../components/inspection-timeline";
import { todayIso, urgentAction, useInsp } from "../lib/inspection";
import { STEP_PATHS, useResumeStep } from "../lib/job-draft";
import { useLang } from "../lib/lang";
import { useCorePath } from "../components/demo";
import { usePhotos } from "../lib/photos";
import { useCaptured, type Captured } from "../lib/captured";
import { evaluateCapture, useOfficeJurisdictions } from "../lib/rules/use-evaluation";
import { captureSummary } from "../lib/capture-fields";

export const Route = createFileRoute("/jobs/")({
  head: () => ({ meta: [{ title: "Jobs — PermitDraft" }, { name: "description", content: "Your jobs, their status and the next step for each." }] }),
  component: () => <CoreGate><Jobs /></CoreGate>,
});

type Status = "Draft" | "Missing info" | "Done" | "Blocked";
type Job = { id: string; addr: string; who?: [string, string]; equip: string; date: string; status: Status; next?: string; sample?: boolean; href?: boolean };

const JOBS: Job[] = [
  { id: "hp-1187", addr: "4412 Alder Court, Sacramento", who: ["MR", "Marcus Reyes"], equip: "Heat pump change-out", date: "Nov 18, 2026", status: "Missing info", next: "Next: fix 2 missing items", href: true },
  { id: "s1", addr: "7 Demo Lane", equip: "Gas furnace", date: "Nov 17, 2026", status: "Draft", next: "Next: finish job details (7 left)", sample: true },
  { id: "s2", addr: "33 Sample Rd", equip: "Heat pump AC", date: "Nov 16, 2026", status: "Blocked", next: "Refrigerant type to confirm with the office", sample: true },
  { id: "s3", addr: "92 Placeholder Ct", equip: "Ductless mini-split", date: "Nov 15, 2026", status: "Draft", sample: true },
];
const cls: Record<Status, string> = { Draft: "draft", "Missing info": "missing", Done: "done", Blocked: "blocked" };
const esStatus: Record<Status, string> = { Draft: "Borrador", "Missing info": "Falta información", Done: "Listo", Blocked: "Bloqueado" };
type Chip = "Awaiting review" | "All" | "Drafts" | "Missing info" | "In progress";
const chips: [Chip, string][] = [["Awaiting review", "Esperando revisión"], ["All", "Todos"], ["Drafts", "Borradores"], ["Missing info", "Falta información"], ["In progress", "En curso"]];

export function Jobs() {
  const { t, lang } = useLang();
  const p = useCorePath();
  const trial = useCoreTrial();
  const insp = useInsp();
  const resume = useResumeStep();
  const { pending } = usePhotos();
  const captured = useCaptured();
  const jurs = useOfficeJurisdictions();
  const act = urgentAction(insp, todayIso());
  const [chip, setChip] = useState<Chip>("Awaiting review");
  const capJobs: (Job & { cap: Captured; awaiting: boolean })[] = captured.map((c) => {
    const sm = captureSummary(c, lang);
    // Awaiting office review: a captured draft the rules engine marks ready for office review.
    const awaiting = sm.missing === 0 && evaluateCapture(c, jurs[c.id] ?? null).officeReview.ready;
    return { id: c.id, cap: c, awaiting, addr: sm.addr, equip: sm.equip, date: new Date(c.finishedAt).toLocaleDateString(lang === "es" ? "es-US" : "en-US", { dateStyle: "medium" }),
      status: (sm.missing > 0 ? "Missing info" : "Draft") as Status, next: undefined };
  });
  const all = [...capJobs, ...JOBS];
  const shown = all.filter((j) =>
    chip === "Awaiting review" ? (j as { awaiting?: boolean }).awaiting === true : chip === "All" ? true : chip === "Drafts" ? j.status === "Draft" : chip === "Missing info" ? j.status === "Missing info" : j.status === "Missing info",
  );
  const count = (s: Status) => all.filter((j) => j.status === s).length;

  return (
    <AppPage bottom wide>
      <header className="jb-head">
        <div className="jb-title">
          <h1>{t("Jobs", "Trabajos")}</h1>
          <span className="jb-offline"><span className="jb-dot" aria-hidden />{t("Saves offline", "Guarda sin conexión")}</span>
        </div>
        {trial.state === "active" && (() => { const d = daysLeft(trial.expiresAt); return (
          <p className="jb-trial" data-testid="trial-banner">{t(`${d} ${d === 1 ? "day" : "days"} left in your free trial`, `Quedan ${d} ${d === 1 ? "día" : "días"} de su prueba gratis`)} · <Link to="/" hash="core-offer" className="underline font-semibold">{t("See plan", "Ver plan")}</Link></p>
        ); })()}
      </header>
      {resume > 0 && (
        <Link to={p(STEP_PATHS[resume - 1])} className="ap-btn primary" data-testid="resume-job">
          {t("Resume job", "Reanudar trabajo")} · {t(`Step ${resume} of 5`, `Paso ${resume} de 5`)}
        </Link>
      )}
      <p className="jb-meta"><Link to="/coverage" className="underline font-semibold">{t("What PermitDraft covers", "Qué cubre PermitDraft")}</Link></p>
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
      {shown.length === 0 && (
        <div className="jb-empty" data-testid="jobs-empty">
          <p>{chip === "Awaiting review" ? t("No drafts are awaiting office review right now.", "Ningún borrador espera revisión de oficina por ahora.") : t("No jobs match this filter.", "Ningún trabajo coincide con este filtro.")}</p>
          <button type="button" className="ap-btn ghost" onClick={() => setChip("All")} data-testid="show-all-jobs">{t("Show all jobs", "Ver todos los trabajos")}</button>
        </div>
      )}
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
        const cap = (j as { cap?: Captured }).cap;
        if (cap) {
          const sm = captureSummary(cap, lang);
          return (
            <div key={j.id} className={`jb-job ${cls[j.status]}`} data-testid="captured-job">
              {body}
              {(() => {
                const ev = evaluateCapture(cap, jurs[cap.id] ?? null);
                return (
                  <>
                    <p className="jb-next" data-testid="job-next">{t("Next: ", "Siguiente: ")}{ev.next.kind === "capture" && ev.next.item ? t(`add ${ev.next.item.text[0].toLowerCase()}`, `agregue ${ev.next.item.text[1].toLowerCase()}`) : ev.next.kind === "jurisdiction" ? t("office confirms the jurisdiction", "la oficina confirma la jurisdicción") : t("review the draft with the office", "revise el borrador con la oficina")}</p>
                    <p className="jb-meta">{ev.officeReview.ready ? t("Ready for office review", "Listo para revisión de oficina") : t(`Not ready for office review (${ev.missing.length} missing)`, `No listo para revisión de oficina (faltan ${ev.missing.length})`)} · {t("Not ready for filing", "No listo para presentar")}</p>
                  </>
                );
              })()}
              <Link to={p("/permit/draft/$id")} params={{ id: cap.id } as never} className="ap-btn primary" data-testid="open-review">{t("Open review draft", "Abrir borrador de revisión")}</Link>
            </div>
          );
        }
        return j.href ? (
          <div key={j.id} className={`jb-job ${cls[j.status]}`}>
            <Link to={p("/jobs/sample-job")} className="grid gap-[inherit]" aria-label={t("View sample job details", "Ver detalles del trabajo de muestra")}>{body}</Link>
            {pending > 0 && <p className="ph-pend" data-testid="jobs-pending">{t(`${pending} photo(s) waiting to upload`, `${pending} foto(s) esperando para subir`)}</p>}
            <Link to={p("/jobs/sample-job")} hash="inspection-timeline" aria-label={t("View inspection timeline", "Ver cronología de inspección")} className="jb-next" data-testid="jobs-insp-action">
              {t("Inspection: ", "Inspección: ")}{t(act.en, act.es)}
              {act.date && <> · {fmtDate(act.date, lang)}</>}
              {act.state !== "confirm" && <> · {t(...STATE_LABEL[act.state])}</>}
            </Link>
          </div>
        ) : (
          <div key={j.id} className={`jb-job ${cls[j.status]}`}>{body}</div>
        );
      })}
    </AppPage>
  );
}
