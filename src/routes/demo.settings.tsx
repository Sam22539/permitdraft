import { createFileRoute } from "@tanstack/react-router";
import { DemoProvider } from "../components/demo";
import { SettingsScreen } from "./settings";

export const Route = createFileRoute("/demo/settings")({
  head: () => ({ meta: [{ title: "Free demo: settings — PermitDraft" }, { name: "description", content: "Choose English or Spanish in the PermitDraft demo." }] }),
  component: () => <DemoProvider><SettingsScreen /></DemoProvider>,
});
