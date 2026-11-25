import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { DemoProvider } from "../components/demo";
import { PacketReview, type ReviewData } from "../components/office/review";
import { useLang } from "../lib/lang";

export const Route = createFileRoute("/demo/office-review")({
  head: () => ({ meta: [{ title: "Office review (sample) — PermitDraft Demo" }, { name: "description", content: "PermitDraft Demo: review sample packet PD-1187. Nothing here is real or sent." }, { name: "robots", content: "noindex" }] }),
  component: () => <DemoProvider><DemoReview /></DemoProvider>,
});

const START: ReviewData = {
  packetId: "sample", tracking: "PD-1187", addr: "1187 Oak St, Pasadena", type: "Heat pump change-out", customer: "Sample customer", tech: "Luis M.", sentAt: "Nov 24, 9:47 AM", area: "City of Pasadena",
  version: { id: "v1", n: 1, fingerprint: "a91c04e2b7d35f18c6e9a2d40b7f13c58e26d9a1f04b7c3e5d82a6f19b0c4e7d" },
  checks: [{ id: "c1", field: "panel", label: "Panel rating", kind: "conflict", captured: "100 A", evidence: "125 A", evidenceSource: "Panel label photo reads", decision: null }],
  rows: [
    { label: "Equipment", value: "Carrier 25VNA036", source: "Data plate photo", check: "matched" },
    { label: "Model / serial", value: "25VNA036A003 / 4823X9", source: "Entered by Luis", check: "matched" },
    { label: "Refrigerant", value: "R-454B", source: "Entered · plate agrees", check: "matched" },
    { label: "Panel rating", value: "100 A", source: "Entered · photo disagrees", check: "conflict" },
    { label: "Duct sealing", value: "Not required (like-for-like)", source: "Entered by Luis", check: "matched" },
    { label: "Clearance", value: "24 in left side", source: "Outdoor unit photo", check: "matched" },
  ],
  photos: [{ label: "Data plate" }, { label: "Outdoor unit" }, { label: "Panel label" }, { label: "Line set" }],
  activity: [{ time: "9:52", text: "Maria opened the packet" }, { time: "9:47", text: "Office email delivered (confirmed)" }, { time: "9:47", text: "Luis sent packet v1 from the job" }],
  checked: true, signature: null, user: { name: "Maria R.", role: "Office" },
};

/** Sample review: decisions change only this page's memory, so the demo shows how versions work without sending anything. */
function DemoReview() {
  const { t } = useLang();
  const [d, setD] = useState<ReviewData>(START);
  const now = () => new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }).replace(/\s?[AP]M$/, "");
  return (
    <PacketReview sample backTo="/demo/office" data={d} actions={{
      decide: async (id, dec, note) => {
        setD((x) => {
          const c = x.checks.find((k) => k.id === id)!;
          const seals = dec !== "asked_tech";
          const value = dec === "use_evidence" ? c.evidence ?? "" : c.captured ?? "";
          const v = seals && x.version ? { id: `v${x.version.n + 1}`, n: x.version.n + 1, fingerprint: "c72e19d4" + x.version.fingerprint.slice(8) } : x.version;
          return {
            ...x, version: v,
            checks: x.checks.map((k) => (k.id === id ? { ...k, decision: dec, note } : k)),
            rows: seals ? x.rows.map((r) => (r.label === c.label ? { ...r, value, source: dec === "use_evidence" ? t("Office used the photo value", "La oficina usó el valor de la foto") : t(`Office kept it · note: ${note}`, `La oficina lo mantuvo · nota: ${note}`), check: "matched" } : r)) : x.rows,
            activity: [{ time: now(), text: seals ? t(`Office decided ${c.label}; sealed v${v!.n}`, `La oficina decidió ${c.label}; selló v${v!.n}`) : t(`Asked ${x.tech} to confirm ${c.label}`, `Se pidió a ${x.tech} confirmar ${c.label}`) }, ...x.activity],
          };
        });
        return null;
      },
      completeChecks: async () => { setD((x) => ({ ...x, checked: true })); return null; },
      requestSignature: async (to) => {
        setD((x) => ({ ...x, signature: { requestedTo: to }, activity: [{ time: now(), text: t(`Signature request for v${x.version?.n} queued (sample: nothing is sent)`, `Solicitud de firma para v${x.version?.n} en cola (muestra: no se envía nada)`) }, ...x.activity] }));
        return null;
      },
    }} />
  );
}
