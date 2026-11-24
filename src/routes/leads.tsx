import { createFileRoute } from "@tanstack/react-router";
import { CoreGate } from "../components/core-offer";
import { LeadsPage } from "../components/crm";

export const Route = createFileRoute("/leads")({
  head: () => ({ meta: [{ title: "Leads — PermitDraft" }, { name: "description", content: "Your company's leads with stage and next action." }, { name: "robots", content: "noindex" }] }),
  component: () => <CoreGate><LeadsPage /></CoreGate>,
});
