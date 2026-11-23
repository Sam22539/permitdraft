/**
 * The initial shortlist of permitting authorities for the official filing handoff.
 * Each link opens an official page in a new tab only: no job or customer data is attached,
 * and opening it files nothing. Pages opened and titles recorded 2026-11-22.
 */
export type HandoffKind = "guidance" | "permit_center" | "portal";
export type HandoffArea = "county" | "city";

export type Authority = {
  id: string;
  state: "CA" | "AZ" | "TX";
  name: [string, string];
  area: HandoffArea;
  kind: HandoffKind;
  pageTitle: string;
  url: string;
  /** Extra official links shown after the address is confirmed (this authority only). */
  links?: { label: [string, string]; url: string }[];
  /** Scope notes shown with the links. */
  scope?: [string, string][];
  /** Direct official online portals (opened read-only 2026-11-23), shown first after the address is confirmed. */
  portals?: { label: [string, string]; url: string }[];
  /** Listed in the Resources handoff only, not on the Coverage page. */
  handoffOnly?: boolean;
};

export const HANDOFF_CHECKED_ON = "2026-11-23";

export const AUTHORITIES: Authority[] = [
  { id: "sacramento-county", state: "CA", name: ["Sacramento County", "Condado de Sacramento"], area: "county", kind: "guidance", pageTitle: "Building permits & inspection: Frequently Asked Questions", url: "https://development.saccounty.gov/us/en/building-permits-inspection/frequently-asked-questions.html",
    portals: [ { label: ["Sacramento County online permit portal (Accela)", "Portal de permisos en línea del Condado de Sacramento (Accela)"], url: "https://aca-prod.accela.com/SACCO/Default.aspx" } ],
    scope: [
      ["Unincorporated Sacramento County addresses only. Do not use the City of Sacramento portal for a county job.", "Solo direcciones del condado de Sacramento no incorporado. No use el portal de la Ciudad de Sacramento para un trabajo del condado."],
      ["The County permit FAQ lists heating and cooling installations and replacements as permit work.", "Las preguntas frecuentes de permisos del Condado indican que las instalaciones y reemplazos de calefacción y aire acondicionado requieren permiso."],
    ] },
  { id: "sacramento-city", state: "CA", name: ["City of Sacramento", "Ciudad de Sacramento"], area: "city", kind: "guidance", pageTitle: "Minor Permits | City of Sacramento", url: "https://www.cityofsacramento.gov/community-development/building/permit-services/minor-permits",
    links: [
      { label: ["City of Sacramento Minor Permits (HVAC guidance)", "Permisos menores de la Ciudad de Sacramento (orientación de HVAC)"], url: "https://www.cityofsacramento.gov/community-development/building/permit-services/minor-permits" },
      { label: ["City of Sacramento Public Permit Portal (apply online)", "Portal público de permisos de la Ciudad de Sacramento (solicitar en línea)"], url: "https://aca-prod.accela.com/SACRAMENTO/Default.aspx" },
    ],
    portals: [ { label: ["City of Sacramento Public Permit Portal (apply online)", "Portal público de permisos de la Ciudad de Sacramento (solicitar en línea)"], url: "https://aca-prod.accela.com/SACRAMENTO/Default.aspx" } ],
    scope: [
      ["City limits only: these links apply to addresses inside the City of Sacramento, not to unincorporated Sacramento County.", "Solo dentro de los límites de la ciudad: estos enlaces aplican a direcciones dentro de la Ciudad de Sacramento, no al condado de Sacramento no incorporado."],
      ["Residential HVAC for one- and two-family dwellings only.", "Solo HVAC residencial para viviendas de una y dos familias."],
      ["California licensed contractors must register to obtain permits online.", "Los contratistas con licencia de California deben registrarse para obtener permisos en línea."],
    ] },
  { id: "el-dorado-county", state: "CA", name: ["El Dorado County", "Condado de El Dorado"], area: "county", kind: "guidance", pageTitle: "Building Division - El Dorado County", url: "https://www.eldoradocounty.ca.gov/Land-Use/Planning-and-Building/Building-Division",
    scope: [
      ["Official guidance only for now: the County's eTRAKiT portal did not open when checked, and the County says not all permit types are available online. Confirm the route for your trade permit with Building Services.", "Solo orientación oficial por ahora: el portal eTRAKiT del Condado no abrió al revisarlo, y el Condado indica que no todos los tipos de permiso están disponibles en línea. Confirme la vía para su permiso con Building Services."],
    ] },
  { id: "los-angeles-county", state: "CA", name: ["Los Angeles County", "Condado de Los Ángeles"], area: "county", kind: "permit_center", pageTitle: "Permits Overview - LA County Public Works Permits", url: "https://permits.lacounty.gov/",
    portals: [ { label: ["LA County EPIC-LA (Electronic Permitting and Inspection)", "EPIC-LA del Condado de LA (permisos e inspecciones electrónicos)"], url: "https://losangelescountyca-energovweb.tylerhost.net/apps/selfservice#/home" } ],
    scope: [
      ["County service area: unincorporated areas and some cities that contract with LA County for building services. Confirm the parcel is served by County Building and Safety, not a city department.", "Área de servicio del condado: áreas no incorporadas y algunas ciudades que contratan servicios de construcción con el Condado de LA. Confirme que la parcela la atiende Building and Safety del Condado y no un departamento de una ciudad."],
      ["Express permit eligibility is set by the County; the Express permit page lists the application types.", "La elegibilidad para permisos exprés la define el Condado; la página de permisos exprés lista los tipos de solicitud."],
    ] },
  { id: "los-angeles-city", state: "CA", name: ["City of Los Angeles", "Ciudad de Los Ángeles"], area: "city", kind: "portal", handoffOnly: true, pageTitle: "Design Professional | LADBS", url: "https://dbs.lacity.gov/services/design-professional-step-by-step",
    portals: [ { label: ["PermitLA: apply for an Express Permit (LADBS)", "PermitLA: solicitar un permiso exprés (LADBS)"], url: "https://permitla.lacitydbs.org/" } ],
    scope: [
      ["City of Los Angeles limits only (LADBS). This is not LA County, and some addresses with a Los Angeles mailing name are outside the city.", "Solo dentro de la Ciudad de Los Ángeles (LADBS). No es el Condado de LA, y algunas direcciones con nombre postal de Los Ángeles quedan fuera de la ciudad."],
      ["The LADBS Design Professional page explains the Express Permit and links to the current PermitLA portal.", "La página LADBS para profesionales de diseño explica el permiso exprés y enlaza al portal PermitLA vigente."],
    ] },
  { id: "houston", state: "TX", name: ["City of Houston", "Ciudad de Houston"], area: "city", kind: "guidance", pageTitle: "Mechanical Inspections | Houston Permitting Center", url: "https://www.houstonpermittingcenter.org/building-code-enforcement/mechanical-inspections",
    portals: [ { label: ["Houston iPermits (online permits)", "iPermits de Houston (permisos en línea)"], url: "https://www.pdinet.pd.houstontx.gov/iPermits/" } ],
    scope: [
      ["City of Houston jurisdiction only. This is not Harris County.", "Solo la jurisdicción de la Ciudad de Houston. No es el Condado de Harris."],
      ["The mechanical inspections page lists AC replacement as permit work; the alteration instructions describe iPermits and city license registration.", "La página de inspecciones mecánicas indica que el reemplazo de AC requiere permiso; las instrucciones de alteración describen iPermits y el registro de licencia de la ciudad."],
    ] },
  { id: "dallas", state: "TX", name: ["City of Dallas", "Ciudad de Dallas"], area: "city", kind: "guidance", pageTitle: "Dallas Planning & Development Guide", url: "https://dallascityhall.com/departments/sustainabledevelopment/guide/Pages/default.aspx",
    portals: [ { label: ["DallasNow (online permits)", "DallasNow (permisos en línea)"], url: "https://aca-prod.accela.com/DALLASTX/Login.aspx" } ],
    scope: [
      ["The City permit guide routes mechanical work through DallasNow and describes contractor registration.", "La guía de permisos de la Ciudad dirige el trabajo mecánico a DallasNow y describe el registro de contratistas."],
    ] },
  { id: "san-antonio", state: "TX", name: ["City of San Antonio", "Ciudad de San Antonio"], area: "city", kind: "guidance", pageTitle: "Plan Review - City of San Antonio (Development Services)", url: "https://www.sa.gov/Directory/Departments/DSD/Constructing/Residential/Plan-Review",
    portals: [ { label: ["BuildSA online portal (Accela)", "Portal en línea BuildSA (Accela)"], url: "https://aca-prod.accela.com/COSA/default.aspx" } ],
    scope: [
      ["The Residential Plan Review page describes a limited licensed-contractor route for certain one- and two-family electric AC replacements; check its current bulletin for scope.", "La página de revisión de planos residenciales describe una vía limitada para contratistas con licencia en ciertos reemplazos de AC eléctrico de viviendas de una y dos familias; revise su boletín vigente."],
    ] },
  { id: "maricopa-county", state: "AZ", name: ["Maricopa County", "Condado de Maricopa"], area: "county", kind: "permit_center", pageTitle: "Maricopa County's Permit Center", url: "https://www.maricopa.gov/6003/Maricopa-Countys-Permit-Center",
    portals: [ { label: ["Maricopa County Permit Center (online filing)", "Permit Center del Condado de Maricopa (presentación en línea)"], url: "https://maricopacountyaz-energovweb.tylerhost.net/apps/selfservice#/home" } ],
    scope: [
      ["Unincorporated Maricopa County only; cities and towns permit their own incorporated addresses.", "Solo el condado de Maricopa no incorporado; las ciudades y pueblos emiten permisos de sus direcciones incorporadas."],
      ["County guidance distinguishes like-for-like, ground-mounted and roof-mounted equipment.", "La guía del Condado distingue equipo del mismo tipo, montado en el suelo y montado en el techo."],
    ] },
  { id: "pima-county", state: "AZ", name: ["Pima County", "Condado de Pima"], area: "county", kind: "guidance", pageTitle: "A/C & Water Heater Replacements | Pima County, AZ", url: "https://www.pima.gov/a-c-water-heater-replacements",
    portals: [ { label: ["Pima County permit portal (permits.pima.gov)", "Portal de permisos del Condado de Pima (permits.pima.gov)"], url: "https://aca-prod.accela.com/PIMA/Default.aspx" } ],
    scope: [
      ["The A/C replacement guidance describes a permit and sizing documentation, with a separate route for qualifying contractors.", "La guía de reemplazo de A/C describe un permiso y documentación de dimensionamiento, con una vía separada para contratistas calificados."],
    ] },
  { id: "pinal-county", state: "AZ", name: ["Pinal County", "Condado de Pinal"], area: "county", kind: "portal", pageTitle: "Welcome Pinal County (Citizen Access)", url: "https://citizenaccess.pinalcountyaz.gov/",
    portals: [ { label: ["Pinal County Citizen Access (permit portal)", "Citizen Access del Condado de Pinal (portal de permisos)"], url: "https://citizenaccess.pinalcountyaz.gov/" } ],
    scope: [
      ["Confirm the County's current exemption bulletin and like-for-like criteria before treating a job as not needing a permit.", "Confirme el boletín de exenciones vigente del Condado y los criterios de equipo del mismo tipo antes de considerar que un trabajo no necesita permiso."],
    ] },
];

