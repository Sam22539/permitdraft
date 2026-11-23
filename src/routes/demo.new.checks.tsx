import { createFileRoute } from "@tanstack/react-router";
import { fixSearch } from "../lib/fix-mode";
import { DemoProvider } from "../components/demo";
import { Checks } from "./new.checks";

export const Route = createFileRoute("/demo/new/checks")({
  validateSearch: fixSearch,
  head: () => ({ meta: [{ title: "Checks — PermitDraft Demo" }, { property: "og:title", content: "Checks — PermitDraft Demo" }, { name: "description", content: "PermitDraft Demo, step 4 of 5: readings and checks." }, { property: "og:description", content: "PermitDraft Demo, step 4 of 5: readings and checks." }] }),
  component: () => <DemoProvider><Checks /></DemoProvider>,
});
