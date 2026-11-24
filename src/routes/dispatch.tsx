import { createFileRoute } from "@tanstack/react-router";
import { CoreGate } from "../components/core-offer";
import { DispatchPage } from "../components/dispatch";

export const Route = createFileRoute("/dispatch")({
  head: () => ({ meta: [{ title: "Dispatch & Schedule — PermitDraft" }, { name: "description", content: "Assign jobs to technicians, schedule them and see conflicts by day, week or month." }, { name: "robots", content: "noindex" }] }),
  component: () => <CoreGate><DispatchPage /></CoreGate>,
});
