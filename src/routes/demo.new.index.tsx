import { createFileRoute } from "@tanstack/react-router";
import { fixSearch } from "../lib/fix-mode";
import { DemoProvider } from "../components/demo";
import { NewJob } from "./new.index";

export const Route = createFileRoute("/demo/new/")({
  validateSearch: fixSearch,
  head: () => ({ meta: [{ title: "New job — PermitDraft Demo" }, { property: "og:title", content: "New job — PermitDraft Demo" }, { name: "description", content: "PermitDraft Demo, step 1 of 5: homeowner and job site, prefilled with a sample job you can edit." }, { property: "og:description", content: "PermitDraft Demo, step 1 of 5: homeowner and job site, prefilled with a sample job you can edit." }] }),
  component: () => <DemoProvider><NewJob /></DemoProvider>,
});
