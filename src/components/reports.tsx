import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppPage } from "./app-shell";
import { useLang } from "../lib/lang";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { browserTz, defaultRange, localDay, METRIC_COLOR, METRIC_LABEL, MonthlyBars, MonthlyTable, STAGE_COLOR, STAGE_LABEL, StageDonut, useReport } from "./report-charts";
import { eventTimes, inRange, jobsFor, jobsInStage, METRICS, monthOf, STAGE_KEYS, type Metric } from "../lib/report-calc";

export type ReportSearch = { from?: string; to?: string; stage?: string; metric?: string; month?: string };
export function validateReportSearch(s: Record<string, unknown>): ReportSearch {
  const str = (k: string) => (typeof s[k] === "string" ? (s[k] as string) : undefined);
  const metric = str("metric"), stage = str("stage"), month = str("month");
  return {
    from: str("from")?.slice(0, 10), to: str("to")?.slice(0, 10),
    metric: METRICS.includes(metric as Metric) ? metric : undefined,
    stage: STAGE_KEYS.includes(stage as never) ? stage : undefined,
    month: month && /^\d{4}-\d{2}$/.test(month) ? month : undefined,
  };
}

const addDays = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); return localDay(d); };

export function ReportsPage({ search }: { search: ReportSearch }) {
  const { t, lang } = useLang();
  const locale = lang === "es" ? "es" : "en-US";
  const nav = useNavigate();
  const def = defaultRange();
  const from = search.from ?? def.from, to = search.to ?? def.to;
  const [f, setF] = useState(from), [e, setE] = useState(to);
  const rep = useReport(from, to);
  const sp = { from, to };
  const presets: [string, string, { from: string; to: string }][] = [
    ["Last 30 days", "Últimos 30 días", { from: addDays(29), to: localDay() }],
    ["Last 6 months", "Últimos 6 meses", def],
    ["This year", "Este año", { from: `${new Date().getFullYear()}-01-01`, to: localDay() }],
  ];
  const apply = (ev: React.FormEvent) => { ev.preventDefault(); if (f && e && f <= e) nav({ to: "/reports", search: { from: f, to: e } as never }); };
  const bad = !!f && !!e && f > e;

  let body: React.ReactNode;
  if (rep.state === "loading") body = <p className="ap-muted" role="status">{t("Loading…", "Cargando…")}</p>;
  else if (rep.state === "forbidden") body = <div className="jb-empty" data-testid="rp-forbidden"><p>{t("Reports are for office reviewers and admins of your company. Sign in with an office account to see them.", "Los reportes son para revisores de oficina y administradores de su empresa. Inicie sesión con una cuenta de oficina para verlos.")}</p></div>;
  else if (rep.state === "range") body = <div className="jb-empty"><p>{t("Pick a valid date range of at most two years.", "Elija un rango de fechas válido de máximo dos años.")}</p></div>;
  else if (rep.state === "error") body = <div className="jb-empty"><p>{t("The report could not be loaded. Try again in a moment.", "No se pudo cargar el reporte. Inténtelo de nuevo en un momento.")}</p></div>;
  else {
    const d = rep.data, range = d.range;
    const stageSel = search.stage, metricSel = search.metric as Metric | undefined;
    const drill = stageSel ? jobsInStage(d.jobs, stageSel, range) : metricSel ? jobsFor(d.jobs, metricSel, range, search.month) : null;
    const drillTitle = stageSel ? t(`Jobs sent in this period whose office stage is “${t(...STAGE_LABEL[stageSel])}”`, `Trabajos enviados en este periodo con etapa de oficina «${t(...STAGE_LABEL[stageSel])}»`)
      : metricSel ? t(`${t(...METRIC_LABEL[metricSel])}${search.month ? `, ${search.month}` : ""}`, `${t(...METRIC_LABEL[metricSel])}${search.month ? `, ${search.month}` : ""}`) : "";
    const kpi = (label: string, n: number, note: string) => <li className="crm-kpi"><span className="crm-kpi-top"><span>{label}</span></span><strong className="crm-kpi-val">{n}</strong><span className="crm-kpi-note">{note}</span></li>;
    const none = d.donut.total === 0 && METRICS.every((m) => d.series[m].every((n) => n === 0));
    const fmt = (iso: string) => new Date(iso).toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" });
    body = (
      <>
        <ul className="crm-kpis rp-kpis" aria-label={t("Totals for the period", "Totales del periodo")}>
          {kpi(t("Jobs sent to office", "Trabajos enviados a la oficina"), d.donut.total, t("Distinct jobs, by the day they were sent", "Trabajos distintos, por día de envío"))}
          {kpi(t("Opened by an office reviewer", "Abiertos por un revisor"), jobsFor(d.jobs, "opened", d.range).length, t("By the day first opened", "Por día de primera apertura"))}
          {kpi(t("Jobs with work scheduled", "Trabajos con trabajo programado"), jobsFor(d.jobs, "worked", d.range).length, t("By scheduled start day", "Por día de inicio programado"))}
          {kpi(t("Jobs with an inspection scheduled", "Trabajos con inspección programada"), jobsFor(d.jobs, "inspected", d.range).length, t("By scheduled inspection day", "Por día de inspección programada"))}
          {kpi(t("Marked submitted by office", "Marcados presentados por la oficina"), jobsFor(d.jobs, "submitted", d.range).length, t("Internal, by the day the stage was changed", "Interno, por día del cambio de etapa"))}
          {kpi(t("Marked approved by office", "Marcados aprobados por la oficina"), jobsFor(d.jobs, "approved", d.range).length, t("Internal, by the day the stage was changed", "Interno, por día del cambio de etapa"))}
        </ul>
        {none && <div className="jb-empty" data-testid="rp-empty"><p>{t("Nothing was recorded in this period. Try a wider date range.", "No se registró nada en este periodo. Pruebe un rango más amplio.")}</p></div>}
        <section className="crm-panel" aria-labelledby="rp-stage-h">
          <div className="crm-panel-head">
            <h2 id="rp-stage-h" className="crm-h3">{t("Permit status, as recorded by your office", "Estado del permiso, según anotó su oficina")}</h2>
            <p className="crm-note">{t("Whole: the jobs sent to your office in this period. Each job is counted once, in the stage your office has set now. Office stages are hand-recorded labels; PermitDraft receives no official confirmation from any permit office, so none is shown here.", "Total: los trabajos enviados a su oficina en este periodo. Cada trabajo cuenta una vez, en la etapa que su oficina fijó ahora. Las etapas son etiquetas anotadas a mano; PermitDraft no recibe confirmación oficial de ninguna oficina de permisos, así que aquí no se muestra ninguna.")}</p>
          </div>
          <StageDonut total={d.donut.total} counts={d.donut.counts} {...sp} />
          <Table className="rp-table">
            <caption className="sr-only">{t("Jobs by office-recorded stage", "Trabajos por etapa anotada por la oficina")}</caption>
            <TableHeader><TableRow><TableHead scope="col">{t("Office stage", "Etapa de oficina")}</TableHead><TableHead scope="col">{t("Jobs", "Trabajos")}</TableHead><TableHead scope="col">{t("Share", "Parte")}</TableHead></TableRow></TableHeader>
            <TableBody>
              {STAGE_KEYS.map((k) => <TableRow key={k}><TableHead scope="row">{t(...STAGE_LABEL[k])}</TableHead><TableCell>{d.donut.counts[k] > 0 ? <Link to="/reports" search={{ ...sp, stage: k } as never} hash="drill" className="underline font-semibold">{d.donut.counts[k]}</Link> : 0}</TableCell><TableCell>{d.donut.total ? Math.round((d.donut.counts[k] / d.donut.total) * 100) : 0}%</TableCell></TableRow>)}
              <TableRow><TableHead scope="row">{t("Total", "Total")}</TableHead><TableCell>{d.donut.total}</TableCell><TableCell>{d.donut.total ? "100%" : "0%"}</TableCell></TableRow>
            </TableBody>
          </Table>
          <p className="crm-note">{t(`${d.officeRefCount} of these jobs have a permit reference typed in by your office. That is a note, not a check with the permit office.`, `${d.officeRefCount} de estos trabajos tienen una referencia de permiso escrita por su oficina. Es una nota, no una verificación con la oficina de permisos.`)}</p>
        </section>
        <section className="crm-panel" aria-labelledby="rp-month-h">
          <div className="crm-panel-head">
            <h2 id="rp-month-h" className="crm-h3">{t("Jobs and permit work by month", "Trabajos y trámites por mes")}</h2>
            <p className="crm-note">{t("Each bar counts distinct jobs by the date of a recorded event: sent to the office, first opened by a signed-in reviewer, work scheduled for, inspection scheduled for, and stage marked submitted or approved by your office (internal). A job counts once per month per bar.", "Cada barra cuenta trabajos distintos por la fecha de un evento registrado: enviado a la oficina, primera apertura por un revisor con sesión, trabajo programado, inspección programada y etapa marcada presentada o aprobada por su oficina (interno). Un trabajo cuenta una vez por mes en cada barra.")}</p>
          </div>
          <MonthlyBars months={d.months} series={d.series} {...sp} />
          <MonthlyTable months={d.months} series={d.series} {...sp} />
        </section>
        <section className="crm-panel" aria-labelledby="rp-gap-h">
          <h2 id="rp-gap-h" className="crm-h3">{t("About the submitted and approved bars", "Sobre las barras de presentado y aprobado")}</h2>
          <p className="crm-note">{t("These two bars come only from stage changes your office made in PermitDraft after stage history began, each with its own date. Older stage labels have no date and are not counted, and nothing is estimated. They are internal office marks: not a filing, and not confirmation from any local permit authority. A job counts once per month per bar, even if it was marked more than once.", "Estas dos barras vienen solo de cambios de etapa que su oficina hizo en PermitDraft después de que empezó el historial, cada uno con su fecha. Las etapas anteriores no tienen fecha y no se cuentan; no se estima nada. Son marcas internas de la oficina: no son una presentación ni una confirmación de ninguna autoridad local de permisos. Un trabajo cuenta una vez por mes en cada barra, aunque se marcara más de una vez.")}</p>
        </section>
        <section className="crm-panel" id="drill" aria-labelledby="rp-drill-h" aria-live="polite" data-testid="rp-drill">
          <h2 id="rp-drill-h" className="crm-h3">{drill ? `${drillTitle}: ${drill.length}` : t("Matching jobs", "Trabajos coincidentes")}</h2>
          {!drill ? <p className="crm-note">{t("Pick a chart segment, bar or table number above to list the jobs behind it.", "Elija un segmento, barra o número de tabla arriba para listar los trabajos detrás.")}</p>
            : drill.length === 0 ? <div className="jb-empty"><p>{t("No jobs match.", "Ningún trabajo coincide.")}</p></div>
            : (
              <ul className="rp-jobs">
                {drill.map((j) => {
                  const ev = metricSel ? eventTimes(j, metricSel).filter((x) => inRange(x, d.range) && (!search.month || monthOf(x, d.range.tz) === search.month)) : [j.sentAt];
                  return (
                    <li key={j.id} className="jb-job" data-testid="rp-job">
                      <div className="jb-top"><span className="jb-addr">{j.address || t("Address not captured", "Dirección no capturada")}</span><span className="oh-stage" style={{ borderColor: STAGE_COLOR[j.stage] }}>{t(...(STAGE_LABEL[j.stage] ?? STAGE_LABEL.new))}</span></div>
                      <p className="jb-meta">{j.trackingNo} · {j.customer || t("Customer not captured", "Cliente no capturado")}</p>
                      <p className="jb-meta">{t(...(metricSel ? METRIC_LABEL[metricSel] : METRIC_LABEL.sent))}: {ev.map(fmt).join("; ")}</p>
                      <Link to="/office-review/$id" params={{ id: j.id }} className="ap-btn primary">{t("Open packet", "Abrir paquete")}</Link>
                    </li>
                  );
                })}
              </ul>
            )}
          {drill && <p className="crm-note"><Link to="/reports" search={sp as never} className="underline font-semibold">{t("Clear selection", "Borrar selección")}</Link></p>}
        </section>
      </>
    );
  }

  return (
    <AppPage bottom wide>
      <div className="crm rp">
        <header className="jb-head">
          <div className="jb-title"><h1>{t("Reports & Analytics", "Reportes y análisis")}</h1></div>
          <p className="ap-muted">{t("Your company's own jobs only. Counts are distinct jobs, by the day each event was recorded in your time zone", "Solo los trabajos de su empresa. Los conteos son trabajos distintos, por el día en que se registró cada evento en su zona horaria")} ({browserTz()}).</p>
        </header>
        <section className="crm-panel" aria-labelledby="rp-filter-h">
          <h2 id="rp-filter-h" className="crm-h3">{t("Date range", "Rango de fechas")}</h2>
          <form onSubmit={apply} className="rp-filter">
            <div className="ap-field"><Label htmlFor="rp-from">{t("From", "Desde")}</Label><Input id="rp-from" type="date" value={f} onChange={(x) => setF(x.target.value)} required /></div>
            <div className="ap-field"><Label htmlFor="rp-to">{t("To (included)", "Hasta (incluido)")}</Label><Input id="rp-to" type="date" value={e} onChange={(x) => setE(x.target.value)} required /></div>
            <Button type="submit" disabled={bad} data-testid="rp-apply">{t("Apply", "Aplicar")}</Button>
          </form>
          {bad && <p className="ap-muted" role="alert">{t("The start date must not be after the end date.", "La fecha de inicio no puede ser posterior a la de fin.")}</p>}
          <p className="crm-note rp-presets">{presets.map(([en, es, r]) => <Link key={en} to="/reports" search={r as never} className="underline font-semibold">{t(en, es)}</Link>)}</p>
        </section>
        {body}
        <p className="crm-note"><Link to="/office-handoff" className="underline font-semibold">{t("Back to the Office Command Center", "Volver al Centro de mando de la oficina")}</Link></p>
      </div>
    </AppPage>
  );
}
