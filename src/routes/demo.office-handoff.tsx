import { createFileRoute } from "@tanstack/react-router";
import { DemoProvider } from "../components/demo";
import { OfficeHandoff } from "./office-handoff";

export const Route = createFileRoute("/demo/office-handoff")({
  head: () => ({ meta: [{ title: "Office handoff — PermitDraft Demo" }, { property: "og:title", content: "Office handoff — PermitDraft Demo" }, { name: "description", content: "PermitDraft Demo: search the demo sample by job number, address or customer name and open the review draft." }, { property: "og:description", content: "PermitDraft Demo: search the demo jobs by job number, address or customer name and open the review draft." }] }),
  component: () => <DemoProvider><OfficeHandoff /></DemoProvider>,
});
