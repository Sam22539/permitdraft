import { createFileRoute } from "@tanstack/react-router";
import { CoreGate } from "../components/core-offer";
import { DocumentsPage } from "../components/records";

export const Route = createFileRoute("/documents")({
  head: () => ({ meta: [{ title: "Documents — PermitDraft" }, { name: "description", content: "Search and open the files your office keeps for each job." }, { name: "robots", content: "noindex" }] }),
  component: () => <CoreGate><DocumentsPage /></CoreGate>,
});
