import { createFileRoute } from "@tanstack/react-router";
import { CoreGate } from "../components/core-offer";
import { ReportsPage, validateReportSearch } from "../components/reports";

export const Route = createFileRoute("/reports")({
  validateSearch: validateReportSearch,
  head: () => ({ meta: [{ title: "Reports & Analytics — PermitDraft" }, { name: "description", content: "Your company's permit stages and monthly job activity, with the jobs behind every number." }, { name: "robots", content: "noindex" }] }),
  component: () => { const s = Route.useSearch(); return <CoreGate><ReportsPage search={s} /></CoreGate>; },
});
