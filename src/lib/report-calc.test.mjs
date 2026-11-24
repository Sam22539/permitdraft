import test from "node:test";
import assert from "node:assert/strict";
import * as c from "./report-calc.ts";

const J = (id, o = {}) => ({ id, trackingNo: id, customer: "", address: "", stage: "new", permitRef: null, sentAt: "2026-03-15T12:00:00Z", receivedAt: null, workAt: [], inspAt: [], ...o });
const tz = "America/Los_Angeles";

test("range ends are inclusive by local calendar day", () => {
  const r = { from: "2026-03-01", to: "2026-03-31", tz };
  assert.equal(c.inRange("2026-03-01T08:00:00Z", r), true);   // Mar 1 00:00 PST
  assert.equal(c.inRange("2026-03-01T07:59:59Z", r), false);  // Feb 28 23:59 PST
  assert.equal(c.inRange("2026-04-01T06:59:59Z", r), true);   // Mar 31 23:59 PDT
  assert.equal(c.inRange("2026-04-01T07:00:00Z", r), false);  // Apr 1 00:00 PDT
});
test("a job counted once per month however many events; distinct across months", () => {
  const r = { from: "2026-01-01", to: "2026-03-31", tz: "UTC" };
  const jobs = [J("a", { inspAt: ["2026-02-02T10:00:00Z", "2026-02-20T10:00:00Z", "2026-03-02T10:00:00Z"] })];
  const m = c.monthly(jobs, r);
  assert.deepEqual(m.months, ["2026-01", "2026-02", "2026-03"]);
  assert.deepEqual(m.series.inspected, [0, 1, 1]);
  assert.equal(c.jobsFor(jobs, "inspected", r).length, 1);
});
test("donut reconciles: stages sum to the sent cohort, unknown stage is Not started, last edit is never used", () => {
  const r = { from: "2026-03-01", to: "2026-03-31", tz: "UTC" };
  const jobs = [J("a", { stage: "submitted" }), J("b"), J("c", { stage: "weird" }), J("d", { sentAt: "2026-02-28T23:59:59Z", stage: "approved" })];
  const s = c.stageCounts(jobs, r);
  assert.equal(s.total, 3);
  assert.equal(Object.values(s.counts).reduce((x, y) => x + y, 0), s.total);
  assert.equal(s.counts.new, 2);
  assert.equal(s.counts.approved, 0);
  assert.equal(c.jobsInStage(jobs, "new", r).length, 2);
});
test("series and drill-down lists agree for every month", () => {
  const r = { from: "2026-01-15", to: "2026-04-10", tz: "UTC" };
  const jobs = [J("a", { sentAt: "2026-01-14T23:00:00Z" }), J("b", { sentAt: "2026-01-15T00:00:00Z" }), J("c", { sentAt: "2026-04-10T23:59:59Z", receivedAt: "2026-04-11T00:00:00Z" })];
  const m = c.monthly(jobs, r);
  m.months.forEach((mo, i) => { for (const k of c.METRICS) assert.equal(c.jobsFor(jobs, k, r, mo).length, m.series[k][i]); });
  assert.deepEqual(m.series.sent, [1, 0, 0, 1]);
  assert.deepEqual(m.series.opened, [0, 0, 0, 0]);
});
test("date validation", () => { assert.equal(c.isDay("2026-02-30"), false); assert.equal(c.isDay("2026-02-28"), true); assert.equal(c.validTz("Nope/Zone"), false); });

test("submitted/approved series count distinct jobs per month from recorded stage changes only", () => {
  const r = { from: "2026-01-01", to: "2026-03-31", tz: "UTC" };
  const jobs = [
    J("a", { submittedAt: ["2026-02-02T10:00:00Z", "2026-02-20T10:00:00Z"], approvedAt: ["2026-03-01T10:00:00Z"] }),
    J("b", { stage: "approved" }), // current label alone creates no dated event
    J("c", { submittedAt: ["2026-02-05T10:00:00Z"] }),
  ];
  const m = c.monthly(jobs, r);
  assert.deepEqual(m.series.submitted, [0, 2, 0]);
  assert.deepEqual(m.series.approved, [0, 0, 1]);
  assert.equal(c.jobsFor(jobs, "submitted", r, "2026-02").length, 2);
  assert.equal(c.jobsFor(jobs, "approved", r).length, 1);
});
