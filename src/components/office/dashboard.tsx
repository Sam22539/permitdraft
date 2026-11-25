import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useLang } from "../../lib/lang";
import { backend } from "../../lib/backend";
import { hasFeature } from "../../lib/plan";
import { OfficeCard, OfficeShell } from "./shell";

/** The eight pipeline stages from the dashboard design, in order. */
export const PIPELINE = [
  { key: "draft", en: "New / Draft", es: "Nuevo / Borrador", cls: "bg-[var(--pd-navy-900)] text-white", num: "text-white" },
  { key: "field", en: "Field capture", es: "Captura en campo", cls: "bg-[var(--pd-gray-100)] text-[var(--pd-navy-900)]", num: "" },
  { key: "missing", en: "Missing info", es: "Falta información", cls: "bg-[#FFEDD5] text-[#9A3412]", num: "" },
  { key: "review", en: "Office review", es: "Revisión de oficina", cls: "bg-[#E0E7FF] text-[#1E3A8A]", num: "" },
  { key: "ready", en: "Ready to submit", es: "Listo para presentar", cls: "bg-[var(--pd-gray-100)] text-[var(--pd-navy-900)]", num: "" },
  { key: "submitted", en: "Submitted", es: "Presentado", cls: "bg-[#EDE9FE] text-[#5B21B6]", num: "" },
  { key: "corrections", en: "Corrections", es: "Correcciones", cls: "bg-[#FEE2E2] text-[#991B1B]", num: "" },
  { key: "approved", en: "Approved", es: "Aprobado", cls: "bg-[#DCFCE7] text-[#166534]", num: "" },
] as const;
export type StageKey = (typeof PIPELINE)[number]["key"];

export type DashJob = { id: string; tracking: string; customer: string; addr: string; type: string; tech: string; stage: StageKey; updated: string; href?: string };
export type DashData = {
  user: { name: string; role: string };
  /** null = not known from what the office can see (tech-side drafts live on the phones until sent). */
  counts: Record<StageKey, number | null>;
  jobs: DashJob[];
  notes: { tone: "orange" | "amber" | "green" | "violet"; title: string; detail: string }[];
  schedule: { time: string; title: string; detail: string }[];
  months: { label: string; jobs: number; approved: number }[];
};

const STATUS_PILL: Record<StageKey, string> = {
  draft: "bg-[var(--pd-gray-100)] text-[var(--pd-navy-900)]", field: "bg-[var(--pd-gray-100)] text-[var(--pd-gray-700)]", missing: "bg-[#FFEDD5] text-[#9A3412]",
  review: "bg-[#E0E7FF] text-[#1E3A8A]", ready: "bg-[#E0F2FE] text-[#075985]", submitted: "bg-[#EDE9FE] text-[#5B21B6]", corrections: "bg-[#FEE2E2] text-[#991B1B]", approved: "bg-[#DCFCE7] text-[#166534]",
};

