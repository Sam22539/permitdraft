// Official resource directory (public links only). Shape follows the owner's state-links spec.
// A link is shown as an outbound resource ONLY when status is "verified" and it carries a url, page_title and checked_on
// that were really read. Everything else is shown as pending/not applicable/not found, never as a link.
// These links never feed permit eligibility or any legal check.
export type LinkStatus = "verified" | "unverified" | "not_applicable" | "not_found";
export type Stage = "setup" | "new_job" | "equipment" | "permit" | "install" | "close_out" | "money";
export type Category = "licensing" | "codes" | "refrigerant" | "consumer" | "incentives" | "permits" | "federal";
export type SourceType = "official_gov" | "official_program" | "industry" | "utility" | "secondary";

export type ResourceLink = {
  key: string; category: Category; url: string | null; page_title: string | null; agency: string | null;
  source_type: SourceType | null; status: LinkStatus; checked_on: string | null; volatile: boolean; notes: string;
  label_en: string; label_es: string; show_in_app_stage: Stage;
  note_en?: string; note_es?: string; tag_en?: string; tag_es?: string;
};
export type KeyDef = { key: string; category: Category; en: string; es: string; stage: Stage; volatile?: boolean };

export const DATASET_VERSION = 1;
export const GENERATED_ON = "2026-11-22";

export const FEDERAL_KEYS: KeyDef[] = [
  { key: "fed_epa_608", category: "federal", en: "EPA Section 608 technician certification", es: "Certificación de técnicos EPA Sección 608", stage: "equipment" },
  { key: "fed_epa_608_recordkeeping", category: "federal", en: "EPA refrigerant recordkeeping", es: "Registros de refrigerante de la EPA", stage: "close_out" },
  { key: "fed_epa_tech_transitions", category: "federal", en: "EPA Technology Transitions (HFC) actions", es: "Acciones de Transición Tecnológica (HFC) de la EPA", stage: "equipment", volatile: true },
  { key: "fed_epa_err", category: "federal", en: "EPA Emissions Reduction and Reclamation rule", es: "Regla de reducción de emisiones y reciclaje de la EPA", stage: "equipment", volatile: true },
  { key: "fed_doe_regional_standards", category: "federal", en: "DOE regional standards enforcement", es: "Cumplimiento de normas regionales del DOE", stage: "equipment" },
  { key: "fed_doe_ccms", category: "federal", en: "DOE Compliance Certification Database", es: "Base de certificación de cumplimiento del DOE", stage: "equipment" },
  { key: "fed_ecfr_430_32", category: "federal", en: "eCFR 10 CFR 430.32", es: "eCFR 10 CFR 430.32", stage: "equipment" },
  { key: "fed_ahri_directory", category: "federal", en: "AHRI certified product directory", es: "Directorio de productos certificados AHRI", stage: "equipment" },
  { key: "fed_ftc_cooling_off", category: "federal", en: "FTC Cooling-Off Rule", es: "Regla de cancelación de la FTC", stage: "money" },
  { key: "fed_irs_25c", category: "federal", en: "IRS home improvement energy credit", es: "Crédito de energía del IRS para mejoras del hogar", stage: "money", volatile: true },
  { key: "fed_doe_home_energy_rebates", category: "federal", en: "DOE Home Energy Rebates", es: "Reembolsos de energía del hogar del DOE", stage: "money", volatile: true },
  { key: "fed_energycodes_state_portal", category: "federal", en: "DOE Building Energy Codes state portal", es: "Portal estatal de códigos de energía del DOE", stage: "permit" },
  { key: "fed_icc_code_adoption", category: "federal", en: "ICC code adoption map", es: "Mapa de adopción de códigos ICC", stage: "permit" },
  { key: "fed_census_geocoder", category: "federal", en: "Census geocoder (address to county/city)", es: "Geocodificador del Censo (dirección a condado/ciudad)", stage: "setup" },
  { key: "fed_iecc_climate_zones", category: "federal", en: "IECC climate zone reference", es: "Referencia de zonas climáticas IECC", stage: "setup" },
  { key: "fed_energy_star_hvac", category: "federal", en: "ENERGY STAR central AC / heat pump finder", es: "Buscador ENERGY STAR de aire acondicionado / bomba de calor", stage: "equipment" },
  { key: "fed_dsire", category: "federal", en: "DSIRE incentives database", es: "Base de incentivos DSIRE", stage: "money", volatile: true },
];

