import { createServerFn } from "@tanstack/react-start";
import { isDay, jobsFor, METRICS, monthly, stageCounts, validTz, type JobRec, type Metric } from "./report-calc";

/**
 * Company-private reports. The company is never taken from the request: it is the caller's own verified membership,
 * and only admin and office members get anything. Technicians and non-members get a refusal, no data.
 */
export type ReportData = {
  ok: true; range: { from: string; to: string; tz: string };
  donut: { total: number; counts: Record<string, number> };
  months: string[]; series: Record<Metric, number[]>;
  jobs: JobRec[]; officeRefCount: number; totalJobsEver: number;
};
export type ReportResult = ReportData | { ok: false; reason: "forbidden" | "range" };

async function all<T>(q: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; from < 20000; from += 1000) {
    const { data, error } = await q(from, from + 999);
    if (error) throw new Error("read");
    out.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  return out;
}

export const getReport = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; from: string; to: string; tz: string }) => {
    const token = String(d?.token ?? "");
    if (!token || token.length > 4000) throw new Error("input");
    return { token, from: String(d?.from ?? ""), to: String(d?.to ?? ""), tz: String(d?.tz ?? "") };
  })
  .handler(async ({ data }): Promise<ReportResult> => {
    const { serverBackend } = await import("./backend.server");
    const office = await import("./office.server");
    const db = serverBackend();
    const who = await office.whoIs(db, data.token);
    const member = await office.membership(db, who.email);
    if (!member || (member.role !== "admin" && member.role !== "office")) return { ok: false, reason: "forbidden" };
    const span = isDay(data.from) && isDay(data.to) ? (Date.parse(data.to) - Date.parse(data.from)) / 86400000 : -1;
    if (span < 0 || span > 731 || !validTz(data.tz)) return { ok: false, reason: "range" };
    const range = { from: data.from, to: data.to, tz: data.tz };
    const cid = member.company_id;

    const packets = await all<{ id: string; tracking_no: string; sent_at: string; office_received_at: string | null; captured_fields: { values?: Record<string, string>; formDefaults?: Record<string, string> } | null }>((a, b) =>
      db.from("office_packets").select("id, tracking_no, sent_at, office_received_at, captured_fields").eq("company_id", cid).order("sent_at").order("id").range(a, b));
    const crm = await all<{ packet_id: string; stage: string; permit_ref: string | null }>((a, b) => db.from("packet_crm").select("packet_id, stage, permit_ref").eq("company_id", cid).order("packet_id").range(a, b));
    const asg = await all<{ packet_id: string; starts_at: string }>((a, b) => db.from("job_assignments").select("packet_id, starts_at").eq("company_id", cid).order("packet_id").range(a, b));
    const insp = await all<{ id: string; packet_id: string; scheduled_at: string }>((a, b) => db.from("company_inspections").select("id, packet_id, scheduled_at").eq("company_id", cid).order("id").range(a, b));

    const evs = await all<{ id: string; packet_id: string; to_stage: string; at: string }>((a, b) => db.from("packet_stage_events").select("id, packet_id, to_stage, at").eq("company_id", cid).in("to_stage", ["submitted", "approved"]).order("at").order("id").range(a, b));
    const subAt = new Map<string, string[]>(), apprAt = new Map<string, string[]>();
    for (const e of evs) { const m = e.to_stage === "submitted" ? subAt : apprAt; m.set(e.packet_id, [...(m.get(e.packet_id) ?? []), e.at]); }

    const crmBy = new Map(crm.map((c) => [c.packet_id, c]));
    const work = new Map<string, string[]>(), ins = new Map<string, string[]>();
    for (const a of asg) work.set(a.packet_id, [...(work.get(a.packet_id) ?? []), a.starts_at]);
    for (const i of insp) ins.set(i.packet_id, [...(ins.get(i.packet_id) ?? []), i.scheduled_at]);
    const seen = new Set<string>();
    const all_: JobRec[] = [];
    for (const p of packets) {
      if (seen.has(p.id)) continue; seen.add(p.id);
      const v = { ...(p.captured_fields?.formDefaults ?? {}), ...(p.captured_fields?.values ?? {}) };
      const c = crmBy.get(p.id);
      all_.push({
        id: p.id, trackingNo: p.tracking_no, customer: String(v.name ?? "").trim(), address: [v.addr, v.city].map((x) => String(x ?? "").trim()).filter(Boolean).join(", "),
        stage: c?.stage ?? "new", permitRef: c?.permit_ref ?? null, sentAt: p.sent_at, receivedAt: p.office_received_at, workAt: work.get(p.id) ?? [], inspAt: ins.get(p.id) ?? [],
        submittedAt: subAt.get(p.id) ?? [], approvedAt: apprAt.get(p.id) ?? [],
      });
    }
    // Only jobs with a recorded event in the range travel to the page.
    const jobs = all_.filter((j) => METRICS.some((m) => jobsFor([j], m, range).length > 0));
    const donut = stageCounts(all_, range);
    const { months, series } = monthly(all_, range);
    const cohortIds = new Set(jobsFor(all_, "sent", range).map((j) => j.id));
    const officeRefCount = all_.filter((j) => cohortIds.has(j.id) && j.permitRef).length;
    return { ok: true, range, donut, months, series, jobs, officeRefCount, totalJobsEver: all_.length };
  });
