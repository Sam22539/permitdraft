import { createFileRoute } from "@tanstack/react-router";
import { fixSearch } from "../lib/fix-mode";
import { DemoProvider } from "../components/demo";
import { Equipment } from "./new.equipment";

export const Route = createFileRoute("/demo/new/equipment")({
  validateSearch: fixSearch,
  head: () => ({ meta: [{ title: "Equipment — PermitDraft Demo" }, { property: "og:title", content: "Equipment — PermitDraft Demo" }, { name: "description", content: "PermitDraft Demo, step 2 of 5: equipment from the data plate, with a sample data plate photo." }, { property: "og:description", content: "PermitDraft Demo, step 2 of 5: equipment from the data plate, with a sample data plate photo." }] }),
  component: () => <DemoProvider><Equipment /></DemoProvider>,
});
