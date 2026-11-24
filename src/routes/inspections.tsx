import { createFileRoute } from "@tanstack/react-router";
import { CoreGate } from "../components/core-offer";
import { InspectionsPage } from "../components/records";

export const Route = createFileRoute("/inspections")({
  head: () => ({ meta: [{ title: "Inspections — PermitDraft" }, { name: "description", content: "Record, reschedule and update company-recorded inspections." }, { name: "robots", content: "noindex" }] }),
  component: () => <CoreGate><InspectionsPage /></CoreGate>,
});