export const SAMPLE: DashData = {
  user: { name: "Dana K.", role: "Office admin" },
  counts: { draft: 6, field: 9, missing: 4, review: 8, ready: 7, submitted: 11, corrections: 3, approved: 26 },
  jobs: [
    { id: "1187", tracking: "PD-1187", customer: "Sample customer", addr: "1187 Oak St, Pasadena", type: "Heat pump change-out", tech: "Luis M.", stage: "review", updated: "Nov 24, 9:47 AM", href: "/demo/office-review" },
    { id: "10482", tracking: "PD-2026-10482", customer: "Marcus Reyes", addr: "4412 Alder Ct, Sacramento", type: "Heat pump change-out", tech: "J. Diaz", stage: "review", updated: "Nov 23, 10:14 AM" },
    { id: "10481", tracking: "PD-2026-10481", customer: "Rivera Properties", addr: "7 Demo Ln, Roseville", type: "Gas furnace install", tech: "M. Torres", stage: "missing", updated: "Nov 23, 9:41 AM" },
    { id: "10480", tracking: "PD-2026-10480", customer: "Lisa Hammond", addr: "92 Maple Ct, Folsom", type: "Ductless mini-split", tech: "C. Ramirez", stage: "submitted", updated: "Nov 22, 4:37 PM" },
    { id: "10479", tracking: "PD-2026-10479", customer: "Pinecrest Builders", addr: "1188 Oak Ridge Dr, Elk Grove", type: "New construction HVAC", tech: "J. Shaw", stage: "approved", updated: "Nov 22, 2:19 PM" },
    { id: "10478", tracking: "PD-2026-10478", customer: "David Chen", addr: "5531 Granite Way, Rocklin", type: "AC system replacement", tech: "E. Brooks", stage: "ready", updated: "Nov 21, 5:02 PM" },
    { id: "10477", tracking: "PD-2026-10477", customer: "Ana Morales", addr: "310 Birch St, Davis", type: "Heat pump change-out", tech: "J. Diaz", stage: "corrections", updated: "Nov 21, 1:12 PM" },
    { id: "10476", tracking: "PD-2026-10476", customer: "Glen Park HOA", addr: "18 Cedar Loop, Lincoln", type: "Rooftop unit swap", tech: "M. Torres", stage: "field", updated: "Nov 21, 9:30 AM" },
  ],
  notes: [
    { tone: "orange", title: "Missing information", detail: "PD-2026-10481 · equipment specs needed" },
    { tone: "amber", title: "New packet with 1 conflict", detail: "PD-1187 · panel rating 100 A vs 125 A" },
    { tone: "green", title: "Permit approved", detail: "PD-2026-10479 · recorded by the office" },
    { tone: "violet", title: "Inspection scheduled", detail: "PD-2026-10476 · Dec 2 at 9:00 AM" },
  ],
  schedule: [
    { time: "8:00 AM", title: "Job site · PD-2026-10483", detail: "2109 Valley View Dr" },
    { time: "10:30 AM", title: "Inspection · PD-2026-10479", detail: "1188 Oak Ridge Dr" },
    { time: "3:30 PM", title: "Office review · 3 jobs", detail: "Finish review and request signatures" },
  ],
  months: [{ label: "Jul", jobs: 52, approved: 34 }, { label: "Aug", jobs: 61, approved: 41 }, { label: "Sep", jobs: 55, approved: 39 }, { label: "Oct", jobs: 70, approved: 48 }, { label: "Nov", jobs: 84, approved: 62 }],
};

const TONE = { orange: "bg-[#EA580C]", amber: "bg-[#D97706]", green: "bg-[#16A34A]", violet: "bg-[#7C3AED]" } as const;

function Kpi({ label, value, sub, dark }: { label: string; value: string; sub: string; dark?: boolean }) {
  return (
    <div className={`flex min-h-[118px] min-w-0 flex-col gap-1 rounded-[16px] border p-3.5 ${dark ? "border-transparent bg-[var(--pd-navy-900)] text-white" : "border-[var(--pd-gray-200)] bg-white"}`}>
      <p className={`text-[13px] font-bold ${dark ? "text-white" : "text-[var(--pd-navy-900)]"}`}>{label}</p>
      <p className="font-display text-[28px] font-bold leading-none tracking-[-0.02em]">{value}</p>
      <p className={`mt-auto text-[12px] ${dark ? "text-[#C9D2E0]" : "text-[var(--pd-gray-600)]"}`}>{sub}</p>
    </div>
  );
}

function Donut({ counts }: { counts: DashData["counts"] }) {
  const { t } = useLang();
  const parts = [
    { k: "approved", c: "#16A34A", n: counts.approved ?? 0, l: t("Approved", "Aprobado") },
    { k: "submitted", c: "#7C3AED", n: counts.submitted ?? 0, l: t("Submitted", "Presentado") },
    { k: "review", c: "#2563EB", n: counts.review ?? 0, l: t("Office review", "Revisión de oficina") },
    { k: "missing", c: "#EA580C", n: counts.missing ?? 0, l: t("Missing info", "Falta información") },
    { k: "other", c: "#94A3B8", n: (counts.draft ?? 0) + (counts.field ?? 0) + (counts.ready ?? 0) + (counts.corrections ?? 0), l: t("Draft and other", "Borrador y otros") },
  ];
  const total = parts.reduce((a, p) => a + p.n, 0);
  let acc = 0;
  const stops = total ? parts.map((p) => { const a = (acc / total) * 360; acc += p.n; return `${p.c} ${a}deg ${(acc / total) * 360}deg`; }).join(",") : "#E5E7EB 0deg 360deg";
  return (
    <div className="flex items-center gap-6">
      <div className="relative size-[132px] shrink-0 rounded-full" style={{ background: `conic-gradient(${stops})` }} role="img" aria-label={parts.map((p) => `${p.l} ${p.n}`).join(", ")}>
        <div className="absolute inset-[22px] grid place-items-center rounded-full bg-white text-center">
          <div><p className="font-display text-[26px] font-bold leading-none">{total}</p><p className="text-[12px] text-[var(--pd-gray-600)]">{t("permits", "permisos")}</p></div>
        </div>
      </div>
      <ul className="flex flex-col gap-1.5 text-[13px]">{parts.map((p) => <li key={p.k} className="flex items-center gap-2"><span aria-hidden className="size-2.5 rounded-full" style={{ background: p.c }} />{p.l} {p.n}</li>)}</ul>
    </div>
  );
}

