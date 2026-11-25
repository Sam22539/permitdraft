import { createFileRoute } from "@tanstack/react-router";
import { PdButton, PdCard, PdChip, PdDraftNotice, PdEyebrow, PdKpiCard, PdLogo, PdStatusPill, PdSyncPill, type PdStatus } from "../components/pd";

export const Route = createFileRoute("/design-preview")({
  head: () => ({ meta: [{ title: "Design preview — PermitDraft" }, { name: "robots", content: "noindex" }] }),
  component: DesignPreview,
});

const swatches: [string, string][] = [
  ["Navy 900", "--pd-navy-900"], ["Navy 800", "--pd-navy-800"], ["Orange 700 (action)", "--pd-orange-700"],
  ["Orange 500 (accent)", "--pd-orange-500"], ["Gray 50 (app bg)", "--pd-gray-50"], ["Warm white", "--pd-warm-white"],
  ["Success", "--pd-success-bg"], ["Conflict", "--pd-conflict-bg"], ["Info", "--pd-info-bg"],
];
const statuses: [PdStatus, string][] = [
  ["matched", "Matched"], ["conflict", "Conflict"], ["missing", "Missing"], ["review", "Office review"], ["submitted", "Submitted"],
  ["ready", "Ready to submit"], ["corrections", "Corrections"], ["approved", "Approved"], ["field", "Field capture"],
];

function DesignPreview() {
  return (
    <main className="pd-ui min-h-screen bg-[var(--pd-gray-50)]">
      <header className="pd-dark bg-[var(--pd-navy-900)] px-6 py-4 lg:px-10">
        <PdLogo onDark />
      </header>
      <div className="mx-auto flex max-w-[1200px] flex-col gap-10 px-6 py-10 lg:px-10">
        <section className="flex flex-col gap-3">
          <PdEyebrow>Design preview · not a public page</PdEyebrow>
          <h1 className="font-display text-[40px] font-bold leading-none tracking-[-0.03em] lg:text-[56px]">PermitDraft building blocks</h1>
          <p className="max-w-[640px] text-[17px] text-[var(--pd-gray-700)]">Every redesigned screen is built from these. Source: <code>docs/design/DESIGN_SYSTEM.md</code>.</p>
        </section>

        <section aria-labelledby="c" className="flex flex-col gap-3">
          <h2 id="c" className="text-[15px] font-bold">Colors</h2>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3">
            {swatches.map(([name, v]) => (
              <div key={v} className="overflow-hidden rounded-[14px] border border-[var(--pd-gray-200)] bg-white">
                <div className="h-16" style={{ background: `var(${v})` }} />
                <p className="px-3 py-2 text-[13px] font-semibold">{name}</p>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="b" className="flex flex-col gap-3">
          <h2 id="b" className="text-[15px] font-bold">Buttons</h2>
          <div className="flex flex-wrap items-center gap-3">
            <PdButton>Book a demo</PdButton>
            <PdButton variant="secondary">See the workflow</PdButton>
            <PdButton disabled>Capture 2 more to send</PdButton>
            <div className="pd-dark rounded-[14px] bg-[var(--pd-navy-900)] p-3"><PdButton variant="onNavy">Replay the workflow</PdButton></div>
          </div>
          <div className="max-w-[360px]"><PdButton size="lg">Send to office</PdButton></div>
        </section>

        <section aria-labelledby="s" className="flex flex-col gap-3">
          <h2 id="s" className="text-[15px] font-bold">Status, chips and sync</h2>
          <div className="flex flex-wrap gap-2">{statuses.map(([k, l]) => <PdStatusPill key={k} status={k}>{l}</PdStatusPill>)}</div>
          <div className="flex flex-wrap gap-2"><PdChip mono>Packet v2 · 7F3A</PdChip><PdChip tone="orange">Most contractors</PdChip><PdChip tone="neutral">Nothing received</PdChip></div>
          <div className="flex flex-wrap gap-2"><PdSyncPill state="saved" /><PdSyncPill state="queued" /><PdSyncPill state="delivered" /><PdSyncPill state="queued" lang="es" /></div>
        </section>

        <section aria-labelledby="k" className="flex flex-col gap-3">
          <h2 id="k" className="text-[15px] font-bold">KPI cards (office dashboard)</h2>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
            <PdKpiCard dark label="Active jobs" value="42" trend="+12%" sub="+5 from last week" />
            <PdKpiCard label="Pending permits" value="16" trend="+6%" sub="Requires action" />
            <PdKpiCard label="Office review" value="8" trend="0%" sub="Awaiting final review" />
            <PdKpiCard label="Submitted" value="11" trend="+22%" sub="Sent to building dept." />
            <PdKpiCard label="Approved" value="26" trend="+18%" sub="Permits issued" />
            <PdKpiCard dark label="Revenue (MTD)" value="$86,420" trend="+14%" sub="Sample data" />
          </div>
        </section>

        <section aria-labelledby="n" className="flex flex-col gap-3">
          <h2 id="n" className="text-[15px] font-bold">Card and draft notice</h2>
          <PdCard className="flex max-w-[560px] flex-col gap-3 p-5">
            <p className="font-bold">PD-1187 · 1187 Oak St, Pasadena</p>
            <PdDraftNotice />
          </PdCard>
        </section>
      </div>
    </main>
  );
}
