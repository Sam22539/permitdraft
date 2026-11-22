import { createFileRoute } from "@tanstack/react-router";
import { DemoProvider } from "../components/demo";
import { Jobs } from "./jobs.index";

export const Route = createFileRoute("/demo/")({
  head: () => ({ meta: [{ title: "Free demo: jobs — PermitDraft" }, { name: "description", content: "Try PermitDraft free with sample HVAC jobs: no sign-in, no card. Open a job, capture it in five steps and review the draft." }] }),
  component: () => <DemoProvider><Jobs /></DemoProvider>,
});