function Bars({ months }: { months: DashData["months"] }) {
  const { t } = useLang();
  const max = Math.max(1, ...months.map((m) => m.jobs));
  return (
    <div>
      <div className="flex h-[150px] items-end gap-4" role="img" aria-label={months.map((m) => `${m.label}: ${m.jobs} ${t("jobs", "trabajos")}, ${m.approved} ${t("approved", "aprobados")}`).join("; ")}>
        {months.map((m) => (
          <div key={m.label} className="flex flex-1 flex-col items-center gap-1.5">
            <div className="flex h-[128px] w-full items-end justify-center gap-1">
              <div className="w-1/2 max-w-[28px] rounded-t-[4px] bg-[var(--pd-navy-900)]" style={{ height: `${(m.jobs / max) * 100}%` }} />
              <div className="w-1/2 max-w-[28px] rounded-t-[4px] bg-[#EA580C]" style={{ height: `${(m.approved / max) * 100}%` }} />
            </div>
            <span className="text-[12px] text-[var(--pd-gray-600)]">{m.label}</span>
          </div>
        ))}
      </div>
      <p className="mt-2 flex gap-4 text-[12px] text-[var(--pd-gray-700)]"><span className="flex items-center gap-1.5"><span aria-hidden className="size-2.5 bg-[var(--pd-navy-900)]" />{t("Jobs sent", "Trabajos enviados")}</span><span className="flex items-center gap-1.5"><span aria-hidden className="size-2.5 bg-[#EA580C]" />{t("Approved", "Aprobados")}</span></p>
    </div>
  );
}

