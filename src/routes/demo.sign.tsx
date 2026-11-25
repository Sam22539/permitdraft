import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { DemoProvider } from "../components/demo";
import { SignVersion, type SignData } from "../components/office/sign";

export const Route = createFileRoute("/demo/sign")({
  head: () => ({ meta: [{ title: "Contractor signing (sample) — PermitDraft Demo" }, { name: "description", content: "PermitDraft Demo: how a contractor signs one exact version. Nothing is signed or filed." }, { name: "robots", content: "noindex" }] }),
  component: () => <DemoProvider><DemoSign /></DemoProvider>,
});

function DemoSign() {
  const [d, setD] = useState<SignData>({
    addr: "1187 Oak St, Pasadena CA", versionN: 2, fingerprint: "7f3a92c1e04b6d58a2c9f17e3b05d84a6c21e9f73b40d5a8e16c2f97a03b4d68", area: "the City of Pasadena's", reviewer: "Maria R.",
    rows: [{ label: "Equipment", value: "Carrier 25VNA036" }, { label: "Refrigerant", value: "R-454B" }, { label: "Panel rating", value: "125 A", note: "fixed in v2" }],
    photos: 3, signed: null,
  });
  return <SignVersion sample data={d} onSign={async (name) => { setD((x) => ({ ...x, signed: { by: `${name} (sample)`, at: new Date().toLocaleString("en-US") } })); return null; }} />;
}
