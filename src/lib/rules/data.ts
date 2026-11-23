import type { Reference, Rule, RulePack, Workflow, WorkflowId } from "./schema";

// Rule pack. Only documentation-scope checks (PermitDraft's own capture checklist) are active.
// NO legal rule is seeded: federal, state, county, city, utility and manufacturer rules stay out until a primary source
// is read, dated, and a person signs them off. Coverage is therefore documentation-only everywhere.
const INTERNAL = [{ title: "PermitDraft capture checklist", type: "internal" as const }];
const base = { version: 1, scope: "documentation" as const, layer: "app" as const, jurisdictionCode: "*", category: "documentation" as const,
  dateBasis: "evaluation_date" as const, outcome: "require_item" as const, effectiveFrom: "2026-11-22", sources: INTERNAL,
  verifiedOn: "2026-11-22", verifiedBy: "product" as const, status: "verified" as const, active: true };
const DOC_WHY = ["PermitDraft's own capture checklist: the office needs this to review the draft. It is not a legal requirement.", "Lista de captura propia de PermitDraft: la oficina lo necesita para revisar el borrador. No es un requisito legal."] as const;

const ALL: WorkflowId[] = ["heat-pump", "central-ac", "furnace-coil"];
const COOL: WorkflowId[] = ["heat-pump", "central-ac"];
type D = { id: string; wf: WorkflowId[]; req: Rule["requires"]; text: [string, string]; todo: [string, string] };
const D: D[] = [
  { id: "name", wf: ALL, req: { type: "field", input: "name" }, text: ["Homeowner name", "Nombre del propietario"], todo: ["Enter the homeowner name.", "Ingrese el nombre del propietario."] },
  { id: "addr", wf: ALL, req: { type: "field", input: "addr" }, text: ["Job site address", "Dirección del sitio"], todo: ["Enter the job site address.", "Ingrese la dirección del sitio."] },
  { id: "city", wf: ALL, req: { type: "field", input: "city" }, text: ["City", "Ciudad"], todo: ["Enter the city.", "Ingrese la ciudad."] },
  { id: "model", wf: ALL, req: { type: "field", input: "model" }, text: ["Equipment model number", "Número de modelo del equipo"], todo: ["Read the model number from the data plate.", "Lea el modelo en la placa de datos."] },
  { id: "serial", wf: ALL, req: { type: "field", input: "serial" }, text: ["Equipment serial number", "Número de serie del equipo"], todo: ["Read the serial number from the data plate. If it cannot be read, retake the photo or ask the office; do not guess.", "Lea el número de serie en la placa. Si no se lee, repita la foto o consulte a la oficina; no lo adivine."] },
  { id: "coilModel", wf: ["furnace-coil"], req: { type: "field", input: "coilModel" }, text: ["Indoor coil model number", "Modelo del serpentín interior"], todo: ["Read the coil model number.", "Lea el modelo del serpentín."] },
  { id: "coilSerial", wf: ["furnace-coil"], req: { type: "field", input: "coilSerial" }, text: ["Indoor coil serial number", "Serie del serpentín interior"], todo: ["Read the coil serial number from its label.", "Lea la serie del serpentín en su etiqueta."] },
  { id: "fuOutdoor", wf: ["furnace-coil"], req: { type: "field", input: "fuOutdoor" }, text: ["Outdoor unit answer (kept, replaced or not present)", "Respuesta sobre la unidad exterior (conservada, reemplazada o no presente)"], todo: ["Answer whether the outdoor unit was kept, replaced or not present.", "Responda si la unidad exterior se conservó, se reemplazó o no está presente."] },
  { id: "fuFurnace", wf: ["furnace-coil"], req: { type: "field", input: "fuFurnace" }, text: ["Furnace answer (kept or replaced)", "Respuesta sobre el horno (conservado o reemplazado)"], todo: ["Answer whether the furnace was kept or replaced.", "Responda si el horno se conservó o se reemplazó."] },
  { id: "fuCoil", wf: ["furnace-coil"], req: { type: "field", input: "fuCoil" }, text: ["Indoor coil answer (kept or replaced)", "Respuesta sobre el serpentín interior (conservado o reemplazado)"], todo: ["Answer whether the indoor coil was kept or replaced.", "Responda si el serpentín interior se conservó o se reemplazó."] },
  { id: "fuRefrig", wf: ["furnace-coil"], req: { type: "field", input: "fuRefrig" }, text: ["Refrigerant work answer", "Respuesta sobre el trabajo con refrigerante"], todo: ["Answer whether refrigerant work was done.", "Responda si se hizo trabajo con refrigerante."] },
  { id: "fuOk", wf: ["furnace-coil"], req: { type: "field", input: "fuOk" }, text: ["Outdoor unit and refrigerant answers agree", "Las respuestas de unidad exterior y refrigerante concuerdan"], todo: ["The outdoor unit is marked not present but refrigerant work is marked done. Correct one answer.", "La unidad exterior está como no presente pero el trabajo con refrigerante como hecho. Corrija una respuesta."] },
  { id: "refrig", wf: COOL, req: { type: "field", input: "refrig" }, text: ["Refrigerant type", "Tipo de refrigerante"], todo: ["Record the refrigerant type shown on the data plate.", "Anote el tipo de refrigerante de la placa."] },
  { id: "panel", wf: ALL, req: { type: "field", input: "panel" }, text: ["Panel size (amps)", "Amperios del panel"], todo: ["Enter the panel amperage or photograph the panel label.", "Ingrese los amperios del panel o fotografíe su etiqueta."] },
  { id: "duct", wf: ALL, req: { type: "field", input: "duct" }, text: ["Duct sealing answer", "Respuesta de sellado de ductos"], todo: ["Choose the duct sealing answer.", "Elija la respuesta de sellado de ductos."] },
  { id: "p-plate", wf: COOL, req: { type: "photo", slot: "plate" }, text: ["Data plate photo", "Foto de la placa de datos"], todo: ["Take the data plate photo.", "Tome la foto de la placa de datos."] },
  { id: "p-plate_furnace", wf: ["furnace-coil"], req: { type: "photo", slot: "plate_furnace" }, text: ["Furnace data plate photo", "Foto de la placa de datos del horno"], todo: ["Take a photo of the replaced furnace's data plate.", "Tome una foto de la placa de datos del horno reemplazado."] },
  { id: "p-plate_coil", wf: ["furnace-coil"], req: { type: "photo", slot: "plate_coil" }, text: ["Indoor coil data plate photo", "Foto de la placa de datos del serpentín interior"], todo: ["Take a photo of the replaced indoor coil's data plate.", "Tome una foto de la placa de datos del serpentín interior reemplazado."] },
  { id: "p-plate_outdoor", wf: ["furnace-coil"], req: { type: "photo", slot: "plate_outdoor" }, text: ["Outdoor unit data plate photo", "Foto de la placa de datos de la unidad exterior"], todo: ["Take a photo of the replaced outdoor unit's data plate.", "Tome una foto de la placa de datos de la unidad exterior reemplazada."] },
  { id: "p-outdoor", wf: ALL, req: { type: "photo", slot: "outdoor" }, text: ["Outdoor unit photo", "Foto de la unidad exterior"], todo: ["Take the outdoor unit photo.", "Tome la foto de la unidad exterior."] },
  { id: "p-gauge", wf: ALL, req: { type: "photo", slot: "gauge" }, text: ["Gauge or meter photo", "Foto del manómetro o medidor"], todo: ["Take the gauge or meter photo.", "Tome la foto del manómetro o medidor."] },
  { id: "chk-c1", wf: ALL, req: { type: "field", input: "c1" }, text: ["Outdoor unit location recorded", "Ubicación de la unidad exterior registrada"], todo: ["Record the outdoor unit location.", "Registre la ubicación de la unidad exterior."] },
  { id: "chk-c2", wf: ALL, req: { type: "field", input: "c2" }, text: ["Refrigerant charge reading taken", "Lectura de carga de refrigerante tomada"], todo: ["Take the refrigerant charge reading.", "Tome la lectura de carga de refrigerante."] },
  { id: "chk-c3", wf: ALL, req: { type: "field", input: "c3" }, text: ["Refrigerant type matches data plate", "El tipo de refrigerante coincide con la placa"], todo: ["Confirm the refrigerant type matches the data plate.", "Confirme que el tipo de refrigerante coincide con la placa."] },
  { id: "chk-c4", wf: ALL, req: { type: "field", input: "c4" }, text: ["Equipment label photo readable", "Foto de la etiqueta del equipo legible"], todo: ["Confirm the equipment label photo is readable.", "Confirme que la foto de la etiqueta del equipo es legible."] },
];

