import { createFileRoute } from "@tanstack/react-router";
import { DemoProvider } from "../components/demo";
import { Equipment } from "./new.equipment";

export const Route = createFileRoute("/demo/new/equipment")({
  head: () => ({ meta: [{ title: "Free demo: equipment — PermitDraft" }, { name: "description", content: "Demo step 2 of 5: equipment from the data plate, with a sample data plate photo." }] }),
  component: () => <DemoProvider><Equipment /></DemoProvider>,
});