const S = (key: string, category: Category, en: string, es: string, stage: Stage, volatile = false): KeyDef => ({ key, category, en, es, stage, volatile });
export const STATE_KEYS: KeyDef[] = [
  S("lic_agency", "licensing", "HVAC licensing agency", "Agencia de licencias de HVAC", "setup"),
  S("lic_lookup", "licensing", "Check a contractor license", "Verificar una licencia de contratista", "setup"),
  S("lic_types", "licensing", "License classifications", "Clasificaciones de licencia", "setup"),
  S("lic_apply", "licensing", "How to apply for a license", "Cómo solicitar una licencia", "setup"),
  S("lic_second_board", "licensing", "Second licensing board", "Segunda junta de licencias", "setup"),
  S("home_improvement_reg", "licensing", "Home improvement contractor registration", "Registro de contratistas de mejoras del hogar", "setup"),
  S("contractor_general_lic", "licensing", "General contractor license", "Licencia de contratista general", "setup"),
  S("biz_entity_search", "licensing", "Business entity search", "Búsqueda de entidades comerciales", "setup"),
  S("workers_comp_verify", "licensing", "Workers' comp verification", "Verificación de compensación laboral", "setup"),
  S("recovery_fund", "licensing", "Contractor recovery fund", "Fondo de recuperación de contratistas", "close_out"),
  S("local_licensing_note", "licensing", "Licensing is handled locally", "Las licencias se manejan localmente", "setup"),
  S("bldg_code_agency", "codes", "State building code agency", "Agencia estatal de códigos de construcción", "permit"),
  S("energy_code_current", "codes", "Current residential energy code", "Código de energía residencial vigente", "permit", true),
  S("energy_code_amendments", "codes", "Energy code amendments", "Enmiendas al código de energía", "permit", true),
  S("mech_code_current", "codes", "Adopted mechanical code", "Código mecánico adoptado", "permit", true),
  S("a2l_guidance", "codes", "A2L refrigerant guidance", "Guía sobre refrigerantes A2L", "equipment", true),
  S("duct_test_requirements", "codes", "Duct leakage testing requirements", "Requisitos de prueba de fugas en ductos", "install"),
  S("energy_forms", "codes", "Energy compliance forms", "Formularios de cumplimiento de energía", "permit"),
  S("third_party_registry", "codes", "Approved registry / verification program", "Registro / programa de verificación aprobado", "close_out"),
  S("equipment_listing_db", "codes", "State equipment certification database", "Base estatal de certificación de equipos", "equipment"),
  S("state_energy_office", "codes", "State energy office", "Oficina estatal de energía", "permit"),
  S("local_adoption_note", "codes", "Code adoption is local", "La adopción de códigos es local", "permit"),
  S("state_hfc_rule", "refrigerant", "State HFC regulation", "Regulación estatal de HFC", "equipment", true),
  S("state_hfc_ac_scope", "refrigerant", "State HFC scope for residential AC/HP", "Alcance estatal de HFC para AC/BC residencial", "equipment", true),
  S("state_env_agency", "refrigerant", "State environmental agency", "Agencia ambiental estatal", "equipment"),
  S("consumer_protection", "consumer", "Attorney General consumer protection", "Protección al consumidor del Fiscal General", "money"),
  S("home_solicitation_law", "consumer", "Home solicitation cancellation law", "Ley de cancelación de ventas a domicilio", "money"),
  S("contract_requirements", "consumer", "Required contract terms", "Términos de contrato requeridos", "money"),
  S("deposit_limit_law", "consumer", "Deposit limits", "Límites de depósito", "money"),
  S("esign_law", "consumer", "E-signature law", "Ley de firma electrónica", "money"),
  S("mechanics_lien_law", "consumer", "Mechanics lien law", "Ley de gravámenes de construcción", "close_out"),
  S("state_statute_search", "consumer", "Statute search", "Búsqueda de estatutos", "setup"),
  S("state_admin_code", "consumer", "Administrative code search", "Búsqueda del código administrativo", "setup"),
  S("ira_rebates_state", "incentives", "State Home Energy Rebates program", "Programa estatal de reembolsos de energía", "money", true),
  S("state_heat_pump_program", "incentives", "State heat pump incentives", "Incentivos estatales de bomba de calor", "money", true),
  S("puc", "incentives", "Public Utility Commission", "Comisión de Servicios Públicos", "money"),
  S("utilities_list", "incentives", "Electric and gas utilities", "Empresas de electricidad y gas", "money"),
  S("utility_rebate_pages", "incentives", "Utility rebate pages", "Páginas de reembolsos de empresas de servicios", "money", true),
  S("weatherization", "incentives", "Weatherization assistance", "Asistencia de climatización", "money"),
  S("state_permit_portal", "permits", "Statewide permit portal", "Portal estatal de permisos", "permit"),
  S("state_permit_rules", "permits", "State permit validity rule", "Regla estatal de vigencia de permisos", "permit"),
  S("state_inspection_program", "permits", "State inspection program", "Programa estatal de inspección", "close_out"),
  S("ahj_directory", "permits", "Local building department directory", "Directorio de departamentos locales de construcción", "permit"),
];