export const HANDOFF_STATES: { code: Authority["state"]; name: [string, string] }[] = [
  { code: "CA", name: ["California", "California"] },
  { code: "AZ", name: ["Arizona", "Arizona"] },
  { code: "TX", name: ["Texas", "Texas"] },
];

export const KIND_LABEL: Record<HandoffKind, [string, string]> = {
  guidance: ["Official guidance page (not an application form)", "Página oficial de orientación (no es un formulario de solicitud)"],
  permit_center: ["Official permit center page", "Página oficial del centro de permisos"],
  portal: ["Official online permit portal (needs the authority's own account)", "Portal oficial de permisos en línea (requiere una cuenta de la autoridad)"],
};

export const AREA_NOTE: Record<HandoffArea, [string, string]> = {
  county: [
    "County service area: a county building office generally serves addresses outside city limits (unincorporated areas). Cities inside the county may run their own building department, so this county is not the authority for every address in it.",
    "Área de servicio del condado: una oficina de construcción del condado generalmente atiende direcciones fuera de los límites de las ciudades (áreas no incorporadas). Las ciudades dentro del condado pueden tener su propio departamento de construcción, así que este condado no es la autoridad para todas sus direcciones.",
  ],
  city: [
    "City limits: a city building department serves addresses inside its city limits. A mailing address that says this city can still sit outside its limits, where the county or another city may be the authority.",
    "Límites de la ciudad: un departamento de construcción de la ciudad atiende direcciones dentro de sus límites. Una dirección postal con el nombre de esta ciudad puede quedar fuera de sus límites, donde la autoridad puede ser el condado u otra ciudad.",
  ],
};

