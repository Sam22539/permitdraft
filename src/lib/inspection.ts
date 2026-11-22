import { useSyncExternalStore } from "react";

export const RULE_SOURCE = "PDS 807 Part 2";
export const RULE_CHECKED = "2026-11-22";

export type Juris = "" | "county" | "city" | "sacramento" | "unknown";
export type Insp = {
  juris: Juris; issue: string; lastPassed: string; next: string; gapConfirmed: boolean;
  renewExpiry: string; renewSource: string; renewChecked: string;
};
const EMPTY: Insp = { juris: "", issue: "", lastPassed: "", next: "", gapConfirmed: false, renewExpiry: "", renewSource: "", renewChecked: "" };
const KEY = "permitdraft-inspection-hp-1187";

let cache: Insp = EMPTY;
let loaded = false;
const subs = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) cache = { ...EMPTY, ...JSON.parse(raw) };
  } catch { /* ignore */ }
}
function emit() { subs.forEach((f) => f()); }
export function setInsp(patch: Partial<Insp>) {
  load();
  cache = { ...cache, ...patch };
  try { window.localStorage.setItem(KEY, JSON.stringify(cache)); } catch { /* ignore */ }
  emit();
}
export function useInsp(): Insp {
  return useSyncExternalStore(
    (cb) => {
      subs.add(cb);
      const onStorage = (e: StorageEvent) => { if (e.key === KEY) { loaded = false; load(); emit(); } };
      window.addEventListener("storage", onStorage);
      // first client subscribe: pick up saved values after hydration
      load(); cb();
      return () => { subs.delete(cb); window.removeEventListener("storage", onStorage); };
    },
    () => { load(); return cache; },
    () => EMPTY,
  );
}

const ymd = /^\d{4}-\d{2}-\d{2}$/;
export function parse(s: string): Date | null {
  if (!ymd.test(s)) return null;
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCMonth() === m - 1 ? dt : null;
}
export function iso(d: Date) { return d.toISOString().slice(0, 10); }
export function addYears(s: string, n: number): string | null {
  const d = parse(s); if (!d) return null;
  const y = d.getUTCFullYear() + n, m = d.getUTCMonth();
  const r = new Date(Date.UTC(y, m, d.getUTCDate()));
  if (r.getUTCMonth() !== m) return iso(new Date(Date.UTC(y, m + 1, 0)));
  return iso(r);
}
export function addDays(s: string, n: number): string | null {
  const d = parse(s); if (!d) return null;
  return iso(new Date(d.getTime() + n * 86400000));
}
export function todayIso() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
}
export function daysBetween(a: string, b: string) {
  return Math.round(((parse(b)?.getTime() ?? 0) - (parse(a)?.getTime() ?? 0)) / 86400000);
}

export type State = "overdue" | "due" | "upcoming" | "completed" | "needed";
export type Item = { key: string; en: string; es: string; date: string | null; state: State; detail?: [string, string]; rule: boolean };

export function stateFor(date: string, today: string): State {
  const d = daysBetween(today, date);
  return d < 0 ? "overdue" : d <= 30 ? "due" : "upcoming";
}

export function computeItems(v: Insp, today: string): Item[] {
  if (v.juris !== "county") return [];
  const out: Item[] = [];
  const first = v.issue ? addYears(v.issue, 2) : null;
  if (!first) {
    out.push({ key: "first", en: "First valid inspection (issue + 2 years)", es: "Primera inspección válida (emisión + 2 años)", date: null, state: "needed", rule: true });
  } else if (v.lastPassed && parse(v.lastPassed) && daysBetween(v.lastPassed, first) >= 0) {
    out.push({ key: "first", en: "First valid inspection (issue + 2 years)", es: "Primera inspección válida (emisión + 2 años)", date: first, state: "completed", detail: ["Passed inspection recorded " + v.lastPassed, "Inspección aprobada registrada " + v.lastPassed], rule: true });
  } else {
    out.push({ key: "first", en: "First valid inspection (issue + 2 years)", es: "Primera inspección válida (emisión + 2 años)", date: first, state: stateFor(first, today), rule: true });
  }
  const max = v.issue ? addYears(v.issue, 3) : null;
  out.push({ key: "max", en: "Maximum permit life (issue + 3 years)", es: "Vida máxima del permiso (emisión + 3 años)", date: max, state: max ? stateFor(max, today) : "needed", rule: true });
  const p180 = v.lastPassed && v.gapConfirmed ? addDays(v.lastPassed, 180) : null;
  out.push({
    key: "p180", en: "Progress inspection (last passed + 180 days)", es: "Inspección de avance (última aprobada + 180 días)",
    date: p180, state: p180 ? stateFor(p180, today) : "needed",
    detail: p180 ? undefined : v.gapConfirmed ? ["NEEDED: enter the last passed inspection date", "FALTA: ingrese la fecha de la última inspección aprobada"] : ["NEEDED: office to confirm the next inspection is more than 180 days away", "FALTA: la oficina debe confirmar que la próxima inspección es en más de 180 días"],
    rule: true,
  });
  return out;
}

const rank: Record<State, number> = { overdue: 0, due: 1, upcoming: 2, needed: 3, completed: 4 };
export type Action = { en: string; es: string; date: string | null; state: State | "confirm" };

export function urgentAction(v: Insp, today: string): Action {
  if (!v.juris) return { en: "Confirm jurisdiction", es: "Confirmar jurisdicción", date: null, state: "confirm" };
  if (v.juris === "unknown") return { en: "Jurisdiction unknown: office to confirm", es: "Jurisdicción desconocida: la oficina debe confirmar", date: null, state: "confirm" };
  if (v.juris !== "county") return { en: "County dates not applied: office to confirm this city's rule", es: "Fechas del condado no aplicadas: la oficina debe confirmar la regla de la ciudad", date: null, state: "confirm" };
  if (!v.issue) return { en: "Enter permit issue date", es: "Ingrese la fecha de emisión del permiso", date: null, state: "confirm" };
  const items = computeItems(v, today);
  if (v.renewExpiry && parse(v.renewExpiry)) items.push({ key: "renew", en: "Renewed permit expiry", es: "Vencimiento del permiso renovado", date: v.renewExpiry, state: stateFor(v.renewExpiry, today), rule: false });
  const sorted = items.slice().sort((a, b) => rank[a.state] - rank[b.state] || (a.date ?? "").localeCompare(b.date ?? ""));
  const top = sorted[0];
  if (top.state === "completed") return { en: "Inspection milestones complete", es: "Hitos de inspección completos", date: null, state: "completed" };
  if (top.state === "needed") return { en: "Confirm next inspection is more than 180 days away", es: "Confirmar que la próxima inspección es en más de 180 días", date: null, state: "confirm" };
  return { en: top.en, es: top.es, date: top.date, state: top.state };
}
