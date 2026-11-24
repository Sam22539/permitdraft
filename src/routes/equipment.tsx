import { createFileRoute } from "@tanstack/react-router";
import { CoreGate } from "../components/core-offer";
import { EquipmentPage } from "../components/records";

export const Route = createFileRoute("/equipment")({
  head: () => ({ meta: [{ title: "Equipment — PermitDraft" }, { name: "description", content: "Search the equipment captured in your job packets." }, { name: "robots", content: "noindex" }] }),
  component: () => <CoreGate><EquipmentPage /></CoreGate>,
});