/** Idaho reference-only entries. Separate from the ten-state handoff: not selectable, not a coverage area. */
export const IDAHO_REFERENCES = [
  { id: "idaho-dopl", name: ["Idaho DOPL: state HVAC permits and inspections", "DOPL de Idaho: permisos e inspecciones estatales de HVAC"] as [string, string], pageTitle: "Permits and Inspections - Division of Occupational and Professional Licenses", url: "https://dopl.idaho.gov/hvac/hvac-permits-and-inspections/",
    note: ["The state Division of Occupational and Professional Licenses issues HVAC permits where the state serves the job.", "La División estatal de Licencias Ocupacionales y Profesionales emite permisos de HVAC donde el estado atiende el trabajo."] as [string, string] },
  { id: "idaho-cda", name: ["City of Coeur d'Alene: building permits", "Ciudad de Coeur d'Alene: permisos de construcción"] as [string, string], pageTitle: "Online Permits Access | City of Coeur d'Alene", url: "https://www.cdaid.org/government/departments/building-services/online-permits-access/",
    portal: { label: ["Coeur d'Alene building permit portal (building.cdaid.org)", "Portal de permisos de construcción de Coeur d'Alene (building.cdaid.org)"] as [string, string], url: "https://building.cdaid.org/" },
    note: ["The city issues the mechanical permit for work within Coeur d'Alene city jurisdiction.", "La ciudad emite el permiso mecánico para trabajo dentro de la jurisdicción de la ciudad de Coeur d'Alene."] as [string, string] },
];

