import { Link } from "@tanstack/react-router";
import { Bell, BookOpen, CalendarClock, ClipboardCheck, FileText, FolderOpen, HardHat, LayoutDashboard, Plus, Receipt, Search, Settings, UserPlus, Users, Wrench, Zap, BarChart3, Briefcase } from "lucide-react";
import { useLang } from "../../lib/lang";
import { hasFeature, type Parked } from "../../lib/plan";

type Item = { to: string; icon: typeof Briefcase; en: string; es: string; parked?: Parked; key: string };
const ITEMS: Item[] = [
  { key: "dashboard", to: "/office", icon: LayoutDashboard, en: "Dashboard", es: "Panel" },
  { key: "jobs", to: "/office-handoff", icon: Briefcase, en: "Jobs & permits", es: "Trabajos y permisos" },
  { key: "customers", to: "/customers", icon: Users, en: "Customers", es: "Clientes" },
  { key: "leads", to: "/leads", icon: UserPlus, en: "Leads", es: "Prospectos", parked: "leads" },
  { key: "technicians", to: "/technicians", icon: HardHat, en: "Technicians", es: "Técnicos" },
  { key: "dispatch", to: "/dispatch", icon: CalendarClock, en: "Dispatch & Schedule", es: "Despacho y agenda", parked: "dispatch" },
  { key: "documents", to: "/documents", icon: FolderOpen, en: "Documents", es: "Documentos" },
  { key: "equipment", to: "/equipment", icon: Wrench, en: "Equipment", es: "Equipo" },
  { key: "inspections", to: "/inspections", icon: ClipboardCheck, en: "Inspections", es: "Inspecciones" },
  { key: "invoices", to: "/invoices", icon: Receipt, en: "Invoices & Billing", es: "Facturas y cobros", parked: "invoices" },
  { key: "reports", to: "/reports", icon: BarChart3, en: "Reports", es: "Reportes" },
  { key: "automation", to: "/office", icon: Zap, en: "Automation", es: "Automatización", parked: "automation" },
  { key: "resources", to: "/resources", icon: BookOpen, en: "Resources", es: "Recursos" },
  { key: "settings", to: "/office-setup", icon: Settings, en: "Company settings", es: "Ajustes de la empresa" },
];

/**
 * The office portal frame, desktop-first (docs/design/mockups/OfficeDashboard.dc.html): navy sidebar and top bar, a wide
 * main column, and a right rail at 1200px and up. Below 1024px the sidebar becomes a scrolling row of links.
 */
