import type { Captured } from "./captured";
import { SLOTS, type Slot } from "./photos";

type L = [string, string];
export type CapField = { key: string; label: L; step: number; required?: boolean; kind?: "text" | "check" | "duct" | "choice" };

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
    { key: "fu_furnace", label: ["Furnace: kept or replaced", "Horno: conservado o reemplazado"], step: 2, required: true, kind: "choice" },
    { key: "fu_coil", label: ["Indoor coil: kept or replaced", "Serpentín interior: conservado o reemplazado"], step: 2, required: true, kind: "choice" },
    { key: "fu_outdoor", label: ["Outdoor unit: kept, replaced or not present", "Unidad exterior: conservada, reemplazada o no presente"], step: 2, required: true, kind: "choice" },
    { key: "fu_refrig", label: ["Refrigerant work done", "Trabajo con refrigerante realizado"], step: 2, required: true, kind: "choice" },
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

/** Nameplate model and serial of equipment the tech answered was kept are optional. Unanswered stays required. */
export function retainedField(key: string, values: Record<string, string>): boolean {
  if (key === "fu_model" || key === "fu_serial") return values.fu_furnace === "retained";
  if (key === "coil_model" || key === "coil_serial") return values.fu_coil === "retained";
  return false;
}
export function activeType(c: Captured): string { return c.values.type ?? c.formDefaults.type ?? ""; }
export function fieldSets(c: Captured): CapField[] {
  const type = activeType(c);
  return [...SITE, { key: "type", label: ["Equipment type", "Tipo de equipo"], step: 2 }, ...equipFields(type).map((f) => (type === FURNACE && retainedField(f.key, c.values) ? { ...f, required: false } : f)), ...WORK, ...CHECKS.filter((f) => { const ok = applicableChecks(type, c.values); return ok.includes(f.key) || (f.key === "sub" || f.key === "sup" ? ok.includes("c2") : false); })];
}
export const DUCT_LABEL: Record<string, L> = {
  sealed: ["Sealed and verified", "Sellado y verificado"], not: ["Not sealed", "No sellado"], exempt: ["Exempt, with reason", "Exento, con motivo"],
};
/** Captured details that belong to no field of this capture (kept as evidence). Blank strings are kept only when non-empty. */
export function uncategorized(c: Captured): [string, string][] {
  const known = new Set([...fieldSets(c).map((f) => f.key), ...Object.values(READING_UNIT_KEY), ...["c1", "c2", "c3", "c4"].flatMap((k) => [scopeKeyOf(k), invKeyOf(k)]), ...PLATE_SLOTS_LIST.map(staleKeyOf)]);
  return Object.entries(c.values).filter(([k, v]) => !known.has(k) && String(v).trim() !== "") as [string, string][];
}

export function captureSummary(c: Captured, lang: "en" | "es") {
  const has = (k: string) => String(c.values[k] ?? "").trim() !== "";
  const required = fieldSets(c).filter((f) => f.required);
  const missingFields = required.filter((f) => !has(f.key)).length;
  const missingPhotos = missingSlots(activeType(c), c.values, Object.fromEntries(c.photos.map((p) => [p.slot, p.savedAt]))).length;
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
  work: "wk", panel: "pa", duct: "ds", ductReason: "dr", sub: "sub", sup: "sup", fu_outdoor: "fuo", fu_refrig: "fur", fu_furnace: "ffu", fu_coil: "fco",
};

const FURNACE = "Furnace + coil change-out";
/**
 * The furnace + coil scope matrix. One place decides what each existing answer requires; Photos, Final checks,
 * Still needed, the review draft, the office rules and the server's Finish validation all read it. Office
 * documentation rules only. Answers are asked outright, never inferred from identifiers, never defaulted, and an
 * unanswered scope question hides nothing it could still require: it is asked for instead.
 *
 *   Answer                     requires
 *   fu_furnace = replaced      furnace data plate photo (plate_furnace)
 *   fu_coil = replaced         indoor coil data plate photo (plate_coil) + refrigerant circuit checks and gauge photo
 *   fu_outdoor = replaced      outdoor data plate photo (plate_outdoor) + outdoor photo + location check + refrigerant circuit checks and gauge photo
 *   fu_refrig = yes            refrigerant circuit checks and gauge photo (also when only the coil changed)
 *   retained / kept / none     nothing extra; any photo already saved stays as optional evidence
 *   Universal (every job)      equipment label readable check, panel amps, duct sealing answer, address
 * The app has no furnace/combustion, fuel or condensate check yet, so none is gated here.
 */
