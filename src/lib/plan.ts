/**
 * Plan features. Which plan tier gets Dispatch, Leads, Invoices, Revenue and Automation is Sam's decision (open), so the
 * office portal hides them by default; flip a feature here (or wire it to the company's plan) once that is decided.
 */
export type PlanTier = "core" | "pro";
export type Parked = "dispatch" | "leads" | "invoices" | "revenue" | "automation";

export const PLAN: { tier: PlanTier; parked: Record<Parked, boolean> } = {
  tier: "core",
  parked: { dispatch: false, leads: false, invoices: false, revenue: false, automation: false },
};

export const hasFeature = (f: Parked) => PLAN.parked[f];

