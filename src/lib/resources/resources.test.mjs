import test from "node:test";
import assert from "node:assert/strict";
import * as R from "./data.ts";

test("dataset is valid and covers 50 states + DC with every key", () => {
  assert.deepEqual(R.validateDataset(), []);
  assert.equal(R.STATES.length, 51);
  for (const [c] of R.STATES) assert.equal(R.STATE_LINKS[c].length, R.STATE_KEYS.length);
});
test("unverified, absent and not-applicable entries are never outbound", () => {
  const base = R.STATE_LINKS.CA.find((l) => l.key === "lic_lookup");
  assert.ok(R.isOutbound(base));
  for (const status of ["unverified", "not_applicable", "not_found"]) assert.equal(R.isOutbound({ ...base, status }), false);
  assert.equal(R.isOutbound({ ...base, url: null }), false);
  assert.equal(R.isOutbound({ ...base, page_title: null }), false);
  assert.equal(R.isOutbound({ ...base, checked_on: null }), false);
  assert.equal(R.isOutbound({ ...base, source_type: "secondary" }), false);
  const bad = { ...base, url: null };
  assert.ok(R.validateDataset([bad], {}).length > 0);
  for (const ls of [R.FEDERAL, ...Object.values(R.STATE_LINKS)]) for (const l of R.outboundOnly(ls)) assert.equal(l.status, "verified");
});
test("counts separate actual coverage from selector coverage", () => {
  const c = R.completeness();
  assert.equal(c.selectorStates, 51);
  assert.equal(c.statesWithVerified, 2);
  assert.equal(c.stateVerified, 3);
  assert.equal(c.federal.verified, 1);
  assert.equal(c.stateVerified + c.stateNotApplicable + c.stateNotFound + c.statePending, c.stateLinksTotal);
});
test("deep links pass only an explicit valid state", () => {
  assert.deepEqual(R.resourcesSearch("permit"), { stage: "permit" });
  assert.deepEqual(R.resourcesSearch("permit", "tx"), { stage: "permit", state: "TX" });
  assert.deepEqual(R.resourcesSearch("permit", "Sacramento"), { stage: "permit" });
});
