import { Link, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { ClipboardCheck, FolderOpen, Wrench, BookOpen, CalendarClock, HardHat, Briefcase, ChevronDown, Ellipsis, FilePlus2, FileText, Home, Plus, Inbox, LayoutDashboard, Menu, Send, Settings, UserRound, UserPlus, Users, X } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import { Image } from "../image";
import { useLang } from "../lib/lang";
import { DemoBar, useCorePath, useDemo } from "./demo";
import "../app.css";

type NavLink = { label: string; to: string; hash?: string };
type NavGroup = { label: string; note?: string; price?: [string, string, string]; links: NavLink[] };
/** The public site's menu groups: each opens an existing section or page. */
function useNavGroups(): NavGroup[] {
  const { t } = useLang();
  return [
    { label: t("Features", "Funciones"), links: [
      { label: t("Benefits", "Beneficios"), to: "/", hash: "features" },
      { label: t("What PermitDraft covers", "Qué cubre PermitDraft"), to: "/coverage" },
    ] },
    { label: t("How It Works", "Cómo funciona"), links: [
      { label: t("The five-step workflow", "El flujo de cinco pasos"), to: "/", hash: "how" },
      { label: t("Sample permit draft", "Borrador de permiso de muestra"), to: "/sample-job" },
      { label: t("Sample office handoff", "Entrega a oficina de muestra"), to: "/demo/office-handoff" },
    ] },
    { label: t("Try It", "Pruébelo"), links: [
      { label: t("Try Free Demo", "Probar la demo gratis"), to: "/demo" },
      { label: t("Early Access", "Acceso anticipado"), to: "/early-access" },
    ] },
    { label: t("Resources", "Recursos"), links: [
      { label: t("About PermitDraft", "Acerca de PermitDraft"), to: "/about" },
      { label: t("Official resources", "Recursos oficiales"), to: "/resources" },
      { label: t("HVAC permits", "Permisos de HVAC"), to: "/hvac-permits" },
      { label: t("Heat pump paperwork checklist", "Lista de papeleo de bomba de calor"), to: "/heat-pump-paperwork-checklist" },
    ] },
  ];
}

function PublicNav({ home }: { home?: boolean }) {
  const { t } = useLang();
  const groups = useNavGroups();
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="hp-nav" aria-label={home ? t("Home page", "Página de inicio") : t("Main", "Principal")}>
      <Link to="/" activeOptions={{ exact: true, includeHash: false }}>{t("Home", "Inicio")}</Link>
      {groups.map((g) => (
        <DropdownMenu key={g.label} modal={false}>
          <DropdownMenuTrigger className="hp-nav-trigger" data-current={path === "/early-access" && g.links.some((l) => l.to === "/early-access") ? "true" : undefined}>{g.label}<ChevronDown size={16} aria-hidden /></DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="hp-nav-menu">
            {g.links.map((l) => (
              <DropdownMenuItem key={l.label} asChild><Link to={l.to as never} hash={l.hash}>{l.label}</Link></DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ))}
      <Link to="/sign-in" className="hp-nav-login">{t("Log In", "Iniciar sesión")}</Link>
      <Link to="/demo" className="hp-nav-cta">{t("Try Free Demo", "Probar la demo gratis")}</Link>
    </nav>
  );
}

/** Phones: one Menu button at the top opens the same groups, each folding open. */
function PublicNavPhone({ home }: { home?: boolean }) {
  const { t } = useLang();
  const groups = useNavGroups();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return (
    <div className="hp-mnav">
      <div className="hp-mnav-bar">
        <button type="button" className="hp-mnav-toggle" aria-expanded={open} aria-controls="hp-mnav-panel" onClick={() => setOpen(!open)} data-testid="phone-menu">
          {open ? <X size={20} aria-hidden /> : <Menu size={20} aria-hidden />}{t("Menu", "Menú")}
        </button>
        <Link to="/sign-in" className="hp-mnav-login">{t("Log In", "Iniciar sesión")}</Link>
        <Link to="/demo" className="hp-nav-cta">{t("Try Free Demo", "Probar la demo gratis")}</Link>
      </div>
      {open && (
        <nav id="hp-mnav-panel" className="hp-mnav-panel" aria-label={home ? t("Home page", "Página de inicio") : t("Main", "Principal")}>
          <Link to="/" onClick={close} className="hp-mnav-home">{t("Home", "Inicio")}</Link>
          <Accordion type="single" collapsible>
            {groups.map((g) => (
              <AccordionItem key={g.label} value={g.label}>
                <AccordionTrigger className="hp-mnav-group">{g.label}</AccordionTrigger>
                <AccordionContent>
                  <ul className="hp-mnav-links">
                    {g.links.map((l) => <li key={l.label}><Link to={l.to as never} hash={l.hash} onClick={close}>{l.label}</Link></li>)}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </nav>
      )}
    </div>
  );
}

export function AppTop({ home, mode }: { home?: boolean; mode?: "demo" | "core" } = {}) {
  const { lang, setLang } = useLang();
  return (
    <div className={`ap-top${mode ? " ap-top-app" : ""}`}>
      <div className="ap-bar">
        <div className="ap-brand">
          <Link to="/" className="ap-logo">
            <Image src="/generated-assets/company-logo.png" alt="PermitDraft logo" width={32} height={32} />
            <span>PermitDraft</span>
          </Link>
          {mode && <span className={`ap-mode ${mode}`} data-testid="mode-label">{mode === "demo" ? "Demo" : "Core"}</span>}
        </div>
        {!mode && <PublicNav home={home} />}
        <div className="ap-lang" role="group" aria-label="Language">
          <button type="button" aria-pressed={lang === "en"} onClick={() => setLang("en")}>English</button>
          <button type="button" aria-pressed={lang === "es"} onClick={() => setLang("es")}>Español</button>
        </div>
      </div>
      {!mode && <PublicNavPhone home={home} />}
    </div>
  );
}

/** Phones and tablets: Home | Jobs | + New job | Permits | More, each opening a screen that exists. */
export function BottomBar({ current: _current }: { current?: "jobs" }) {
  const { t } = useLang();
  const demo = useDemo();
  const p = useCorePath();
  return (
    <nav className="ap-bottom" aria-label={t("App menu", "Menú de la aplicación")}>
      <Link to={p("/jobs")} activeOptions={{ exact: true, includeHash: false }} activeProps={{ className: "ap-tab is-active", "aria-current": "page" } as never} className="ap-tab" data-testid="nav-home">
        <Home size={22} aria-hidden />
        {t("Home", "Inicio")}
      </Link>
      <Link to={p("/jobs")} hash="job-list" className="ap-tab" data-testid="nav-jobs">
        <Briefcase size={22} aria-hidden />
        {t("Jobs", "Trabajos")}
      </Link>
      <Link to={p("/new")} className="ap-new" aria-label={t("New job", "Nuevo trabajo")} data-testid="nav-new">
        <span className="ap-new-dot" aria-hidden><Plus size={26} strokeWidth={2.5} /></span>
        <span className="ap-new-label">{t("New Job", "Nuevo")}</span>
      </Link>
      <Link to={p("/office-handoff")} className="ap-tab" activeProps={{ className: "ap-tab is-active", "aria-current": "page" } as never} data-testid="nav-permits">
        <FileText size={22} aria-hidden />
        {t("Permits", "Permisos")}
      </Link>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger className="ap-tab" data-testid="nav-more">
          <Ellipsis size={22} aria-hidden />
          {t("More", "Más")}
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="end" sideOffset={8} className="ap-more-menu">
          {!demo && <DropdownMenuItem asChild><Link to="/customers" data-testid="nav-customers-m"><Users size={18} aria-hidden />{t("Customers", "Clientes")}</Link></DropdownMenuItem>}
          {!demo && <DropdownMenuItem asChild><Link to="/leads" data-testid="nav-leads-m"><UserPlus size={18} aria-hidden />{t("Leads", "Prospectos")}</Link></DropdownMenuItem>}
          {!demo && <DropdownMenuItem asChild><Link to="/technicians" data-testid="nav-technicians-m"><HardHat size={18} aria-hidden />{t("Technicians", "Técnicos")}</Link></DropdownMenuItem>}
          {!demo && <DropdownMenuItem asChild><Link to="/dispatch" data-testid="nav-dispatch-m"><CalendarClock size={18} aria-hidden />{t("Dispatch & Schedule", "Despacho y agenda")}</Link></DropdownMenuItem>}
          {!demo && <DropdownMenuItem asChild><Link to="/documents" data-testid="nav-documents-m"><FolderOpen size={18} aria-hidden />{t("Documents", "Documentos")}</Link></DropdownMenuItem>}
          {!demo && <DropdownMenuItem asChild><Link to="/equipment" data-testid="nav-equipment-m"><Wrench size={18} aria-hidden />{t("Equipment", "Equipo")}</Link></DropdownMenuItem>}
          {!demo && <DropdownMenuItem asChild><Link to="/inspections" data-testid="nav-inspections-m"><ClipboardCheck size={18} aria-hidden />{t("Inspections", "Inspecciones")}</Link></DropdownMenuItem>}
          {!demo && <DropdownMenuItem asChild><Link to="/my-handoffs"><Send size={18} aria-hidden />{t("Sent to office", "Enviados a la oficina")}</Link></DropdownMenuItem>}
          <DropdownMenuItem asChild><Link to="/profile" data-testid="nav-account"><UserRound size={18} aria-hidden />{t("Account", "Cuenta")}</Link></DropdownMenuItem>
          <DropdownMenuItem asChild><Link to={p("/settings") as never} data-testid="nav-settings"><Settings size={18} aria-hidden />{t("Settings", "Ajustes")}</Link></DropdownMenuItem>
          <DropdownMenuItem asChild><Link to="/resources"><BookOpen size={18} aria-hidden />{t("Resources", "Recursos")}</Link></DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  );
}

/** Computer screens: the fixed navy sidebar of Core and the demo, listing only screens that exist. */
export function SideNav() {
  const { t } = useLang();
  const demo = useDemo();
  const p = useCorePath();
  const items: { to: string; icon: typeof Briefcase; label: string; exact?: boolean; testid?: string }[] = [
    { to: p("/jobs"), icon: LayoutDashboard, label: t("Jobs dashboard", "Panel de trabajos"), exact: true },
    { to: p("/new"), icon: FilePlus2, label: t("New job", "Nuevo trabajo") },
    { to: p("/office-handoff"), icon: Inbox, label: t("Office handoff", "Entrega a oficina") },
    ...(demo ? [] : [
      { to: "/customers", icon: Users, label: t("Customers", "Clientes") },
      { to: "/leads", icon: UserPlus, label: t("Leads", "Prospectos") },
      { to: "/technicians", icon: HardHat, label: t("Technicians", "Técnicos") },
      { to: "/dispatch", icon: CalendarClock, label: t("Dispatch & Schedule", "Despacho y agenda") },
      { to: "/documents", icon: FolderOpen, label: t("Documents", "Documentos") },
      { to: "/equipment", icon: Wrench, label: t("Equipment", "Equipo") },
      { to: "/inspections", icon: ClipboardCheck, label: t("Inspections", "Inspecciones") },
      { to: "/my-handoffs", icon: Send, label: t("Sent to office", "Enviados a la oficina") },
    ]),
    { to: "/resources", icon: BookOpen, label: t("Resources", "Recursos") },
    { to: "/profile", icon: UserRound, label: t("Account", "Cuenta") },
    { to: p("/settings"), icon: Settings, label: t("Settings", "Ajustes") },
  ];
  return (
    <aside className="ap-side" aria-label={t("App menu", "Menú de la aplicación")}>
      <Link to="/" className="ap-side-logo">
        <Image src="/generated-assets/company-logo.png" alt="PermitDraft logo" width={32} height={32} />
        <span>PermitDraft</span>
      </Link>
      <span className={`ap-mode ${demo ? "demo" : "core"}`}>{demo ? t("Demo · sample data", "Demo · datos de muestra") : "Core"}</span>
      <nav className="ap-side-nav">
        {items.map((i) => (
          <Link key={i.to} to={i.to as never} activeOptions={{ exact: !!i.exact }} activeProps={{ className: "is-active", "aria-current": "page" } as never}>
            <i.icon size={19} aria-hidden />{i.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}

export function AppPage({ children, bottom, wide, capture, home, core, footLinks }: { children: React.ReactNode; bottom?: boolean; wide?: boolean; capture?: boolean; home?: boolean; core?: boolean;
  /** Replaces the footer's two links on a screen that names its own (they must keep the same destinations). */
  footLinks?: React.ReactNode }) {
  const { t } = useLang();
  const demo = useDemo();
  return (
    <div className={`ap${capture ? " ap-capture" : ""}${demo || bottom || core ? " ap-has-side" : ""}`}>
      {(demo || bottom || core) && <SideNav />}
      <AppTop home={home} mode={demo ? "demo" : bottom || core ? "core" : undefined} />
      <main className={`${home ? "hp-main" : "ap-main"} ${bottom ? "has-bottom" : ""} ${wide ? "jb-main" : ""} ${capture ? "cx-main" : ""}`}>{demo && <DemoBar />}{children}</main>
      {(demo || bottom || core) && <footer className={`ap-foot ${bottom ? "has-bottom" : ""}`}>
        <p>{t("PermitDraft prepares documentation for contractor review. It does not file permits or guarantee compliance.", "PermitDraft prepara documentación para revisión del contratista. No presenta permisos ni garantiza el cumplimiento.")}</p>
        {footLinks ?? <>
        <Link to="/coverage" className="underline font-semibold">{t("What PermitDraft covers", "Qué cubre PermitDraft")}</Link>
        <Link to="/resources" className="underline font-semibold">{t("Official resources", "Recursos oficiales")}</Link>
        </>}
      </footer>}
      {bottom && <BottomBar current="jobs" />}
    </div>
  );
}
