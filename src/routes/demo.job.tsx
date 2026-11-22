import { createFileRoute } from "@tanstack/react-router";
import { DemoProvider } from "../components/demo";
import { Detail } from "./jobs.sample-job";

export const Route = createFileRoute("/demo/job")({
  head: () => ({ meta: [{ title: "Free demo: Job #HP-1187 — PermitDraft" }, { name: "description", content: "Demo job HP-1187: next step, paperwork, inspection timeline and photos." }] }),
  validateSearch: (s: Record<string, unknown>): { saved?: "1"; done?: string } => ({ saved: s.saved === "1" || s.saved === 1 ? "1" : undefined, done: typeof s.done === "string" && s.done ? s.done : undefined }),
  component: () => <DemoProvider><Detail /></DemoProvider>,
});
