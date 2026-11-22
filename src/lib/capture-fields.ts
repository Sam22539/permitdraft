import type { Captured } from "./captured";
import { SLOTS } from "./photos";

type L = [string, string];
export type CapField = { key: string; label: L; step: number; required?: boolean; kind?: "text" | "check" | "duct" };

const SITE: CapField[] = [
  { key: "name", label: ["Homeowner name", "Nombre del propietario"], step: 1, required: true },
  { key: "phone", label: ["Phone", "Teléfono"], step: 1 },
  { key: "addr", label: ["Job site address", "Dirección del sitio"], step: 1, required: true },
  { key: "city", label: ["City", "Ciudad"], step: 1, required: true },
];
const WORK: CapField[] = [
  { key: "work", label: ["Work performed", "Trabajo realizado"], step: 3 },
  { key: "panel", label: ["Panel size (amps)", "Amperios del panel"], step: 3, required: true },
  { key: "duct", label: ["Duct sealing answer", "Respuesta de sellado de ductos"], step: 3, required: true, kind: "duct" },
  { key: "ductReason", label: ["Reason for exemption", "Motivo de la exención"], step: 3 },
];
const CHECKS: CapField[] = [
  { key: "c1", label: ["Outdoor unit location recorded", "Ubicación de la unidad exterior registrada"], step: 4, kind: "check" },
  { key: "c2", label: ["Refrigerant charge reading taken", "Lectura de carga de refrigerante tomada"], step: 4, kind: "check" },
  { key: "sub", label: ["Subcooling", "Subenfriamiento"], step: 4 },
  { key: "sup", label: ["Superheat", "Sobrecalentamiento"], step: 4 },
  { key: "c3", label: ["Refrigerant type matches data plate", "El tipo de refrigerante coincide con la placa"], step: 4, kind: "check" },
  { key: "c4", label: ["Equipment label photo readable", "Foto de la etiqueta del equipo legible"], step: 4, kind: "check" },
];

export function equipFields(type: string): CapField[] {
  if (type === "Furnace + coil change-out") return [
    { key: "fu_maker", label: ["Furnace manufacturer", "Fabricante del horno"], step: 2 },
    { key: "fu_model", label: ["Furnace model number", "Número de modelo del horno"], step: 2, required: true },
    { key: "fu_serial", label: ["Furnace serial number", "Número de serie del horno"], step: 2, required: true },
    { key: "coil_maker", label: ["Indoor coil manufacturer", "Fabricante del serpentín interior"], step: 2 },
    { key: "coil_model", label: ["Indoor coil model number", "Número de modelo del serpentín interior"], step: 2, required: true },
    { key: "coil_serial", label: ["Indoor coil serial number", "Número de serie del serpentín interior"], step: 2, required: true },
  ];
  const p = type === "Heat pump change-out" ? "" : "ac_";
  const w = p ? ["Outdoor AC", "Aire acondicionado exterior"] : ["Outdoor heat pump", "Bomba de calor exterior"];
  return [
    { key: p + "maker", label: [`${w[0]} manufacturer`, `Fabricante: ${w[1]}`], step: 2 },
    { key: p + "model", label: [`${w[0]} model number`, `Modelo: ${w[1]}`], step: 2, required: true },
    { key: p + "serial", label: [`${w[0]} serial number`, `Serie: ${w[1]}`], step: 2, required: true },
    { key: p + "refrig", label: ["Refrigerant type", "Tipo de refrigerante"], step: 2, required: true },
    { key: p + "loc", label: ["Outdoor unit location", "Ubicación de la unidad exterior"], step: 2 },
  ];
}

/** Which unit each equipment reading was taken at, stored beside the reading as the tech chose it. Never inferred. */
export const READING_UNIT_KEY: Record<string, string> = { sub: "sub_unit", sup: "sup_unit" };
export const UNIT_LABEL: Record<string, L> = { indoor: ["Indoor unit", "Unidad interior"], outdoor: ["Outdoor unit", "Unidad exterior"] };
export const UNIT_NONE: L = ["Unit not specified", "Unidad no especificada"];
export function readingUnit(values: Record<string, string>, reading: string): L {
  const k = READING_UNIT_KEY[reading];
  const v = k ? values[k] : undefined;
  return v && UNIT_LABEL[v] ? UNIT_LABEL[v] : UNIT_NONE;
}

export function activeType(c: Captured): string { return c.values.type ?? c.formDefaults.type ?? ""; }
export function fieldSets(c: Captured): CapField[] {
  const type = activeType(c);
  return [...SITE, { key: "type", label: ["Equipment type", "Tipo de equipo"], step: 2 }, ...equipFields(type), ...WORK, ...CHECKS];
}
export const DUCT_LABEL: Record<string, L> = {
  sealed: ["Sealed and verified", "Sellado y verificado"], not: ["Not sealed", "No sellado"], exempt: ["Exempt, with reason", "Exento, con motivo"],
};
/** Captured details that belong to no field of this capture (kept as evidence). Blank strings are kept only when non-empty. */
export function uncategorized(c: Captured): [string, string][] {
  const known = new Set([...fieldSets(c).map((f) => f.key), ...Object.values(READING_UNIT_KEY)]);
  return Object.entries(c.values).filter(([k, v]) => !known.has(k) && String(v).trim() !== "") as [string, string][];
}

export function captureSummary(c: Captured, lang: "en" | "es") {
  const has = (k: string) => String(c.values[k] ?? "").trim() !== "";
  const required = fieldSets(c).filter((f) => f.required);
  const missingFields = required.filter((f) => !has(f.key)).length;
  const missingPhotos = SLOTS.filter((s) => !c.photos.some((p) => p.slot === s)).length;
  const addr = [c.values.addr, c.values.city].filter((x) => x && x.trim()).join(", ");
  const type = activeType(c);
  return {
    missing: missingFields + missingPhotos,
    addr: addr || (lang === "es" ? "Dirección no capturada" : "Address not captured"),
    equip: type || (lang === "es" ? "Tipo de equipo no capturado" : "Equipment type not captured"),
  };
}

/** Capture screens in step order (Core paths; the demo prefixes /demo). */
export const STEP_ROUTES = ["/new", "/new/equipment", "/new/work", "/new/checks", "/new/photos"] as const;
/**
 * The exact input (its element id on the capture step) that captures each draft field. Used by the review draft's
 * capture action to open the right step and highlight the right input. Checks and photos have no text input here.
 */
export const FIX_INPUT_ID: Record<string, string> = {
  name: "n", phone: "p", addr: "a", city: "c", type: "et",
  maker: "mf", model: "mo", serial: "se", refrig: "rf", loc: "ol",
  ac_maker: "mf", ac_model: "mo", ac_serial: "se", ac_refrig: "rf", ac_loc: "ol",
  fu_maker: "fmf", fu_model: "fmo", fu_serial: "fse", coil_maker: "cmf", coil_model: "cmo", coil_serial: "cse",
  work: "wk", panel: "pa", duct: "ds", ductReason: "dr", sub: "sub", sup: "sup",
};
