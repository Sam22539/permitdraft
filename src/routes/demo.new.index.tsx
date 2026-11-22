import { createFileRoute } from "@tanstack/react-router";
import { DemoProvider } from "../components/demo";
import { NewJob } from "./new.index";

export const Route = createFileRoute("/demo/new/")({
  head: () => ({ meta: [{ title: "Free demo: new job — PermitDraft" }, { name: "description", content: "Demo step 1 of 5: homeowner and job site, prefilled with a sample job you can edit." }] }),
  component: () => <DemoProvider><NewJob /></DemoProvider>,
});