export const CATEGORIES: { id: Category; en: string; es: string }[] = [
  { id: "licensing", en: "Licensing & business", es: "Licencias y negocio" },
  { id: "codes", en: "Codes & energy", es: "Códigos y energía" },
  { id: "refrigerant", en: "Refrigerant & environment", es: "Refrigerante y ambiente" },
  { id: "consumer", en: "Consumer & contracts", es: "Consumidor y contratos" },
  { id: "incentives", en: "Incentives & utilities", es: "Incentivos y servicios" },
  { id: "permits", en: "Permits", es: "Permisos" },
];

export const STAGES: { id: Stage; en: string; es: string }[] = [
  { id: "setup", en: "Job setup", es: "Configuración del trabajo" },
  { id: "new_job", en: "New job", es: "Nuevo trabajo" },
  { id: "equipment", en: "Equipment", es: "Equipo" },
  { id: "permit", en: "Draft / permit", es: "Borrador / permiso" },
  { id: "install", en: "Install", es: "Instalación" },
  { id: "close_out", en: "Inspection / closeout", es: "Inspección / cierre" },
  { id: "money", en: "Money & incentives", es: "Dinero e incentivos" },
];

// Archive: every state researched so far. Kept for the record; only ROLLOUT states are public.
export const ARCHIVE_STATES: [string, string][] = [
  ["AL", "Alabama"], ["AK", "Alaska"], ["AZ", "Arizona"], ["AR", "Arkansas"], ["CA", "California"], ["CO", "Colorado"], ["CT", "Connecticut"],
  ["DE", "Delaware"], ["DC", "District of Columbia"], ["FL", "Florida"], ["GA", "Georgia"], ["HI", "Hawaii"], ["ID", "Idaho"], ["IL", "Illinois"],
  ["IN", "Indiana"], ["IA", "Iowa"], ["KS", "Kansas"], ["KY", "Kentucky"], ["LA", "Louisiana"], ["ME", "Maine"], ["MD", "Maryland"],
  ["MA", "Massachusetts"], ["MI", "Michigan"], ["MN", "Minnesota"], ["MS", "Mississippi"], ["MO", "Missouri"], ["MT", "Montana"], ["NE", "Nebraska"],
  ["NV", "Nevada"], ["NH", "New Hampshire"], ["NJ", "New Jersey"], ["NM", "New Mexico"], ["NY", "New York"], ["NC", "North Carolina"],
  ["ND", "North Dakota"], ["OH", "Ohio"], ["OK", "Oklahoma"], ["OR", "Oregon"], ["PA", "Pennsylvania"], ["RI", "Rhode Island"], ["SC", "South Carolina"],
  ["SD", "South Dakota"], ["TN", "Tennessee"], ["TX", "Texas"], ["UT", "Utah"], ["VT", "Vermont"], ["VA", "Virginia"], ["WA", "Washington"],
  ["WV", "West Virginia"], ["WI", "Wisconsin"], ["WY", "Wyoming"],
];

