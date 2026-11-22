import type { L, Rule, RulePack, Workflow } from "./schema";

// Pure and deterministic: the same job, jurisdiction, date and pack always give the same result. No UI, no storage.
export type JobInput = {
  type: string; values: Record<string, string>; photoSlots: string[];
  /** An exact code the office confirmed, or null. Never guessed from a ZIP code or city text. */
  jurisdictionCode: string | null; asOf: string;
};
export type CheckResult = {
  ruleId: string; ruleVersion: number; status: "met" | "missing"; text: L; todo: L; why: L;
  layer: Rule["layer"]; scope: Rule["scope"]; ruleStatus: Rule["status"]; sources: Rule["sources"]; effectiveFrom: string; verifiedOn: string;
  dateBasis: Rule["dateBasis"]; evidence: string;
};
export type FilingReason = "jurisdiction_unconfirmed" | "no_verified_coverage" | "evidence_unresolved" | "workflow_unknown";
export type Evaluation = {
  packId: string; packVersion: string; asOf: string; workflow: Workflow | null;
  jurisdiction: { code: string | null; name: L | null; known: boolean };
  coverage: { level: "documentation_only"; verifiedLegalRules: number; applicableLegalRules: number };
  results: CheckResult[]; missing: CheckResult[];
  officeReview: { ready: boolean };
  filing: { ready: boolean; reasons: FilingReason[] };
  next: { kind: "capture" | "jurisdiction" | "office" ; item?: CheckResult };
  references: RulePack["references"];
};

export function workflowFor(pack: RulePack, type: string): Workflow | null { return pack.workflows.find((w) => w.type === type) ?? null; }
const has = (v: string | undefined) => (v ?? "").trim() !== "";
const inEffect = (r: Rule, d: string) => r.effectiveFrom <= d && (!r.effectiveTo || d <= r.effectiveTo);

export function evaluate(pack: RulePack, job: JobInput): Evaluation {
  const wf = workflowFor(pack, job.type);
  const jur = job.jurisdictionCode ? pack.jurisdictions.find((j) => j.code === job.jurisdictionCode) ?? null : null;
  const applicable = pack.rules.filter((r) => r.active && inEffect(r, job.asOf)
    && (r.jurisdictionCode === "*" || (jur !== null && r.jurisdictionCode === jur.code))
    && wf !== null && (r.appliesTo.workflows === "*" || r.appliesTo.workflows.includes(wf.id)));
  const results: CheckResult[] = applicable.map((r) => {
    let met = false; let evidence = "";
    if (r.requires.type === "photo") { met = job.photoSlots.includes(r.requires.slot); evidence = `photo:${r.requires.slot}`; }
    else if (r.requires.type === "field" && wf) { const k = wf.inputs[r.requires.input]; met = !!k && has(job.values[k]); evidence = `field:${k ?? "?"}`; }
    else if (r.requires.type === "check" && wf) { const k = wf.inputs[r.requires.input]; met = !!k && job.values[k] === "1"; evidence = `check:${k ?? "?"}`; }
    return { ruleId: r.id, ruleVersion: r.version, status: met ? "met" : "missing", text: r.text, todo: r.todo, why: r.why, layer: r.layer, scope: r.scope,
      ruleStatus: r.status, sources: r.sources, effectiveFrom: r.effectiveFrom, verifiedOn: r.verifiedOn, dateBasis: r.dateBasis, evidence };
  });
  const missing = results.filter((r) => r.status === "missing");
  const legal = applicable.filter((r) => r.scope === "legal");
  const verifiedLegal = legal.filter((r) => r.status === "verified").length;
  const officeReady = wf !== null && missing.length === 0;
  const reasons: FilingReason[] = [];
  if (!wf) reasons.push("workflow_unknown");
  if (!jur) reasons.push("jurisdiction_unconfirmed");
  if (verifiedLegal === 0) reasons.push("no_verified_coverage");
  if (missing.length > 0) reasons.push("evidence_unresolved");
  const refs = jur ? pack.references.filter((x) => x.jurisdictionCode === jur.code) : [];
  const next: Evaluation["next"] = missing.length > 0 ? { kind: "capture", item: missing[0] } : !jur ? { kind: "jurisdiction" } : { kind: "office" };
  return {
    packId: pack.packId, packVersion: pack.version, asOf: job.asOf, workflow: wf,
    jurisdiction: { code: jur?.code ?? null, name: jur?.name ?? null, known: !!jur },
    coverage: { level: "documentation_only", verifiedLegalRules: verifiedLegal, applicableLegalRules: legal.length },
    results, missing, officeReview: { ready: officeReady }, filing: { ready: reasons.length === 0, reasons }, next, references: refs,
  };
}