export const FU_SCOPE_KEYS = ["fu_furnace", "fu_coil", "fu_outdoor", "fu_refrig"] as const;
export const FU_FURNACE_OPTS: [string, L][] = [
  ["replaced", ["Replaced", "Reemplazado"]],
  ["retained", ["Kept (not replaced)", "Conservado (no reemplazado)"]],
];
export const FU_COIL_OPTS: [string, L][] = [
  ["replaced", ["Replaced", "Reemplazado"]],
  ["retained", ["Kept (not replaced)", "Conservado (no reemplazado)"]],
];
/** The two furnace + coil answers about the outdoor unit and refrigerant. Asked outright, never defaulted. */
export const FU_OUTDOOR_OPTS: [string, L][] = [
  ["kept", ["Kept (not replaced)", "Conservada (no reemplazada)"]],
  ["replaced", ["Replaced", "Reemplazada"]],
  ["none", ["Not present (no outdoor unit)", "No presente (sin unidad exterior)"]],
];
export const FU_REFRIG_OPTS: [string, L][] = [
  ["no", ["No refrigerant work", "Sin trabajo con refrigerante"]],
  ["yes", ["Yes, refrigerant work was done", "Sí, se hizo trabajo con refrigerante"]],
];
const OPTS: Record<string, [string, L][]> = { fu_furnace: FU_FURNACE_OPTS, fu_coil: FU_COIL_OPTS, fu_outdoor: FU_OUTDOOR_OPTS, fu_refrig: FU_REFRIG_OPTS };
export function answerLabel(key: string, v: string): L | null {
  return (OPTS[key] ?? []).find(([k]) => k === v)?.[1] ?? null;
}
const okAnswer = (key: string, v: string | undefined) => !!answerLabel(key, String(v ?? ""));
/** Furnace + coil answers still missing, and whether they contradict (no outdoor unit, yet refrigerant work done). */
export function furnaceAnswers(type: string | undefined, values: Record<string, string>) {
  if (type !== FURNACE) return { missing: [] as string[], contradiction: false };
  const missing = FU_SCOPE_KEYS.filter((k) => !okAnswer(k, values[k])) as string[];
  return { missing, contradiction: values.fu_outdoor === "none" && values.fu_refrig === "yes" };
}
/** Slots for the distinct data plate photos, one per piece of equipment actually replaced. */
export const PLATE_SLOT_FOR: Record<string, Slot> = { fu_furnace: "plate_furnace", fu_coil: "plate_coil", fu_outdoor: "plate_outdoor" };
/** What the scope answers make certain. Unanswered questions make nothing certain (they are asked for, not assumed). */
export function furnaceScope(values: Record<string, string>) {
  const furnace = values.fu_furnace === "replaced", coil = values.fu_coil === "replaced", outdoor = values.fu_outdoor === "replaced";
  return {
    furnace, coil, outdoor,
    /** Refrigerant circuit work: refrigerant work was done, or the indoor coil or outdoor unit was replaced (coil-only counts). */
    refrigerant: values.fu_refrig === "yes" || coil || outdoor,
  };
}
/**
 * Per-answer dependencies. A Final check depends only on the part of the scope that decides whether it applies and what it is
 * about, in terms of the actual work (replaced or not, refrigerant work or not), never on every answer:
 *   c1 outdoor location   -> outdoor unit replaced
 *   c2 / c3 refrigerant   -> refrigerant work, indoor coil replaced, outdoor unit replaced
 *   c4 equipment label    -> nothing (universal)
 * A change to an answer outside a check's dependencies (furnace kept/replaced, or kept -> not present for the outdoor unit)
 * leaves that check's confirmation exactly as it was.
 */