/** Public rollout: residential HVAC contractors in California, Arizona and Texas only. */
export const ROLLOUT_STATE_CODES = ["CA", "AZ", "TX"] as const;
export const STATES: [string, string][] = ROLLOUT_STATE_CODES.map((c) => ARCHIVE_STATES.find(([code]) => code === c)!);

// Records actually read and opened (curl + page fetch, 2026-11-22). Everything not listed here is pending research.
type Rec = Partial<ResourceLink> & { key: string; status: LinkStatus };
const D = "2026-11-22";
const D2 = "2026-11-23";
export const FEDERAL_RECORDS: Rec[] = [
  { key: "fed_epa_608", url: "https://www.epa.gov/section608/section-608-technician-certification", page_title: "Section 608 Technician Certification | US EPA",
    agency: "U.S. Environmental Protection Agency", source_type: "official_gov", status: "verified", checked_on: D, volatile: false, notes: "Opened; HTTP 200, no redirect." },
  { key: "fed_epa_608_managing", url: "https://www.epa.gov/section608/managing-refrigeration-and-ac-equipment", page_title: "Managing Refrigeration and A/C Equipment | US EPA",
    agency: "U.S. Environmental Protection Agency", source_type: "official_gov", status: "verified", checked_on: D, volatile: true,
    notes: "EPA overview of Section 608 requirements for stationary refrigeration and A/C equipment; last updated Nov 16, 2026 per the page." },
  { key: "fed_epa_608_recordkeeping", url: "https://www.epa.gov/section608/recordkeeping-and-reporting-requirements-stationary-refrigeration", page_title: "Recordkeeping and Reporting Requirements for Stationary Refrigeration | US EPA",
    agency: "U.S. Environmental Protection Agency", source_type: "official_gov", status: "verified", checked_on: D, volatile: true,
    notes: "EPA summary of recordkeeping and reporting duties for technicians, owners, certifiers and reclaimers under 40 CFR Part 82 Subpart F; last updated Feb 25, 2026 per the page. Summary only, not legal advice." },
  { key: "fed_epa_tech_transitions", url: "https://www.epa.gov/hfcs/technology-transitions-program", page_title: "Technology Transitions Program | US EPA", agency: "U.S. Environmental Protection Agency", source_type: "official_gov", status: "verified", checked_on: D2, volatile: true, notes: "Opened 2026-11-23.",
    note_en: "EPA program page on HFC restrictions in refrigeration, air conditioning and heat pump equipment. Compliance dates vary by sector; check the page's tables. Background only, not a permit rule.",
    note_es: "Página de la EPA sobre restricciones de HFC en equipos de refrigeración, aire acondicionado y bombas de calor. Las fechas varían por sector; consulte las tablas de la página. Solo referencia, no es una regla de permiso." },
  { key: "fed_epa_err", url: "https://www.epa.gov/hfcs/reporting-resources-emissions-reduction-reclamation-rule", page_title: "Reporting Resources for the Emissions Reduction & Reclamation Rule | US EPA", agency: "U.S. Environmental Protection Agency", source_type: "official_gov", status: "verified", checked_on: D2, volatile: true, notes: "Opened 2026-11-23.",
    note_en: "EPA reporting resources for the ER&R rule (40 CFR Part 84, Subpart C). Check the page for which systems and reports apply. Background only, not a permit rule.",
    note_es: "Recursos de reporte de la EPA para la regla ER&R (40 CFR Parte 84, Subparte C). Consulte la página para ver qué sistemas e informes aplican. Solo referencia, no es una regla de permiso." },
  { key: "fed_doe_regional_standards", url: "https://www1.eere.energy.gov/buildings/appliance_standards/pdfs/2023_CAC_Standards_FAQ_10-5-2022_Final.pdf", page_title: "2023 Central Air Conditioner Standards FAQ (DOE, Oct 5, 2022)", agency: "U.S. Department of Energy", source_type: "official_gov", status: "verified", checked_on: D2, volatile: false, notes: "PDF opened 2026-11-23.",
    note_en: "DOE FAQ (2022) on the 2023 standards and their regional approach. It states that installing a product that does not meet the regional standards in the Southeast and Southwest is not allowed. Read the document for the figures; none are copied here. Not a PermitDraft compliance check.",
    note_es: "Preguntas frecuentes del DOE (2022) sobre las normas de 2023 y su enfoque regional. Indica que no se permite instalar un producto que no cumpla las normas regionales del Sureste y Suroeste. Consulte el documento para las cifras; aquí no se copian. No es una verificación de cumplimiento de PermitDraft." },
  { key: "fed_doe_ccms", url: null, page_title: null, agency: "U.S. Department of Energy", source_type: "official_gov", status: "unverified", checked_on: D2, volatile: false, notes: "Pending: access refused on 2026-11-23.",
    note_en: "Pending: the DOE certification database page could not be opened in our check on 2026-11-23 (access refused), so it is not linked.",
    note_es: "Pendiente: no se pudo abrir la página de la base de certificación del DOE en nuestra revisión del 2026-11-23 (acceso rechazado), por lo que no se enlaza." },
  { key: "fed_ecfr_430_32", url: null, page_title: null, agency: "U.S. Government", source_type: "official_gov", status: "unverified", checked_on: D2, volatile: false, notes: "Pending: blocked by an access check on 2026-11-23.",
    note_en: "Pending: the eCFR page for 10 CFR 430.32 was blocked by an access check in our direct check on 2026-11-23, so it is not linked. No other site is substituted.",
    note_es: "Pendiente: la página de eCFR para 10 CFR 430.32 fue bloqueada por una verificación de acceso en nuestra revisión del 2026-11-23, por lo que no se enlaza. No se sustituye por otro sitio." },
  { key: "fed_ahri_directory", url: "https://www.ahridirectory.org/", page_title: "AHRI Certification Directory", agency: "Air-Conditioning, Heating, and Refrigeration Institute (AHRI)", source_type: "industry", status: "verified", checked_on: D2, volatile: false, notes: "Opened 2026-11-23.",
    tag_en: "Industry source", tag_es: "Fuente de la industria",
    note_en: "Trade association directory of performance-certified HVACR equipment, for confirming equipment ratings. Industry source, not a government agency and not a permit rule.",
    note_es: "Directorio de la asociación comercial de equipos HVACR con rendimiento certificado, para confirmar clasificaciones. Fuente de la industria, no una agencia de gobierno ni una regla de permiso." },
  { key: "fed_ftc_cooling_off", url: "https://www.federalregister.gov/documents/full_text/xml/2015/01/09/2015-00164.xml", page_title: "Trade Regulation Rule Concerning Cooling-Off Period for Sales Made at Homes or at Certain Other Locations (final rule, 2015)", agency: "Federal Trade Commission (published in the Federal Register)", source_type: "official_gov", status: "verified", checked_on: D2, volatile: false, notes: "Opened 2026-11-23.",
    tag_en: "Contract background", tag_es: "Contexto de contratos",
    note_en: "Text of the FTC's final rule on cancellation rights for in-home sales. Contract background only; contract handling needs legal review before it is offered. Not a permit rule.",
    note_es: "Texto de la regla final de la FTC sobre derechos de cancelación en ventas a domicilio. Solo contexto de contratos; el manejo de contratos requiere revisión legal antes de ofrecerse. No es una regla de permiso." },
  { key: "fed_irs_25c", url: "https://www.irs.gov/credits-deductions/energy-efficient-home-improvement-credit", page_title: "Energy Efficient Home Improvement Credit | Internal Revenue Service", agency: "Internal Revenue Service", source_type: "official_gov", status: "verified", checked_on: D2, volatile: true, notes: "Opened 2026-11-23.",
    tag_en: "Expired · historical use only", tag_es: "Vencido · solo uso histórico",
    note_en: "Section 25C credit page. The page ties the credit to property placed in service before 2026, so it is not a current incentive; use it only for past-year installs.",
    note_es: "Página del crédito de la Sección 25C. La página vincula el crédito a propiedad puesta en servicio antes de 2026, por lo que no es un incentivo vigente; úselo solo para instalaciones de años pasados." },
  { key: "fed_doe_home_energy_rebates", url: "https://www.energy.gov/sites/default/files/2024-09/home-energy-rebates-faq-fact-sheet_925224.pdf", page_title: "Home Energy Rebates FAQ fact sheet (DOE, Sept 2024)", agency: "U.S. Department of Energy", source_type: "official_gov", status: "verified", checked_on: D2, volatile: true, notes: "PDF opened 2026-11-23.",
    tag_en: "State-run programs", tag_es: "Programas estatales",
    note_en: "DOE fact sheet from 2024. States, territories and Tribes run these rebates, so availability depends on the home's location and is not promised here. Check the state's own program page before telling a customer a rebate is available.",
    note_es: "Hoja informativa del DOE de 2024. Los estados, territorios y tribus administran estos reembolsos, por lo que la disponibilidad depende de la ubicación y aquí no se promete. Consulte la página del programa estatal antes de decirle a un cliente que hay un reembolso." },
  { key: "fed_energycodes_state_portal", url: null, page_title: null, agency: "U.S. Department of Energy", source_type: "official_gov", status: "unverified", checked_on: null, volatile: false,
    notes: "energycodes.gov home opened, but its state status page returned HTTP 403 to our check, so no state-portal address is confirmed yet.",
    note_en: "Pending: the DOE state energy codes portal address could not be confirmed in our check on 2026-11-23, so it is not linked.",
    note_es: "Pendiente: no se pudo confirmar la dirección del portal estatal de códigos de energía del DOE en nuestra revisión del 2026-11-23, por lo que no se enlaza." },
];
// Archival evidence for states outside the rollout is not kept here.
export const STATE_RECORDS: Record<string, Rec[]> = {
  AZ: [
    { key: "lic_agency", url: "https://roc.az.gov/", page_title: "Home | Arizona Registrar of Contractors", agency: "Arizona Registrar of Contractors",
      source_type: "official_gov", status: "verified", checked_on: D, volatile: false, notes: "Opened on 2026-11-22; the homepage loads and offers license search, applying and complaints. Office at 1700 W. Washington St., Phoenix." },
    { key: "lic_lookup", url: "https://roc.az.gov/contractor-search", page_title: "Contractor Search | Arizona Registrar of Contractors", agency: "Arizona Registrar of Contractors",
      source_type: "official_gov", status: "verified", checked_on: D, volatile: false,
      label_en: "Arizona contractor license lookup", label_es: "Búsqueda de licencias de contratistas de Arizona",
      note_en: "Check license status by name or six-digit ROC license number on the state site.",
      note_es: "Consulte el estado de una licencia por nombre o por número de licencia ROC de seis dígitos en el sitio del estado.",
      notes: "Source confirmed from the official published page and agency guide. The interactive search showed a human check to our reader, so search results were not tested." },
  ],
  CA: [
    { key: "lic_lookup", url: "https://www.cslb.ca.gov/OnlineServices/CheckLicenseII/CheckLicense.aspx", page_title: "Check A License - CSLB", agency: "Contractors State License Board",
      source_type: "official_gov", status: "verified", checked_on: D, volatile: false, notes: "Opened; HTTP 200, no redirect." },
  ],
  TX: [
    { key: "lic_agency", url: "https://www.tdlr.texas.gov/acr/", page_title: "Air Conditioning and Refrigeration Contractors Homepage", agency: "Texas Department of Licensing and Regulation",
      source_type: "official_gov", status: "verified", checked_on: D, volatile: false, notes: "Opened; the older /acr/acr.htm address redirected here." },
    { key: "lic_lookup", url: "https://www.tdlr.texas.gov/LicenseSearch/", page_title: "TDLR Active License Search", agency: "Texas Department of Licensing and Regulation",
      source_type: "official_gov", status: "verified", checked_on: D, volatile: false, notes: "Opened; HTTP 200, no redirect." },
  ],
};