/** Las Vegas reference-only entries (pages opened 2026-11-23). Separate from the handoff: not selectable, not a filing channel, and the County entry is not a service area. */
export const LAS_VEGAS_REFERENCES = [
  { id: "lv-city", name: ["City of Las Vegas", "Ciudad de Las Vegas"] as [string, string], pageTitle: "Online Permits List | City of Las Vegas", url: "https://www.lasvegasnevada.gov/Business/Permits-Licenses/Online-Permits-List",
    note: ["For addresses within City of Las Vegas jurisdiction. The page lists “Heating, Ventilation, Air Conditioning (HVAC) exact change outs/repairs” among permits that do not require a plan; any other work not listed requires a plan.", "Para direcciones dentro de la jurisdicción de la Ciudad de Las Vegas. La página lista los «cambios exactos/reparaciones de calefacción, ventilación y aire acondicionado (HVAC)» entre los permisos que no requieren plano; cualquier otro trabajo no listado requiere un plano."] as [string, string] },
  { id: "lv-clark", name: ["Clark County (unincorporated county addresses)", "Condado de Clark (direcciones no incorporadas del condado)"] as [string, string], pageTitle: "Building - Simple Online Permits | Clark County", url: "https://www.clarkcountynv.gov/government/departments/building___fire_prevention/permit_issuance/building-simple-permits",
    note: ["For addresses under Clark County building authority (unincorporated county). The page lists simple residential mechanical permits, one appliance per permit, such as A/C and furnace replacements, and requires a Citizen Access Portal account. Reference only: this is not a PermitDraft service area expansion.", "Para direcciones bajo la autoridad de construcción del Condado de Clark (condado no incorporado). La página lista permisos mecánicos residenciales simples, un aparato por permiso, como reemplazos de A/C y furnace, y requiere una cuenta del Citizen Access Portal. Solo referencia: no amplía el área de servicio de PermitDraft."] as [string, string] },
];
