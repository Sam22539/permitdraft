import { createFileRoute } from "@tanstack/react-router";
import { fixSearch } from "../lib/fix-mode";
import { DemoProvider } from "../components/demo";
import { Work } from "./new.work";

export const Route = createFileRoute("/demo/new/work")({
  validateSearch: fixSearch,
  head: () => ({ meta: [{ title: "Work performed — PermitDraft Demo" }, { property: "og:title", content: "Work performed — PermitDraft Demo" }, { name: "description", content: "PermitDraft Demo, step 3 of 5: what the crew did." }, { property: "og:description", content: "PermitDraft Demo, step 3 of 5: what the crew did." }] }),
  component: () => <DemoProvider><Work /></DemoProvider>,
});