/** A link may be an outbound resource only if it was read and carries its metadata. */
export function isOutbound(l: ResourceLink): boolean {
  return l.status === "verified" && !!l.url && /^https:\/\//.test(l.url) && !!l.page_title && /^\d{4}-\d{2}-\d{2}$/.test(l.checked_on ?? "") && !!l.agency && l.source_type !== "secondary" && l.source_type !== null;
}

function build(def: KeyDef, rec?: Rec): ResourceLink {
  const base: ResourceLink = { key: def.key, category: def.category, url: null, page_title: null, agency: null, source_type: null, status: "unverified", checked_on: null,
    volatile: !!def.volatile, notes: "Pending: not yet researched.", label_en: def.en, label_es: def.es, show_in_app_stage: def.stage };
  const l = { ...base, ...(rec ?? {}) } as ResourceLink;
  if (!isOutbound(l) && l.status === "verified") l.status = "unverified"; // never trust an incomplete "verified"
  if (l.status !== "verified") l.url = l.status === "unverified" && !rec ? null : l.url;
  return l;
}

export const FEDERAL: ResourceLink[] = FEDERAL_KEYS.map((d) => build(d, FEDERAL_RECORDS.find((r) => r.key === d.key)));
export const STATE_LINKS: Record<string, ResourceLink[]> = Object.fromEntries(
  STATES.map(([code]) => [code, STATE_KEYS.map((d) => build(d, (STATE_RECORDS[code] ?? []).find((r) => r.key === d.key)))]),
);

