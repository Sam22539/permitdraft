import { createFileRoute } from "@tanstack/react-router";
import { DemoProvider } from "../components/demo";
import { SyncPage } from "./sync";

export const Route = createFileRoute("/demo/sync")({
  head: () => ({ meta: [{ title: "Sync — PermitDraft Demo" }, { name: "description", content: "PermitDraft Demo: what is still waiting to upload from this phone." }, { name: "robots", content: "noindex" }] }),
  component: () => <DemoProvider><SyncPage /></DemoProvider>,
});