const DEP_LABEL: Record<string, { s: L; y: L; n: L }> = {
  o: { s: ["Outdoor unit", "Unidad exterior"], y: ["replaced", "reemplazada"], n: ["not replaced", "no reemplazada"] },
  c: { s: ["Indoor coil", "Serpentín interior"], y: ["replaced", "reemplazado"], n: ["not replaced", "no reemplazado"] },
  r: { s: ["Refrigerant work", "Trabajo con refrigerante"], y: ["done", "realizado"], n: ["not done", "no realizado"] },
};
const CHECK_DEPS: Record<string, string[]> = { c1: ["o"], c2: ["r", "c", "o"], c3: ["r", "c", "o"], c4: [] };
function depValue(d: string, values: Record<string, string>): string {
  const a = d === "o" ? values.fu_outdoor : d === "c" ? values.fu_coil : values.fu_refrig;
  const known = d === "o" ? ["kept", "replaced", "none"] : d === "c" ? ["replaced", "retained"] : ["yes", "no"];
  if (!known.includes(a ?? "")) return `${d}?`;
  return `${d}${a === (d === "r" ? "yes" : "replaced") ? 1 : 0}`;
}
/** The scope a check's confirmation was given under (its dependencies only). "?" marks an unanswered dependency. */
export function checkScope(k: string, values: Record<string, string>): string {
  return (CHECK_DEPS[k] ?? []).map((d) => depValue(d, values)).join("|");
}
/** The older stored form (raw answers joined), still honoured so saved jobs keep their confirmations. */
function legacyScope(k: string, values: Record<string, string>): string {
  const keys: Record<string, string[]> = { c1: ["fu_outdoor"], c2: ["fu_refrig", "fu_coil", "fu_outdoor"], c3: ["fu_refrig", "fu_coil", "fu_outdoor"], c4: [] };
  return (keys[k] ?? []).map((x) => values[x] ?? "").join("|");
}
export const scopeKeyOf = (k: string) => `${k}_sc`;
/** Set when a scope change touched a confirmation: it then stays "Review again" until the tech confirms it again, even if the scope changes back. */
export const invKeyOf = (k: string) => `${k}_inv`;
/** The stored scope still stands for this check (and is fully answered). */
function scopeStands(values: Record<string, string>, k: string): boolean {
  const now = checkScope(k, values);
  if (now.includes("?")) return false;
  const was = values[scopeKeyOf(k)] ?? "";
  return was === now || was === legacyScope(k, values);
}
/** Was this check confirmed once (a stored tick) but can no longer count? Its value is shown as reference only. */
export function checkNeedsReview(type: string | undefined, values: Record<string, string>, k: string): boolean {
  if (type !== FURNACE || values[k] !== "1") return false;
  return values[invKeyOf(k)] === "1" || !scopeStands(values, k);
}
/** Is this Final check confirmed for the job as it stands now? Furnace + coil confirmations must match the current scope and not be flagged. */
export function checkConfirmed(type: string | undefined, values: Record<string, string>, k: string): boolean {
  if (values[k] !== "1") return false;
  if (type !== FURNACE) return true;
  return !checkNeedsReview(type, values, k);
}
/** Why a confirmation needs another look: the dependencies that differ from when it was given. */
export function reviewReason(values: Record<string, string>, k: string): L {
  const was = (values[scopeKeyOf(k)] ?? "").split("|"), now = checkScope(k, values).split("|");
  const diff = (CHECK_DEPS[k] ?? []).map((d, i) => ({ d, w: was.find((x) => x[0] === d) ?? "", n: now[i] })).filter((x) => x.w !== x.n && x.w !== "");
  if (diff.length === 0) return ["The job's scope changed after you confirmed this. Confirm it again.", "El alcance del trabajo cambió después de confirmar esto. Confírmelo de nuevo."];
  const word = (d: string, v: string, i: 0 | 1) => (v.endsWith("1") ? DEP_LABEL[d].y[i] : v.endsWith("0") ? DEP_LABEL[d].n[i] : i ? "sin responder" : "not answered");
  const en = diff.map((x) => `${DEP_LABEL[x.d].s[0]}: was ${word(x.d, x.w, 0)}, now ${word(x.d, x.n, 0)}`).join("; ");
  const es = diff.map((x) => `${DEP_LABEL[x.d].s[1]}: antes ${word(x.d, x.w, 1)}, ahora ${word(x.d, x.n, 1)}`).join("; ");
  return [`${en}. Confirm it again.`, `${es}. Confírmelo de nuevo.`];
}
/** Values to store when a check is ticked or unticked. Ticking confirms under the current scope and lifts any review flag. */
export function tickValues(type: string | undefined, values: Record<string, string>, k: string, on: boolean): Record<string, string> {
  if (!on) return { [k]: "", [scopeKeyOf(k)]: "", [invKeyOf(k)]: "" };
  return { [k]: "1", [scopeKeyOf(k)]: type === FURNACE ? checkScope(k, values) : "", [invKeyOf(k)]: "" };
}
/** Replaced-ness of each piece of equipment decides whose data plate a photo can stand for. */
const PLATE_SCOPE: Record<Slot, string | undefined> = { plate_furnace: "fu_furnace", plate_coil: "fu_coil", plate_outdoor: "fu_outdoor" } as never;
export const staleKeyOf = (slot: string) => `${slot}_stale`;
/** A saved plate photo marked stale (taken before its equipment's scope changed) no longer counts until retaken or kept on purpose. */
export function photoStale(values: Record<string, string>, slot: Slot, savedAt: number | undefined): boolean {
  const m = values[staleKeyOf(slot)];
  return !!m && savedAt !== undefined && m === String(savedAt);
}
/**
 * What a change from one set of answers to the next touches, so only affected items are invalidated:
 * confirmed checks whose own dependencies changed (or all, when the job type moved to or from furnace + coil) are flagged for review,
 * and a saved plate photo of equipment whose replaced/kept answer changed is marked stale. The old values stay as reference.
 */
