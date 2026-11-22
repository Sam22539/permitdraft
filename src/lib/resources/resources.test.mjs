import test from "node:test";
import assert from "node:assert/strict";
import * as R from "./data.ts";

test("dataset is valid and covers only the CA, AZ, TX rollout with every key", () => {
  assert.deepEqual(R.validateDataset(), []);
  assert.deepEqual(R.STATES.map(([c]) => c), ["CA", "AZ", "TX"]);
  assert.deepEqual(Object.keys(R.STATE_LINKS).sort(), ["AZ", "CA", "TX"]);
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
  assert.equal(c.selectorStates, 3);
  assert.equal(c.statesWithVerified, 2);
  assert.equal(c.stateLinksTotal, 3 * R.STATE_KEYS.length);
  assert.equal(c.stateVerified, 3);
  assert.equal(c.statePending, 3 * R.STATE_KEYS.length - 3);
  assert.equal(c.federal.verified, 2);
  assert.equal(c.federal.total, 17);
  assert.equal(c.stateVerified + c.stateNotApplicable + c.stateNotFound + c.statePending, c.stateLinksTotal);
});
test("Arizona is selectable with every entry pending; no source is assumed", () => {
  const az = R.STATE_LINKS.AZ;
  assert.equal(az.length, R.STATE_KEYS.length);
  assert.equal(R.outboundOnly(az).length, 0);
  for (const l of az) { assert.equal(l.status, "unverified"); assert.equal(l.url, null); }
});
test("outside-state research stays archived, never public", () => {
  assert.equal(R.STATE_LINKS.FL, undefined);
  assert.equal(R.isStateCode("FL"), false);
  assert.equal(R.STATE_RECORDS.FL.length, 2);
  assert.ok(R.ARCHIVE_STATES.some(([c]) => c === "FL"));
  assert.ok(R.validateDataset(R.FEDERAL, { ...R.STATE_LINKS, FL: R.STATE_LINKS.CA }).length > 0);
  assert.deepEqual(R.resourcesSearch("permit", "fl"), { stage: "permit" });
});
test("in-scope verified entries are kept", () => {
  assert.equal(R.STATE_LINKS.CA.find((l) => l.key === "lic_lookup").url, "https://www.cslb.ca.gov/OnlineServices/CheckLicenseII/CheckLicense.aspx");
  assert.equal(R.outboundOnly(R.STATE_LINKS.TX).length, 2);
});
test("deep links pass only an explicit valid state", () => {
  assert.deepEqual(R.resourcesSearch("permit"), { stage: "permit" });
  assert.deepEqual(R.resourcesSearch("permit", "tx"), { stage: "permit", state: "TX" });
  assert.deepEqual(R.resourcesSearch("permit", "Sacramento"), { stage: "permit" });
});