export function OfficeDashboard({ data, sample, loading }: { data: DashData; sample?: boolean; loading?: boolean }) {
  const { t, lang } = useLang();
  const [stage, setStage] = useState<StageKey | null>(null);
  const n = (k: StageKey) => data.counts[k];
  const show = (v: number | null) => (v === null ? "—" : String(v));
  const active = PIPELINE.reduce((a, s) => a + (s.key === "approved" ? 0 : n(s.key) ?? 0), 0);
  const jobs = stage ? data.jobs.filter((j) => j.stage === stage) : data.jobs;
  const hour = new Date().getHours();
  const hello = hour < 12 ? t("Good morning", "Buenos días") : hour < 18 ? t("Good afternoon", "Buenas tardes") : t("Good evening", "Buenas noches");
  const first = data.user.name.split(" ")[0];
  const stageName = (k: StageKey) => { const s = PIPELINE.find((p) => p.key === k)!; return t(s.en, s.es); };

  const rail = (
    <>
      <OfficeCard title={<>{t("Notifications", "Avisos")} <span className="ml-1 rounded-full bg-[#FEE2E2] px-2 py-0.5 text-[12px] text-[#991B1B]">{data.notes.length}</span></>}>
        {data.notes.length === 0 ? <p className="text-[14px] text-[var(--pd-gray-600)]">{t("Nothing new.", "Nada nuevo.")}</p> : (
          <ul className="flex flex-col gap-3">{data.notes.map((x, i) => <li key={i} className="flex gap-2.5"><span aria-hidden className={`mt-1.5 size-2.5 shrink-0 rounded-full ${TONE[x.tone]}`} /><div><p className="text-[14px] font-bold">{x.title}</p><p className="text-[12px] text-[var(--pd-gray-600)]">{x.detail}</p></div></li>)}</ul>
        )}
      </OfficeCard>
      <OfficeCard title={t("Quick actions", "Acciones rápidas")}>
        <div className="grid grid-cols-3 gap-2">
          <Link to={(sample ? "/demo/new" : "/new") as never} className="grid min-h-[64px] place-items-center rounded-[10px] bg-[var(--pd-orange-700)] px-2 text-center text-[13px] font-bold text-white hover:bg-[var(--pd-orange-800)]">{t("+ New job", "+ Nuevo trabajo")}</Link>
          {[["/customers", "Add customer", "Agregar cliente"], ["/office-handoff", "Find a job", "Buscar trabajo"], ["/documents", "Upload docs", "Subir documentos"], ["/inspections", "Inspections", "Inspecciones"], ["/office-setup", "Team & settings", "Equipo y ajustes"]].map(([to, en, es]) => (
            <Link key={to} to={to as never} className="grid min-h-[64px] place-items-center rounded-[10px] border border-[var(--pd-gray-200)] px-2 text-center text-[13px] font-semibold text-[var(--pd-navy-900)] hover:bg-[var(--pd-gray-50)]">{t(en, es)}</Link>
          ))}
        </div>
      </OfficeCard>
      <OfficeCard title={t("Today's schedule", "Agenda de hoy")}>
        {data.schedule.length === 0 ? <p className="text-[14px] text-[var(--pd-gray-600)]">{t("Nothing scheduled today.", "Nada programado hoy.")}</p> : (
          <ul className="flex flex-col gap-3">{data.schedule.map((s, i) => <li key={i} className="grid grid-cols-[72px_1fr] gap-2"><span className="text-[13px] font-bold text-[var(--pd-orange-700)]">{s.time}</span><div><p className="text-[14px] font-bold">{s.title}</p><p className="text-[12px] text-[var(--pd-gray-600)]">{s.detail}</p></div></li>)}</ul>
        )}
      </OfficeCard>
    </>
  );

  return (
    <OfficeShell active="dashboard" user={data.user} sample={sample} rail={rail}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[28px] font-bold leading-tight tracking-[-0.02em] !text-[var(--pd-navy-900)]" suppressHydrationWarning>{hello}, {first}</h1>
          <p className="text-[15px] text-[var(--pd-gray-700)]">{sample ? t("Sample data: nothing here is a real job.", "Datos de muestra: nada aquí es un trabajo real.") : t("Here is what is happening with your permit packets today.", "Esto es lo que pasa hoy con sus paquetes de permiso.")}</p>
        </div>
        <p className="rounded-[10px] border border-[var(--pd-gray-200)] bg-white px-3 py-2 text-[14px] font-semibold" suppressHydrationWarning>{new Date().toLocaleDateString(lang === "es" ? "es-US" : "en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric" })}</p>
      </div>
      {loading && <p role="status" className="text-[14px] text-[var(--pd-gray-600)]">{t("Loading your company's packets…", "Cargando los paquetes de su empresa…")}</p>}

      <section aria-label={t("Key numbers", "Cifras clave")} className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <Kpi dark label={t("Active jobs", "Trabajos activos")} value={String(active)} sub={t("Not yet approved", "Aún no aprobados")} />
        <Kpi label={t("Office review", "Revisión de oficina")} value={show(n("review"))} sub={t("Waiting on you", "Esperándole")} />
        <Kpi label={t("Missing info", "Falta información")} value={show(n("missing"))} sub={t("Asked of the tech", "Pedido al técnico")} />
        <Kpi label={t("Ready to submit", "Listo para presentar")} value={show(n("ready"))} sub={t("Signed by the contractor", "Firmado por el contratista")} />
        <Kpi label={t("Submitted", "Presentado")} value={show(n("submitted"))} sub={t("Recorded by the office", "Anotado por la oficina")} />
        {hasFeature("revenue")
          ? <Kpi dark label={t("Revenue (MTD)", "Ingresos (mes)")} value="—" sub={t("From paid invoices", "De facturas pagadas")} />
          : <Kpi dark label={t("Approved", "Aprobado")} value={show(n("approved"))} sub={t("Recorded by the office", "Anotado por la oficina")} />}
      </section>

      <OfficeCard title={t("Permit workflow pipeline", "Flujo de permisos")} action={<span className="text-[13px] text-[var(--pd-gray-600)]">{stage ? <button type="button" onClick={() => setStage(null)} className="font-semibold text-[var(--pd-orange-700)] underline">{t("Show all stages", "Mostrar todas las etapas")}</button> : t("Tap a stage to filter jobs", "Toque una etapa para filtrar")}</span>}>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
          {PIPELINE.map((s) => (
            <button key={s.key} type="button" onClick={() => setStage(stage === s.key ? null : s.key)} aria-pressed={stage === s.key}
              className={`flex min-h-[78px] min-w-0 flex-col justify-between rounded-[12px] p-2.5 text-left ${s.cls} ${stage === s.key ? "ring-[3px] ring-[var(--pd-orange-700)]" : ""}`}>
              <span className="text-[12px] font-bold leading-tight [overflow-wrap:anywhere]">{t(s.en, s.es)}</span>
              <span className="font-display text-[24px] font-bold leading-none">{show(n(s.key))}</span>
            </button>
          ))}
        </div>
        {!sample && <p className="mt-3 text-[12px] text-[var(--pd-gray-600)]">{t("— means not known yet: drafts stay on the technician's phone until they are sent.", "— significa que aún no se sabe: los borradores se quedan en el teléfono del técnico hasta que se envían.")}</p>}
      </OfficeCard>

      <OfficeCard title={t("Recent jobs & permits", "Trabajos y permisos recientes")} action={<Link to="/office-handoff" className="rounded-[10px] border border-[var(--pd-gray-200)] px-3 py-2 text-[14px] font-semibold hover:bg-[var(--pd-gray-50)]">{t("Show all", "Ver todo")}</Link>}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] text-left text-[13px]">
            <thead><tr className="border-b border-[var(--pd-gray-200)] text-[13px] text-[var(--pd-gray-700)]">{[t("Tracking #", "N.º de seguimiento"), t("Customer", "Cliente"), t("Address", "Dirección"), t("Project type", "Tipo de proyecto"), t("Tech", "Técnico"), t("Status", "Estado"), t("Last update", "Última actualización")].map((h) => <th key={h} scope="col" className="px-2 py-2.5 font-semibold">{h}</th>)}</tr></thead>
            <tbody>
              {jobs.length === 0 && <tr><td colSpan={7} className="px-2 py-6 text-center text-[var(--pd-gray-600)]">{stage ? t("No jobs in this stage.", "No hay trabajos en esta etapa.") : t("No packets have been sent to your office yet.", "Todavía no se han enviado paquetes a su oficina.")}</td></tr>}
              {jobs.map((j) => (
                <tr key={j.id} className="border-b border-[var(--pd-gray-100)] last:border-0">
                  <td className="whitespace-nowrap px-2 py-3 font-bold">{j.href ? <Link to={j.href as never} className="text-[var(--pd-orange-700)] underline-offset-2 hover:underline">{j.tracking}</Link> : <span className="text-[var(--pd-orange-700)]">{j.tracking}</span>}</td>
                  <td className="px-2 py-3 font-semibold">{j.customer}</td>
                  <td className="px-2 py-3">{j.addr}</td>
                  <td className="px-2 py-3">{j.type}</td>
                  <td className="px-2 py-3"><span className="flex items-center gap-2"><span aria-hidden className="grid size-7 shrink-0 place-items-center rounded-full bg-[var(--pd-navy-900)] text-[11px] font-bold text-white">{j.tech.split(/[\s.]+/).filter(Boolean).map((w) => w[0]).join("").slice(0, 2)}</span>{j.tech}</span></td>
                  <td className="px-2 py-3"><span className={`whitespace-nowrap rounded-[6px] px-2 py-1 text-[13px] font-semibold ${STATUS_PILL[j.stage]}`}>{stageName(j.stage)}</span></td>
                  <td className="whitespace-nowrap px-2 py-3 text-[var(--pd-gray-700)]">{j.updated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </OfficeCard>

      <div className="grid gap-5 min-[1200px]:grid-cols-2">
        <OfficeCard title={t("Permit status overview", "Resumen de estados")}><Donut counts={data.counts} /></OfficeCard>
        <OfficeCard title={t("Monthly activity", "Actividad mensual")}><Bars months={data.months} /></OfficeCard>
      </div>
    </OfficeShell>
  );
}

/** Live data: the signed-in office's own packets (row level security decides what comes back). */
export function useOfficeDashboard(): { data: DashData | null; state: "loading" | "ready" | "signed-out" | "no-company" } {
  const [out, setOut] = useState<{ data: DashData | null; state: "loading" | "ready" | "signed-out" | "no-company" }>({ data: null, state: "loading" });
  useEffect(() => {
    let live = true;
    (async () => {
      const { data: s } = await backend.auth.getSession();
      const email = s.session?.user.email?.toLowerCase();
      if (!email) { if (live) setOut({ data: null, state: "signed-out" }); return; }
      const { data: m } = await backend.from("company_members").select("role, company_id").eq("email", email).maybeSingle();
      if (!m?.company_id) { if (live) setOut({ data: null, state: "no-company" }); return; }
      const [pk, crm, corr] = await Promise.all([
        backend.from("office_packets").select("id, job_id, tracking_no, sent_by_name, sent_at, captured_fields, office_received_at").eq("company_id", m.company_id).order("sent_at", { ascending: false }).limit(200),
        backend.from("packet_crm").select("packet_id, stage, updated_at").eq("company_id", m.company_id),
        backend.from("correction_requests").select("packet_id").eq("company_id", m.company_id),
      ]);
      const stageOf = new Map((crm.data ?? []).map((c) => [String(c.packet_id), String(c.stage)]));
      const asked = new Set((corr.data ?? []).map((c) => String(c.packet_id)));
      const toStage = (id: string): StageKey => {
        const st = stageOf.get(id) ?? "new";
        if (st === "approved" || st === "inspection" || st === "closed") return "approved";
        if (st === "submitted") return "submitted";
        if (asked.has(id)) return "missing";
        if (st === "preparing") return "ready";
        return "review";
      };
      const fmt = (iso: string) => new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
      const jobs: DashJob[] = (pk.data ?? []).map((p) => {
        const v = ((p.captured_fields as { values?: Record<string, string> } | null)?.values ?? {});
        return { id: String(p.id), tracking: String(p.tracking_no ?? p.job_id), customer: v.name || "—", addr: [v.addr, v.city].filter(Boolean).join(", ") || "—", type: v.type || "—", tech: String(p.sent_by_name ?? "—"), stage: toStage(String(p.id)), updated: fmt(String(p.sent_at)), href: `/office-review/${p.id}` };
      });
      const counts = Object.fromEntries(PIPELINE.map((s) => [s.key, jobs.filter((j) => j.stage === s.key).length])) as Record<StageKey, number | null>;
      counts.draft = null; counts.field = null; counts.corrections = null;
      const now = new Date();
      const months = [4, 3, 2, 1, 0].map((back) => {
        const d = new Date(now.getFullYear(), now.getMonth() - back, 1);
        const inMonth = (iso: string) => { const x = new Date(iso); return x.getFullYear() === d.getFullYear() && x.getMonth() === d.getMonth(); };
        const sent = (pk.data ?? []).filter((p) => inMonth(String(p.sent_at)));
        return { label: d.toLocaleDateString("en-US", { month: "short" }), jobs: sent.length, approved: sent.filter((p) => toStage(String(p.id)) === "approved").length };
      });
      const notes = jobs.filter((j) => j.stage === "review").slice(0, 4).map((j) => ({ tone: "amber" as const, title: "New packet to review", detail: `${j.tracking} · ${j.addr}` }));
      const name = (s.session?.user.user_metadata?.full_name as string | undefined) || email.split("@")[0];
      if (live) setOut({ state: "ready", data: { user: { name, role: m.role === "admin" ? "Office admin" : "Office" }, counts, jobs: jobs.slice(0, 8), notes, schedule: [], months } });
    })().catch(() => { if (live) setOut({ data: null, state: "no-company" }); });
    return () => { live = false; };
  }, []);
  return out;
}
