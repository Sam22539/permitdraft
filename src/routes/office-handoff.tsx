import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CoreGate } from "../components/core-offer";
import { AppPage } from "../components/app-shell";
import { useCorePath, useDemo } from "../components/demo";
import { Input } from "../components/ui/input";
import { useCaptured } from "../lib/captured";
import { captureSummary } from "../lib/capture-fields";
import { useLang } from "../lib/lang";
import { evaluateCapture, useOfficeJurisdictions } from "../lib/rules/use-evaluation";

export const Route = createFileRoute("/office-handoff")({
  head: () => ({ meta: [{ title: "Office handoff search — PermitDraft" }, { name: "description", content: "Find a captured job by job number, address or customer name, see if it is ready for office review, and open its review draft." }] }),
  component: () => <CoreGate><OfficeHandoff /></CoreGate>,
});

type Ready = "all" | "ready" | "not";
const FILTERS: [Ready, string, string][] = [["all", "All", "Todos"], ["ready", "Ready for office review", "Listos para revisión de oficina"], ["not", "Not ready yet", "Todavía no listos"]];

/** Case-insensitive partial match, ignoring extra spaces. */
const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();

/**
 * Searches only the captured jobs this browser keeps for the current mode: real Core jobs here, or the demo's own
 * practice jobs inside /demo (separate storage keys), never both.
 */
export function OfficeHandoff() {
  const { t, lang } = useLang();
  const p = useCorePath();
  const demo = useDemo();
  const captured = useCaptured();
  const jurs = useOfficeJurisdictions();
  const [q, setQ] = useState("");
  const [ready, setReady] = useState<Ready>("all");
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const rows = captured.map((c) => {
    const sm = captureSummary(c, lang);
    const ev = evaluateCapture(c, jurs[c.id] ?? null);
    const name = String(c.values.name ?? "").trim();
    const hay = norm([c.id, c.values.addr ?? "", c.values.city ?? "", [c.values.addr, c.values.city].filter(Boolean).join(", "), name].join(" | "));
    return { c, sm, ev, name, hay, status: sm.missing > 0 ? "missing" : "draft" };
  });
  const term = norm(q);
  const shown = rows.filter((r) => (term === "" || r.hay.includes(term)) && (ready === "all" || (ready === "ready") === r.ev.officeReview.ready));

  return (
    <AppPage bottom wide>
      <header className="jb-head">
        <div className="jb-title"><h1>{t("Office handoff", "Entrega a oficina")}</h1></div>
        <p className="ap-muted">{t(
          demo ? "Search the demo's practice jobs by job number, address or customer name, then open the review draft." : "Search the captured jobs saved on this device by job number, address or customer name, then open the review draft.",
          demo ? "Busque los trabajos de práctica de la demo por número de trabajo, dirección o nombre del cliente y abra el borrador de revisión." : "Busque los trabajos capturados en este dispositivo por número de trabajo, dirección o nombre del cliente y abra el borrador de revisión.",
        )}</p>
        <p className="ap-muted">{t("Ready for office review is not ready for filing. Filing always shows Not ready.", "Listo para revisión de oficina no es listo para presentar. Presentar siempre muestra No está listo.")}</p>
      </header>
      <div className="ap-field">
        <label htmlFor="oh-q">{t("Job number, address or customer name", "Número de trabajo, dirección o nombre del cliente")}</label>
        <Input id="oh-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} autoComplete="off" placeholder={t("e.g. Alder or cap-", "p. ej. Alder o cap-")} data-testid="oh-search" />
      </div>
      <div className="jb-chipwrap">
        <div className="jb-chips" role="group" aria-label={t("Office review readiness", "Preparación para revisión de oficina")}>
          {FILTERS.map(([k, en, es]) => (
            <button key={k} type="button" className="jb-chip" aria-pressed={ready === k} onClick={() => setReady(k)} data-testid={`oh-filter-${k}`}>{t(en, es)}</button>
          ))}
        </div>
      </div>
      <p className="ap-muted" role="status" data-testid="oh-count">
        {!mounted ? t("Loading…", "Cargando…") : t(`${shown.length} of ${rows.length} ${rows.length === 1 ? "job" : "jobs"}`, `${shown.length} de ${rows.length} ${rows.length === 1 ? "trabajo" : "trabajos"}`)}
      </p>
      {mounted && rows.length === 0 && (
        <div className="jb-empty" data-testid="oh-empty">
          <p>{t(demo ? "No practice jobs are saved in the demo yet. Finish a demo job and it shows up here." : "No captured jobs are saved on this device yet. Finish a job and it shows up here.", demo ? "Todavía no hay trabajos de práctica guardados en la demo. Termine un trabajo de la demo y aparecerá aquí." : "Todavía no hay trabajos capturados en este dispositivo. Termine un trabajo y aparecerá aquí.")}</p>
          <Link to={p("/new")} className="ap-btn primary">{t("+ New job", "+ Nuevo trabajo")}</Link>
        </div>
      )}
      {mounted && rows.length > 0 && shown.length === 0 && (
        <div className="jb-empty" data-testid="oh-nomatch">
          <p>{t("No jobs match this search and filter.", "Ningún trabajo coincide con esta búsqueda y filtro.")}</p>
          <button type="button" className="ap-btn ghost" onClick={() => { setQ(""); setReady("all"); }} data-testid="oh-clear">{t("Clear search and filter", "Borrar búsqueda y filtro")}</button>
        </div>
      )}
      {shown.map(({ c, sm, ev, name, status }) => (
        <div key={c.id} className={`jb-job ${status}`} data-testid="oh-job">
          <div className="jb-top">
            <span className="jb-addr">{sm.addr}</span>
            <span className={`jb-badge ${status}`}>{status === "missing" ? t("Missing info", "Falta información") : t("Draft", "Borrador")}</span>
          </div>
          <p className="jb-meta">
            <span data-testid="oh-jobno">{t("Job", "Trabajo")} {c.id}</span>
            <span>·</span>
            <span>{name || t("Customer not captured", "Cliente no capturado")}</span>
          </p>
          <p className="jb-meta">{sm.equip}</p>
          <p className="jb-meta" data-testid="oh-ready">
            {ev.officeReview.ready ? t("Ready for office review", "Listo para revisión de oficina") : t("Not ready for office review", "No listo para revisión de oficina")} · {t("Not ready for filing", "No listo para presentar")}
          </p>
          {ev.missing.length > 0 ? (
            <div data-testid="oh-missing">
              <p className="jb-next">{t(`${ev.missing.length} missing`, `Faltan ${ev.missing.length}`)}</p>
              <ul className="oh-missing">{ev.missing.map((m) => <li key={m.ruleId}>{t(...m.text)}</li>)}</ul>
            </div>
          ) : (
            <p className="jb-meta">{t("No missing items.", "No falta nada.")}</p>
          )}
          <Link to={p("/permit/draft/$id")} params={{ id: c.id } as never} className="ap-btn primary" data-testid="oh-open">{t("Open review draft", "Abrir borrador de revisión")}</Link>
        </div>
      ))}
    </AppPage>
  );
}
