import { createFileRoute } from "@tanstack/react-router";
import { DemoProvider } from "../components/demo";
import { Photos } from "./new.photos";

export const Route = createFileRoute("/demo/new/photos")({
  head: () => ({ meta: [{ title: "Photos — PermitDraft Demo" }, { property: "og:title", content: "Photos — PermitDraft Demo" }, { name: "description", content: "PermitDraft Demo, step 5 of 5: evidence photos, then finish to the review draft." }, { property: "og:description", content: "PermitDraft Demo, step 5 of 5: evidence photos, then finish to the review draft." }] }),
  component: () => <DemoProvider><Photos /></DemoProvider>,
});