export const WORKFLOWS: Workflow[] = [
  { id: "heat-pump", type: "Heat pump change-out", name: ["Heat pump change-out", "Cambio de bomba de calor"], inputs: { name: "name", addr: "addr", city: "city", model: "model", serial: "serial", refrig: "refrig", panel: "panel", duct: "duct", c1: "c1", c2: "c2", c3: "c3", c4: "c4" } },
  { id: "central-ac", type: "Central AC change-out", name: ["Central AC change-out", "Cambio de aire acondicionado central"], inputs: { name: "name", addr: "addr", city: "city", model: "ac_model", serial: "ac_serial", refrig: "ac_refrig", panel: "panel", duct: "duct", c1: "c1", c2: "c2", c3: "c3", c4: "c4" } },
  { id: "furnace-coil", type: "Furnace + coil change-out", name: ["Furnace + coil change-out", "Cambio de horno + serpentín"], inputs: { name: "name", addr: "addr", city: "city", model: "fu_model", serial: "fu_serial", coilModel: "coil_model", coilSerial: "coil_serial", fuFurnace: "fu_furnace", fuCoil: "fu_coil", fuOutdoor: "fu_outdoor", fuRefrig: "fu_refrig", fuOk: "fu_ok", panel: "panel", duct: "duct", c1: "c1", c2: "c2", c3: "c3", c4: "c4" } },
];

