import { createFileRoute } from "@tanstack/react-router";
import { DemoProvider } from "../components/demo";
import { OfficeHandoff } from "./office-handoff";

export const Route = createFileRoute("/demo/office-handoff")({
  head: () => ({ meta: [{ title: "Free demo: office handoff search — PermitDraft" }, { name: "description", content: "Search the demo's practice jobs by job number, address or customer name and open the review draft." }] }),
  component: () => <DemoProvider><OfficeHandoff /></DemoProvider>,
});
