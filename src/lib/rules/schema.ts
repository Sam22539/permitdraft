// Versioned rule data: shapes only. No rule text, threshold, date, fee or URL lives in the engine or the UI.
export type L = readonly [string, string]; // [English, Spanish]
export type Layer = "app" | "country" | "federal" | "state" | "county" | "city" | "utility" | "manufacturer";
export type Category = "documentation" | "refrigerant" | "efficiency" | "energy_code" | "testing" | "licensing" | "permit";
export type RuleStatus = "verified" | "unverified" | "needs_review" | "deprecated";
/** documentation = PermitDraft's own capture checklist (never a legal requirement); legal = a statute, code or agency rule. */
export type RuleScope = "documentation" | "legal";
export type Source = { title: string; url?: string; type: "internal" | "statute" | "regulation" | "agency" | "code" | "secondary" };
export type WorkflowId = "heat-pump" | "central-ac" | "furnace-coil";
export type Requirement = { type: "field"; input: string } | { type: "photo"; slot: "plate" | "outdoor" | "gauge" } | { type: "check"; input: string };

export type Rule = {
  id: string;
  version: number;
  scope: RuleScope;
  layer: Layer;
  /** "*" = every job; otherwise an exact jurisdiction code from the pack's jurisdiction list. */
  jurisdictionCode: string;
  category: Category;
  /** The date basis the rule is judged on: the job's evaluation date, or an install/manufacture date. */
  dateBasis: "evaluation_date" | "install_date" | "manufacture_date";
  appliesTo: { workflows: WorkflowId[] | "*" };
  requires: Requirement;
  outcome: "require_item";
  text: L; why: L; todo: L;
  effectiveFrom: string; effectiveTo?: string; supersedes?: string;
  sources: Source[];
  verifiedOn: string;
  verifiedBy: "product" | "staff" | "licensed_expert";
  status: RuleStatus;
  /** Only active rules are evaluated. A legal rule is never active unless status is verified. */
  active: boolean;
};

export type Jurisdiction = { code: string; layer: Layer; name: L; parent?: string };
/** A pointer to where to look. Never a check, never evaluated, never counted toward coverage. */
export type Reference = { jurisdictionCode: string; title: L; url: string; kind: "permit_office" | "inspection_schedule"; recordedOn: string; note?: L };
export type Workflow = { id: WorkflowId; type: string; name: L; inputs: Record<string, string> };
export type RulePack = {
  packId: string; version: string; releasedOn: string;
  jurisdictions: Jurisdiction[]; workflows: Workflow[]; rules: Rule[]; references: Reference[];
};
