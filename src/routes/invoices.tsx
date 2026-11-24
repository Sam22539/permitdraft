import { createFileRoute } from "@tanstack/react-router";
import { CoreGate } from "../components/core-offer";
import { InvoicesPage } from "../components/invoices";

export const Route = createFileRoute("/invoices")({
  head: () => ({ meta: [{ title: "Invoices — PermitDraft" }, { name: "description", content: "Private draft invoices for your company's jobs, with payments recorded by hand." }, { name: "robots", content: "noindex" }] }),
  component: () => <CoreGate><InvoicesPage /></CoreGate>,
});
