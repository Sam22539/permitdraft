import { createFileRoute } from "@tanstack/react-router";
import { DemoProvider } from "../components/demo";
import { SettingsScreen } from "./settings";

export const Route = createFileRoute("/demo/settings")({
  head: () => ({ meta: [{ title: "Settings — PermitDraft Demo" }, { property: "og:title", content: "Settings — PermitDraft Demo" }, { name: "description", content: "PermitDraft Demo: choose English or Spanish." }, { property: "og:description", content: "PermitDraft Demo: choose English or Spanish." }] }),
  component: () => <DemoProvider><SettingsScreen /></DemoProvider>,
});
