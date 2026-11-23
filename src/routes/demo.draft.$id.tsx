import { createFileRoute } from "@tanstack/react-router";
import { DemoProvider } from "../components/demo";
import { Review } from "./permit.draft.$id";

export const Route = createFileRoute("/demo/draft/$id")({
  head: () => ({ meta: [{ title: "Review draft — PermitDraft Demo" }, { property: "og:title", content: "Review draft — PermitDraft Demo" }, { name: "description", content: "PermitDraft Demo: the review draft, every value with where it came from, what is missing, and why filing is not ready." }, { property: "og:description", content: "PermitDraft Demo: the review draft, every value with where it came from, what is missing, and why filing is not ready." }] }),
  component: () => <DemoProvider><Review /></DemoProvider>,
});
