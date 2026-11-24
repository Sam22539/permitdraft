import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { backend } from "../lib/backend";
import { useLang } from "../lib/lang";
import { getReport, type ReportResult } from "../lib/reports";
import { METRICS, STAGE_KEYS, type Metric } from "../lib/report-calc";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";

export const STAGE_LABEL: Record<string, [string, string]> = {
  new: ["Not started", "Sin iniciar"], preparing: ["Preparing paperwork", "Preparando documentos"],
  submitted: ["Submitted (recorded by office)", "Presentado (anotado por la oficina)"], approved: ["Approved (recorded by office)", "Aprobado (anotado por la oficina)"],
  inspection: ["Inspection stage", "Etapa de inspección"], closed: ["Closed", "Cerrado"],
};
export const STAGE_COLOR: Record<string, string> = { new: "#64748B", preparing: "#F97316", submitted: "#2563EB", approved: "#16A34A", inspection: "#7C3AED", closed: "#102A43" };
export const METRIC_LABEL: Record<Metric, [string, string]> = {
  sent: ["Sent to office", "Enviados a la oficina"], opened: ["Opened by office reviewer", "Abiertos por revisor de oficina"],
  worked: ["Work scheduled for", "Trabajo programado para"], inspected: ["Inspection scheduled for", "Inspección programada para"],
  submitted: ["Marked submitted by office (internal)", "Marcado presentado por la oficina (interno)"], approved: ["Marked approved by office (internal)", "Marcado aprobado por la oficina (interno)"],
};
export const METRIC_COLOR: Record<Metric, string> = { sent: "#102A43", opened: "#F97316", worked: "#2563EB", inspected: "#7C3AED", submitted: "#2563EB", approved: "#16A34A" };

const pad = (n: number) => String(n).padStart(2, "0");
export const localDay = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const browserTz = () => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"; } catch { return "UTC"; } };
/** Default window: the first day of the month five months back through today. */
export function defaultRange() {
  const n = new Date();
  const s = new Date(n.getFullYear(), n.getMonth() - 5, 1);
  return { from: localDay(s), to: localDay(n) };
}
export const monthLabel = (k: string, locale: string) => new Date(Date.UTC(+k.slice(0, 4), +k.slice(5, 7) - 1, 1)).toLocaleDateString(locale, { month: "short", year: "numeric", timeZone: "UTC" });

export type Report = { state: "loading" } | { state: "error" } | { state: "forbidden" } | { state: "range" } | { state: "ok"; data: Extract<ReportResult, { ok: true }> };

/** The signed-in office person's own company report for a day range, computed on the server from their verified membership. */
export function useReport(from: string, to: string): Report {
  const [r, setR] = useState<Report>({ state: "loading" });
  useEffect(() => {
    let live = true;
    setR({ state: "loading" });
    (async () => {
      const { data: sess } = await backend.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) { if (live) setR({ state: "forbidden" }); return; }
      const res = await getReport({ data: { token, from, to, tz: browserTz() } });
      if (!live) return;
      setR(res.ok ? { state: "ok", data: res } : { state: res.reason });
    })().catch(() => { if (live) setR({ state: "error" }); });
    return () => { live = false; };
  }, [from, to]);
  return r;
}

type Sp = { from: string; to: string; stage?: string; metric?: string; month?: string };
const reportsLink = (sp: Sp) => ({ to: "/reports" as const, search: sp as never, hash: "drill" });

