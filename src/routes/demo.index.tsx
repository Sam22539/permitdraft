import { createFileRoute } from "@tanstack/react-router";
import { DemoProvider } from "../components/demo";
import { Jobs } from "./jobs.index";

export const Route = createFileRoute("/demo/")({
  head: () => ({ meta: [{ title: "PermitDraft Demo" }, { property: "og:title", content: "PermitDraft Demo" }, { name: "description", content: "PermitDraft Demo: try PermitDraft free with sample HVAC jobs, no sign-in, no card. Open a job, capture it in five steps and review the draft." }, { property: "og:description", content: "PermitDraft Demo: try PermitDraft free with sample HVAC jobs, no sign-in, no card. Open a job, capture it in five steps and review the draft." }] }),
  component: () => <DemoProvider><Jobs /></DemoProvider>,
});