export type Counts = { total: number; verified: number; not_applicable: number; not_found: number; pending: number };
export function countLinks(links: ResourceLink[]): Counts {
  const c: Counts = { total: links.length, verified: 0, not_applicable: 0, not_found: 0, pending: 0 };
  for (const l of links) {
    if (isOutbound(l)) c.verified++;
    else if (l.status === "not_applicable") c.not_applicable++;
    else if (l.status === "not_found") c.not_found++;
    else c.pending++;
  }
  return c;
}

/** Selector coverage = rollout states you can pick (CA, AZ, TX). Actual coverage = states with at least one verified outbound link. */
export function completeness() {
  const all = STATES.map(([code]) => ({ code, c: countLinks(STATE_LINKS[code]) }));
  const sum = (f: (c: Counts) => number) => all.reduce((n, x) => n + f(x.c), 0);
  return {
    selectorStates: STATES.length,
    statesWithVerified: all.filter((x) => x.c.verified > 0).length,
    stateLinksTotal: sum((c) => c.total), stateVerified: sum((c) => c.verified), stateNotApplicable: sum((c) => c.not_applicable),
    stateNotFound: sum((c) => c.not_found), statePending: sum((c) => c.pending),
    federal: countLinks(FEDERAL),
  };
}

/** Returns a list of problems; empty means the dataset is sound. */
export function validateDataset(fed: ResourceLink[] = FEDERAL, states: Record<string, ResourceLink[]> = STATE_LINKS): string[] {
  const errs: string[] = [];
  const check = (where: string, l: ResourceLink) => {
    if (l.status === "verified" && !isOutbound(l)) errs.push(`${where}/${l.key}: verified without url, title, agency, source or check date`);
    if (l.source_type === "secondary" && l.status === "verified") errs.push(`${where}/${l.key}: secondary source marked verified`);
    if (l.status === "not_applicable" || l.status === "not_found") { if (!l.notes || l.notes.startsWith("Pending")) errs.push(`${where}/${l.key}: ${l.status} needs a reason`); }
    if (l.status === "unverified" && l.checked_on && !l.url) { /* allowed: checked but no address confirmed */ }
    if (!l.label_en || !l.label_es) errs.push(`${where}/${l.key}: missing bilingual label`);
  };
  fed.forEach((l) => check("federal", l));
  for (const [code, ls] of Object.entries(states)) {
    if (ls.length !== STATE_KEYS.length) errs.push(`${code}: expected ${STATE_KEYS.length} keys, found ${ls.length}`);
    ls.forEach((l) => check(code, l));
  }
  if (Object.keys(states).some((c) => !(ROLLOUT_STATE_CODES as readonly string[]).includes(c))) errs.push("a state outside the CA, AZ, TX rollout is public");
  return errs;
}

/** Links to show as clickable: verified only. */
export function outboundOnly(links: ResourceLink[]) { return links.filter(isOutbound); }

export type ResourceSearch = { state?: string; stage?: Stage; cat?: Category };
const STATE_CODES = new Set(STATES.map(([c]) => c));
export const isStateCode = (s: unknown): s is string => typeof s === "string" && STATE_CODES.has(s);
/** Search params for a contextual deep link. The state is passed only when the job states it explicitly; never derived from an address or AHJ. */
export function resourcesSearch(stage: Stage, state?: string | null): ResourceSearch {
  const code = (state ?? "").trim().toUpperCase();
  return { stage, ...(isStateCode(code) ? { state: code } : {}) };
}