/** Permit status donut: one ring segment per office-recorded stage, each a link to the matching jobs. */
export function StageDonut({ total, counts, from, to, compact }: { total: number; counts: Record<string, number>; from: string; to: string; compact?: boolean }) {
  const { t } = useLang();
  const R = 15.9155;
  let acc = 0;
  return (
    <div className={`rp-donut${compact ? " compact" : ""}`}>
      <svg viewBox="0 0 42 42" role="img" aria-label={t(`Office-recorded stage of ${total} jobs sent to the office`, `Etapa anotada por la oficina de ${total} trabajos enviados a la oficina`)} className="rp-donut-svg">
        <circle cx="21" cy="21" r={R} fill="none" stroke="#E2E8F0" strokeWidth="6" />
        {total > 0 && STAGE_KEYS.map((k) => {
          const n = counts[k] ?? 0; if (!n) return null;
          const len = (n / total) * 100, off = 25 - acc; acc += len;
          return (
            <Link key={k} {...reportsLink({ from, to, stage: k })} aria-label={`${t(...STAGE_LABEL[k])}: ${n}`}>
              <circle cx="21" cy="21" r={R} fill="none" stroke={STAGE_COLOR[k]} strokeWidth="6" strokeDasharray={`${len} ${100 - len}`} strokeDashoffset={off} className="rp-seg" />
            </Link>
          );
        })}
        <text x="21" y="21.5" textAnchor="middle" className="rp-donut-n">{total}</text>
        <text x="21" y="26" textAnchor="middle" className="rp-donut-l">{t("jobs", "trabajos")}</text>
      </svg>
      <ul className="rp-legend">
        {STAGE_KEYS.map((k) => {
          const n = counts[k] ?? 0;
          return (
            <li key={k}>
              <Link {...reportsLink({ from, to, stage: k })} className="rp-legend-link">
                <span className="rp-dot" style={{ background: STAGE_COLOR[k] }} aria-hidden />
                <span>{t(...STAGE_LABEL[k])}</span>
                <strong>{n}</strong>
                <span className="rp-pct">{total ? Math.round((n / total) * 100) : 0}%</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Grouped monthly bars: each bar is a link to the distinct jobs behind it. */
export function MonthlyBars({ months, series, from, to, metrics = METRICS }: { months: string[]; series: Record<Metric, number[]>; from: string; to: string; metrics?: Metric[] }) {
  const { t, lang } = useLang();
  const locale = lang === "es" ? "es" : "en-US";
  const max = Math.max(1, ...metrics.flatMap((m) => series[m]));
  const bw = 14, gap = 3, grp = metrics.length * (bw + gap) + 18, H = 150, top = 14, w = months.length * grp + 8;
  return (
    <div className="rp-bars">
      <ul className="rp-legend inline">
        {metrics.map((m) => <li key={m}><span className="rp-dot" style={{ background: METRIC_COLOR[m] }} aria-hidden />{t(...METRIC_LABEL[m])}</li>)}
      </ul>
      <div className="rp-bars-scroll" tabIndex={0} role="group" aria-label={t("Monthly chart, scrolls sideways if needed", "Gráfico mensual, se desplaza si es necesario")}>
        <svg width={w} height={H + 34} viewBox={`0 0 ${w} ${H + 34}`} role="img" aria-label={t("Jobs per month by recorded event. The table below has the same numbers.", "Trabajos por mes según el evento registrado. La tabla de abajo tiene los mismos números.")} style={{ minWidth: w }}>
          <line x1="0" x2={w} y1={top + H} y2={top + H} stroke="#CBD5E1" />
          {months.map((mo, i) => (
            <g key={mo} transform={`translate(${i * grp + 6},0)`}>
              {metrics.map((m, j) => {
                const n = series[m][i], h = Math.round((n / max) * (H - 14));
                return (
                  <Link key={m} {...reportsLink({ from, to, metric: m, month: mo })} aria-label={`${monthLabel(mo, locale)}, ${t(...METRIC_LABEL[m])}: ${n}`}>
                    <rect x={j * (bw + gap)} y={top + H - Math.max(h, n ? 2 : 0)} width={bw} height={Math.max(h, n ? 2 : 0)} fill={METRIC_COLOR[m]} rx="2" className="rp-seg" />
                    {n > 0 && <text x={j * (bw + gap) + bw / 2} y={top + H - h - 3} textAnchor="middle" className="rp-bar-n">{n}</text>}
                  </Link>
                );
              })}
              <text x={(metrics.length * (bw + gap)) / 2} y={top + H + 16} textAnchor="middle" className="rp-axis">{monthLabel(mo, locale)}</text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}

/** The same numbers as the charts, as a table. */
export function MonthlyTable({ months, series, from, to }: { months: string[]; series: Record<Metric, number[]>; from: string; to: string }) {
  const { t, lang } = useLang();
  const locale = lang === "es" ? "es" : "en-US";
  return (
    <Table className="rp-table">
      <caption className="sr-only">{t("Distinct jobs per month by recorded event", "Trabajos distintos por mes según el evento registrado")}</caption>
      <TableHeader><TableRow><TableHead scope="col">{t("Month", "Mes")}</TableHead>{METRICS.map((m) => <TableHead key={m} scope="col">{t(...METRIC_LABEL[m])}</TableHead>)}</TableRow></TableHeader>
      <TableBody>
        {months.map((mo, i) => (
          <TableRow key={mo}>
            <TableHead scope="row">{monthLabel(mo, locale)}</TableHead>
            {METRICS.map((m) => <TableCell key={m}>{series[m][i] > 0 ? <Link {...reportsLink({ from, to, metric: m, month: mo })} className="underline font-semibold">{series[m][i]}</Link> : 0}</TableCell>)}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/** Command Center widgets: the donut and the monthly bars for the default window, linking to the full report. */
export function CommandCenterCharts() {
  const { t } = useLang();
  const [rg] = useState(defaultRange);
  const rep = useReport(rg.from, rg.to);
  return (
    <section className="crm-panel" aria-labelledby="rp-w-h" data-testid="cc-charts">
      <div className="crm-panel-head">
        <h3 id="rp-w-h" className="crm-h3">{t("Permit status and monthly activity", "Estado del permiso y actividad mensual")}</h3>
        <p className="crm-note">{t(`Jobs sent to your office from ${rg.from} to ${rg.to}. Stages are what your office recorded, not official permit status; submitted and approved bars count only stage changes your office made since history began (internal, not a filing or city confirmation). Pick a segment or bar to see its jobs.`, `Trabajos enviados a su oficina del ${rg.from} al ${rg.to}. Las etapas son las que anotó su oficina, no el estado oficial del permiso; las barras de presentado y aprobado cuentan solo cambios de etapa hechos por su oficina desde que empezó el historial (interno, no es una presentación ni confirmación de la ciudad). Elija un segmento o barra para ver sus trabajos.`)}</p>
      </div>
      {rep.state === "loading" && <p className="ap-muted" role="status">{t("Loading…", "Cargando…")}</p>}
      {(rep.state === "error" || rep.state === "forbidden" || rep.state === "range") && <p className="ap-muted" role="status">{t("The charts could not be loaded for this account.", "No se pudieron cargar los gráficos para esta cuenta.")}</p>}
      {rep.state === "ok" && (rep.data.donut.total === 0 && METRICS.every((m) => rep.data.series[m].every((n) => n === 0))
        ? <div className="jb-empty"><p>{t("No jobs were sent to your office in this period, so there is nothing to chart yet.", "No se enviaron trabajos a su oficina en este periodo, así que todavía no hay nada que graficar.")}</p></div>
        : (
          <div className="rp-widgets">
            <StageDonut total={rep.data.donut.total} counts={rep.data.donut.counts} from={rg.from} to={rg.to} compact />
            <MonthlyBars months={rep.data.months} series={rep.data.series} from={rg.from} to={rg.to} metrics={["sent", "submitted", "approved", "inspected"]} />
          </div>
        ))}
      <p className="crm-note"><Link to="/reports" search={{ from: rg.from, to: rg.to } as never} className="underline font-semibold" data-testid="cc-report-link">{t("Open Reports & Analytics, with a table of every number", "Abrir Reportes y análisis, con una tabla de cada número")}</Link></p>
    </section>
  );
}