export function OfficeShell({ active, user, sample, children, rail }: { active: string; user: { name: string; role: string }; sample?: boolean; children: React.ReactNode; rail?: React.ReactNode }) {
  const { t, lang, setLang } = useLang();
  const items = ITEMS.filter((i) => !i.parked || hasFeature(i.parked));
  const initials = user.name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "PD";
  return (
    <div className="pd-ui min-h-screen bg-[var(--pd-gray-50)] text-[var(--pd-ink)] lg:grid lg:grid-cols-[232px_minmax(0,1fr)]">
      <aside className="bg-[var(--pd-navy-900)] text-white">
        <div className="lg:sticky lg:top-0 lg:max-h-screen lg:overflow-y-auto">
        <div className="flex h-16 items-center gap-2.5 px-5">
          <img src="/generated-assets/company-logo-white.png" alt="" className="size-8" />
          <span className="font-display text-[20px] font-bold tracking-[-0.01em]">PermitDraft</span>
        </div>
        {sample && <p className="mx-4 mb-2 rounded-full bg-[var(--pd-orange-700)] px-3 py-1 text-center text-[12px] font-bold uppercase tracking-[0.06em]">{t("Sample data", "Datos de muestra")}</p>}
        <nav aria-label={t("Office", "Oficina")} className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-visible">
          {items.map((i) => {
            const on = i.key === active;
            return (
              <Link key={i.key} to={(sample && i.key === "dashboard" ? "/demo/office" : i.to) as never} aria-current={on ? "page" : undefined}
                className={`pd-dark flex min-h-11 shrink-0 items-center gap-3 rounded-[10px] px-3 text-[15px] font-semibold ${on ? "bg-[var(--pd-orange-700)] text-white" : "text-[#C9D2E0] hover:bg-[#13264A] hover:text-white"}`}>
                <i.icon size={18} aria-hidden />{t(i.en, i.es)}
              </Link>
            );
          })}
        </nav>
        </div>
      </aside>
      <div className="min-w-0">
        <header className="pd-dark sticky top-0 z-20 flex h-16 items-center gap-3 bg-[var(--pd-navy-900)] px-4 text-white lg:px-6">
          <label className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-[10px] bg-white px-3 text-[var(--pd-ink)]">
            <Search size={16} aria-hidden className="text-[var(--pd-gray-600)]" />
            <span className="sr-only">{t("Search jobs", "Buscar trabajos")}</span>
            <input type="search" placeholder={t("Search jobs, addresses, tracking #…", "Buscar trabajos, direcciones, n.º de seguimiento…")} className="min-w-0 flex-1 bg-transparent text-[14px] outline-none placeholder:text-[var(--pd-gray-600)]"
              onKeyDown={(e) => { if (e.key === "Enter") window.location.href = `/office-handoff?q=${encodeURIComponent((e.target as HTMLInputElement).value)}`; }} />
          </label>
          <Link to={(sample ? "/demo/new" : "/new") as never} className="hidden h-10 items-center gap-1.5 rounded-[10px] bg-[var(--pd-orange-700)] px-4 text-[14px] font-bold text-white hover:bg-[var(--pd-orange-800)] sm:flex"><Plus size={16} aria-hidden />{t("New job", "Nuevo trabajo")}</Link>
          <button type="button" onClick={() => setLang(lang === "es" ? "en" : "es")} className="h-10 rounded-[10px] border border-[#2A3F63] px-3 text-[13px] font-bold">{lang === "es" ? "English" : "Español"}</button>
          <span className="grid size-10 place-items-center rounded-[10px] bg-[#13264A]" aria-hidden><Bell size={18} /></span>
          <div className="hidden items-center gap-2.5 md:flex">
            <span aria-hidden className="grid size-9 place-items-center rounded-full bg-[var(--pd-orange-700)] text-[13px] font-bold">{initials}</span>
            <div className="leading-tight"><p className="text-[14px] font-bold">{user.name}</p><p className="text-[12px] text-[#C9D2E0]">{user.role}</p></div>
          </div>
        </header>
        <div className="grid gap-5 p-4 lg:p-6 min-[1200px]:grid-cols-[minmax(0,1fr)_300px]">
          <main className="flex min-w-0 flex-col gap-5">{children}</main>
          {rail && <aside className="flex flex-col gap-5">{rail}</aside>}
        </div>
        <footer className="px-6 pb-6 text-[13px] text-[var(--pd-gray-600)]">
          {t("PermitDraft prepares documentation for contractor review. It does not file permits or guarantee compliance.", "PermitDraft prepara documentación para revisión del contratista. No presenta permisos ni garantiza el cumplimiento.")}
          {" "}<Link to="/coverage" className="font-semibold text-[var(--pd-orange-700)] underline">{t("What PermitDraft covers", "Qué cubre PermitDraft")}</Link>
        </footer>
      </div>
    </div>
  );
}

export function OfficeCard({ title, action, children, className = "" }: { title?: React.ReactNode; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-[16px] border border-[var(--pd-gray-200)] bg-white p-5 ${className}`}>
      {(title || action) && <div className="mb-4 flex items-center justify-between gap-3">{title && <h2 className="font-display text-[17px] font-bold text-[var(--pd-navy-900)]">{title}</h2>}{action}</div>}
      {children}
    </section>
  );
}

export { FileText };
