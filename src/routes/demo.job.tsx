import { createFileRoute } from "@tanstack/react-router";
import { DemoProvider } from "../components/demo";
import { Detail } from "./jobs.sample-job";

export const Route = createFileRoute("/demo/job")({
  head: () => ({ meta: [{ title: "Job #HP-1187 — PermitDraft Demo" }, { property: "og:title", content: "Job #HP-1187 — PermitDraft Demo" }, { name: "description", content: "PermitDraft Demo: job HP-1187 with its next step, paperwork, inspection timeline and photos." }, { property: "og:description", content: "PermitDraft Demo: job HP-1187 with its next step, paperwork, inspection timeline and photos." }] }),
  validateSearch: (s: Record<string, unknown>): { saved?: "1"; done?: string } => ({ saved: s.saved === "1" || s.saved === 1 ? "1" : undefined, done: typeof s.done === "string" && s.done ? s.done : undefined }),
  component: () => <DemoProvider><Detail /></DemoProvider>,
});