// Exact known jurisdictions only (the ones the office can already confirm on a job).
export const REFERENCES: Reference[] = [
  { jurisdictionCode: "US-CA-SAN-DIEGO-COUNTY-UNINC", kind: "permit_office", title: ["Official permit office: San Diego County PDS", "Oficina oficial de permisos: PDS del condado de San Diego"], url: "https://www.sandiegocounty.gov/content/sdc/pds/pdsonlineservices.html/", recordedOn: "2026-11-22" },
  { jurisdictionCode: "US-CA-SAN-DIEGO-COUNTY-UNINC", kind: "inspection_schedule", title: ["Inspection dates from PDS 807 Part 2 (shown on the job's timeline, needs review)", "Fechas de inspección de PDS 807 Parte 2 (en la línea de tiempo del trabajo, requiere revisión)"], url: "https://www.sandiegocounty.gov/content/sdc/pds/pdsonlineservices.html/", recordedOn: "2026-11-22", note: ["A reference only. It is not an approved check.", "Solo una referencia. No es una verificación aprobada."] },
  { jurisdictionCode: "US-CA-SAN-DIEGO-CITY", kind: "permit_office", title: ["Official permit office: City of San Diego mechanical permit", "Oficina oficial de permisos: permiso mecánico de la Ciudad de San Diego"], url: "https://www.sandiego.gov/development-services/permits/mechanical-permit", recordedOn: "2026-11-22" },
  { jurisdictionCode: "US-CA-SACRAMENTO-CITY", kind: "permit_office", title: ["Official permit office: City of Sacramento minor permits", "Oficina oficial de permisos: permisos menores de la Ciudad de Sacramento"], url: "https://www.cityofsacramento.gov/community-development/building/permit-services/minor-permits", recordedOn: "2026-11-22" },
];

export const PACK: RulePack = {
  packId: "permitdraft-documentation", version: "2026-11-22.1", releasedOn: "2026-11-22",
  jurisdictions: [
    { code: "US", layer: "country", name: ["United States", "Estados Unidos"] },
    { code: "US-CA", layer: "state", name: ["California", "California"], parent: "US" },
    { code: "US-CA-SAN-DIEGO-COUNTY-UNINC", layer: "county", name: ["Unincorporated San Diego County", "Condado de San Diego no incorporado"], parent: "US-CA" },
    { code: "US-CA-SAN-DIEGO-CITY", layer: "city", name: ["City of San Diego", "Ciudad de San Diego"], parent: "US-CA" },
    { code: "US-CA-SACRAMENTO-CITY", layer: "city", name: ["City of Sacramento", "Ciudad de Sacramento"], parent: "US-CA" },
  ],
  workflows: WORKFLOWS,
  rules: D.map((d) => ({ ...base, id: `app-doc-${d.id}`, appliesTo: { workflows: d.wf }, requires: d.req, text: d.text, todo: d.todo, why: DOC_WHY })),
  references: REFERENCES,
};

/** Maps the saved job's old jurisdiction choice (inspection timeline) to an exact code. Vague old values map to nothing. */
export const JURIS_CODE: Record<string, string | null> = {
  county: "US-CA-SAN-DIEGO-COUNTY-UNINC", "sandiego-city": "US-CA-SAN-DIEGO-CITY", "sacramento-city": "US-CA-SACRAMENTO-CITY",
  city: null, sacramento: null, unknown: null, "": null,
};
