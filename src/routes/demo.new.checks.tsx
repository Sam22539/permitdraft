import { createFileRoute } from "@tanstack/react-router";
import { DemoProvider } from "../components/demo";
import { Checks } from "./new.checks";

export const Route = createFileRoute("/demo/new/checks")({
  head: () => ({ meta: [{ title: "Free demo: checks — PermitDraft" }, { name: "description", content: "Demo step 4 of 5: readings and checks." }] }),
  component: () => <DemoProvider><Checks /></DemoProvider>,
});
