// Pure rules shared by the office dashboard and packet review (tested in office-stage.test.mjs).

export type StageKey = "draft" | "field" | "missing" | "review" | "ready" | "submitted" | "corrections" | "approved";

/**
 * Where a sent packet sits in the office pipeline, from facts the office can see. "Ready to submit" needs the contractor's
 * signature on the latest version; the manual "preparing" stage alone never makes a packet ready.
 */
export function packetStage(crmStage: string | null | undefined, opts: { signedLatest: boolean; askedTech: boolean }): StageKey {
  const st = crmStage ?? "new";
  if (st === "approved" || st === "inspection" || st === "closed") return "approved";
  if (st === "submitted") return "submitted";
  if (opts.signedLatest) return "ready";
  if (opts.askedTech) return "missing";
  return "review";
}

export type CheckLike = { kind: "conflict" | "missing" | "matched"; decision: "use_evidence" | "keep_with_note" | "asked_tech" | null };

/** Still open: any missing item, and a conflict with no final decision (asking the tech is a question, not a decision). */
export function isPending(c: CheckLike): boolean {
  return c.kind !== "matched" && (!c.decision || c.decision === "asked_tech");
}
