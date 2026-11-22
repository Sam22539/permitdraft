import { createFileRoute } from "@tanstack/react-router";
import { DemoProvider } from "../components/demo";
import { Work } from "./new.work";

export const Route = createFileRoute("/demo/new/work")({
  head: () => ({ meta: [{ title: "Free demo: work performed — PermitDraft" }, { name: "description", content: "Demo step 3 of 5: what the crew did." }] }),
  component: () => <DemoProvider><Work /></DemoProvider>,
});
