import { createFileRoute } from "@tanstack/react-router";
import { CoreGate } from "../components/core-offer";
import { TechniciansPage } from "../components/dispatch";

export const Route = createFileRoute("/technicians")({
  head: () => ({ meta: [{ title: "Technicians — PermitDraft" }, { name: "description", content: "Your company's field technicians and what each has scheduled." }, { name: "robots", content: "noindex" }] }),
  component: () => <CoreGate><TechniciansPage /></CoreGate>,
});
