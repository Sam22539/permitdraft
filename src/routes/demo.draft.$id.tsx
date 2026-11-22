import { createFileRoute } from "@tanstack/react-router";
import { DemoProvider } from "../components/demo";
import { Review } from "./permit.draft.$id";

export const Route = createFileRoute("/demo/draft/$id")({
  head: () => ({ meta: [{ title: "Free demo: review draft — PermitDraft" }, { name: "description", content: "Demo review draft: every value with where it came from, what is missing, and why filing is not ready." }] }),
  component: () => <DemoProvider><Review /></DemoProvider>,
});
