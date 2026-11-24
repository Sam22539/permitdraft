import { createFileRoute } from "@tanstack/react-router";
import { CoreGate } from "../components/core-offer";
import { CustomersPage } from "../components/crm";

export const Route = createFileRoute("/customers")({
  head: () => ({ meta: [{ title: "Customers — PermitDraft" }, { name: "description", content: "Your company's customers and the jobs linked to each." }, { name: "robots", content: "noindex" }] }),
  component: () => <CoreGate><CustomersPage /></CoreGate>,
});
