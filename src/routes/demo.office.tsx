import { createFileRoute } from "@tanstack/react-router";
import { DemoProvider } from "../components/demo";
import { OfficeDashboard, SAMPLE } from "../components/office/dashboard";

export const Route = createFileRoute("/demo/office")({
  head: () => ({ meta: [{ title: "Office dashboard (sample) — PermitDraft Demo" }, { name: "description", content: "PermitDraft Demo: the office dashboard with sample jobs. Nothing here is real." }, { name: "robots", content: "noindex" }] }),
  component: () => <DemoProvider><OfficeDashboard data={SAMPLE} sample /></DemoProvider>,
});
