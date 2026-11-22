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
};

export const HANDOFF_CHECKED_ON = "2026-11-22";

export const AUTHORITIES: Authority[] = [
  { id: "sacramento-county", state: "CA", name: ["Sacramento County", "Condado de Sacramento"], area: "county", kind: "guidance", pageTitle: "Building permits & inspection: Frequently Asked Questions", url: "https://development.saccounty.gov/us/en/building-permits-inspection/frequently-asked-questions.html" },
  { id: "sacramento-city", state: "CA", name: ["City of Sacramento", "Ciudad de Sacramento"], area: "city", kind: "guidance", pageTitle: "Minor Permits | City of Sacramento", url: "https://www.cityofsacramento.gov/community-development/building/permit-services/minor-permits",
    links: [
      { label: ["City of Sacramento Minor Permits (HVAC guidance)", "Permisos menores de la Ciudad de Sacramento (orientación de HVAC)"], url: "https://www.cityofsacramento.gov/community-development/building/permit-services/minor-permits" },
      { label: ["City of Sacramento Public Permit Portal (apply online)", "Portal público de permisos de la Ciudad de Sacramento (solicitar en línea)"], url: "https://aca-prod.accela.com/sacramento/Default.aspx" },
    ],
    scope: [
      ["City limits only: these links apply to addresses inside the City of Sacramento, not to unincorporated Sacramento County.", "Solo dentro de los límites de la ciudad: estos enlaces aplican a direcciones dentro de la Ciudad de Sacramento, no al condado de Sacramento no incorporado."],
      ["Residential HVAC for one- and two-family dwellings only.", "Solo HVAC residencial para viviendas de una y dos familias."],
      ["California licensed contractors must register to obtain permits online.", "Los contratistas con licencia de California deben registrarse para obtener permisos en línea."],
    ] },
  { id: "el-dorado-county", state: "CA", name: ["El Dorado County", "Condado de El Dorado"], area: "county", kind: "guidance", pageTitle: "Building Division - El Dorado County", url: "https://www.eldoradocounty.ca.gov/Land-Use/Planning-and-Building/Building-Division" },
  { id: "los-angeles-county", state: "CA", name: ["Los Angeles County", "Condado de Los Ángeles"], area: "county", kind: "permit_center", pageTitle: "Permits Overview - LA County Public Works Permits", url: "https://permits.lacounty.gov/" },
  { id: "houston", state: "TX", name: ["City of Houston", "Ciudad de Houston"], area: "city", kind: "guidance", pageTitle: "Mechanical Inspections | Houston Permitting Center", url: "https://www.houstonpermittingcenter.org/building-code-enforcement/mechanical-inspections" },
  { id: "dallas", state: "TX", name: ["City of Dallas", "Ciudad de Dallas"], area: "city", kind: "guidance", pageTitle: "Dallas Planning & Development Guide", url: "https://dallascityhall.com/departments/sustainabledevelopment/guide/Pages/default.aspx" },
  { id: "san-antonio", state: "TX", name: ["City of San Antonio", "Ciudad de San Antonio"], area: "city", kind: "guidance", pageTitle: "Plan Review - City of San Antonio (Development Services)", url: "https://www.sa.gov/Directory/Departments/DSD/Constructing/Residential/Plan-Review" },
  { id: "maricopa-county", state: "AZ", name: ["Maricopa County", "Condado de Maricopa"], area: "county", kind: "permit_center", pageTitle: "Maricopa County's Permit Center", url: "https://www.maricopa.gov/6003/Maricopa-Countys-Permit-Center" },
  { id: "pima-county", state: "AZ", name: ["Pima County", "Condado de Pima"], area: "county", kind: "guidance", pageTitle: "A/C & Water Heater Replacements | Pima County, AZ", url: "https://www.pima.gov/a-c-water-heater-replacements" },
  { id: "pinal-county", state: "AZ", name: ["Pinal County", "Condado de Pinal"], area: "county", kind: "portal", pageTitle: "Welcome Pinal County (Citizen Access)", url: "https://citizenaccess.pinalcountyaz.gov/" },
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