export function scopeChangePatch(prev: Record<string, string>, next: Record<string, string>, photoTimes: Partial<Record<Slot, number>>): Record<string, string> {
  const patch: Record<string, string> = {};
  const pt = prev.type ?? "", nt = next.type ?? "";
  if (nt !== FURNACE && pt !== FURNACE) return patch;
  const typeMoved = pt !== nt;
  for (const k of ["c1", "c2", "c3", "c4"]) {
    if (next[k] !== "1") continue;
    if (typeMoved || (nt === FURNACE && !scopeStands(next, k))) patch[invKeyOf(k)] = "1";
  }
  for (const slot of PLATE_SLOTS_LIST) {
    const key = PLATE_SCOPE[slot]!, at = photoTimes[slot];
    if (at === undefined) continue;
    if (typeMoved || (prev[key] === "replaced") !== (next[key] === "replaced")) patch[staleKeyOf(slot)] = String(at);
  }
  return patch;
}
const PLATE_SLOTS_LIST: Slot[] = ["plate_furnace", "plate_coil", "plate_outdoor"];
/**
 * Final checks that apply to this job. The equipment label check always applies. Heat pump and central AC keep all four.
 * Furnace + coil: the outdoor location check when the outdoor unit was replaced, the refrigerant checks on refrigerant circuit work.
 */
export function applicableChecks(type: string | undefined, values: Record<string, string>): string[] {
  if (type === FURNACE) {
    const sc = furnaceScope(values);
    return ["c1", "c2", "c3", "c4"].filter((k) => k === "c4" || (k === "c1" ? sc.outdoor : sc.refrigerant));
  }
  return ["c1", "c2", "c3", "c4"];
}
/** Required photo slots for this job. Furnace + coil: a distinct data plate photo per replaced piece of equipment. */
export function requiredSlots(type: string | undefined, values: Record<string, string>): Slot[] {
  if (type !== FURNACE) return SLOTS;
  const sc = furnaceScope(values);
  const out: Slot[] = [];
  if (sc.furnace) out.push("plate_furnace");
  if (sc.coil) out.push("plate_coil");
  if (sc.outdoor) out.push("plate_outdoor", "outdoor");
  if (sc.refrigerant) out.push("gauge");
  return out;
}
/** Required slots with no usable photo: none saved, or the saved plate photo predates a change to its equipment's scope. */
export function missingSlots(type: string | undefined, values: Record<string, string>, photoTimes: Partial<Record<Slot, number>>): Slot[] {
  return requiredSlots(type, values).filter((s) => photoTimes[s] === undefined || photoStale(values, s, photoTimes[s]));
}
/** Every answer and flag a step needs to judge scope, read through one getter. */
export function scopeValues(get: (k: string) => string): Record<string, string> {
  const keys = ["type", ...FU_SCOPE_KEYS, ...["c1", "c2", "c3", "c4"].flatMap((k) => [k, scopeKeyOf(k), invKeyOf(k)]), ...PLATE_SLOTS_LIST.map(staleKeyOf)];
  return Object.fromEntries(keys.map((k) => [k, get(k)]));
}
const CHECK_DEPENDENTS: Record<string, string[]> = { c2: ["sub", "sup", "sub_unit", "sup_unit"] };
/** Values with answers for checks (and readings) that do not apply to this job removed. Nothing is removed while an answer is missing. */
export function cleanValues(type: string | undefined, values: Record<string, string>): Record<string, string> {
  if (furnaceAnswers(type, values).missing.length > 0) return { ...values };
  const ok = new Set(applicableChecks(type, values));
  const out = { ...values };
  for (const k of ["c1", "c2", "c3", "c4"]) if (!ok.has(k)) { delete out[k]; delete out[scopeKeyOf(k)]; delete out[invKeyOf(k)]; for (const d of CHECK_DEPENDENTS[k] ?? []) delete out[d]; }
  return out;
}
