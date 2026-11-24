// Pure report maths shared by the server (which sends the series) and the pages (which drill into the same records).
// Only dates of events that were really recorded are used: sent_at, office_received_at, assignment start, inspection date.
// Submitted/approved dates are not recorded anywhere, so no series is built from them and "last edit" is never used.

export type Metric = "sent" | "opened" | "worked" | "inspected";
export const METRICS: Metric[] = ["sent", "opened", "worked", "inspected"];
export const STAGE_KEYS = ["new", "preparing", "submitted", "approved", "inspection", "closed"] as const;

export type JobRec = {
  id: string; trackingNo: string; customer: string; address: string;
  stage: string; permitRef: string | null;
  sentAt: string; receivedAt: string | null; workAt: string[]; inspAt: string[];
};
export type Range = { from: string; to: string; tz: string };

const fmtCache = new Map<string, Intl.DateTimeFormat>();
/** The calendar day (YYYY-MM-DD) an instant falls on in a time zone. */
export function dayIn(iso: string, tz: string): string {
  let f = fmtCache.get(tz);
  if (!f) { f = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }); fmtCache.set(tz, f); }
  const parts = f.formatToParts(new Date(iso));
  const g = (k: string) => parts.find((p) => p.type === k)?.value ?? "";
  return `${g("year")}-${g("month")}-${g("day")}`;
}
export const validTz = (tz: string) => { try { new Intl.DateTimeFormat("en-US", { timeZone: tz }); return true; } catch { return false; } };
export const isDay = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(Date.parse(s + "T00:00:00Z")) && new Date(s + "T00:00:00Z").toISOString().slice(0, 10) === s;
/** Both ends inclusive, by calendar day in the range's time zone. */
export const inRange = (iso: string | null | undefined, r: Range) => { if (!iso) return false; const d = dayIn(iso, r.tz); return d >= r.from && d <= r.to; };

export function eventTimes(j: JobRec, m: Metric): string[] {
  return m === "sent" ? [j.sentAt] : m === "opened" ? (j.receivedAt ? [j.receivedAt] : []) : m === "worked" ? j.workAt : j.inspAt;
}
export const monthOf = (iso: string, tz: string) => dayIn(iso, tz).slice(0, 7);

/** Month keys (YYYY-MM) from the range's first to last day. */
export function monthsOf(r: Pick<Range, "from" | "to">): string[] {
  const out: string[] = [];
  let [y, m] = r.from.slice(0, 7).split("-").map(Number);
  const end = r.to.slice(0, 7);
  for (;;) {
    const k = `${y}-${String(m).padStart(2, "0")}`;
    out.push(k);
    if (k >= end) break;
    m++; if (m > 12) { m = 1; y++; }
  }
  return out;
}

/** Distinct jobs with at least one recorded event of this kind inside the range (and, if given, inside one month). */
export function jobsFor(jobs: JobRec[], m: Metric, r: Range, month?: string): JobRec[] {
  return jobs.filter((j) => eventTimes(j, m).some((t) => inRange(t, r) && (!month || monthOf(t, r.tz) === month)));
}
/** Jobs sent to the office in the range: the donut's whole. */
export const cohort = (jobs: JobRec[], r: Range) => jobsFor(jobs, "sent", r);
export function stageCounts(jobs: JobRec[], r: Range) {
  const c = cohort(jobs, r);
  const counts: Record<string, number> = Object.fromEntries(STAGE_KEYS.map((k) => [k, 0]));
  for (const j of c) counts[j.stage in counts ? j.stage : "new"]++;
  return { total: c.length, counts };
}
export const jobsInStage = (jobs: JobRec[], stage: string, r: Range) => cohort(jobs, r).filter((j) => (j.stage in Object.fromEntries(STAGE_KEYS.map((k) => [k, 1])) ? j.stage : "new") === stage);
export function monthly(jobs: JobRec[], r: Range) {
  const months = monthsOf(r);
  const series = Object.fromEntries(METRICS.map((m) => [m, months.map((mo) => jobsFor(jobs, m, r, mo).length)])) as Record<Metric, number[]>;
  return { months, series };
}
