import { Input } from "./ui/input";
import { Checkbox } from "./ui/checkbox";
import { useLang } from "../lib/lang";
import { RULE_CHECKED, RULE_SOURCE, addYears, computeItems, daysBetween, parse, setInsp, stateFor, todayIso, useInsp, type Juris, type State } from "../lib/inspection";

const MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_ES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
export function fmtDate(s: string, lang: "en" | "es") {
  const d = parse(s); if (!d) return s;
  const m = (lang === "es" ? MONTHS_ES : MONTHS_EN)[d.getUTCMonth()];
  return lang === "es" ? `${d.getUTCDate()} ${m} ${d.getUTCFullYear()}` : `${m} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}
export const STATE_LABEL: Record<State, [string, string]> = {
  overdue: ["Overdue", "Vencido"], due: ["Due soon", "Vence pronto"], upcoming: ["Upcoming", "Próximo"],
  completed: ["Completed", "Completado"], needed: ["NEEDED", "FALTA"],
};
const COLOR: Record<State, string> = { overdue: "#b91c1c", due: "#c2410c", upcoming: "#12264a", completed: "#15803d", needed: "#c2410c" };

const JURIS: [Juris, string, string][] = [
  ["", "Not confirmed", "Sin confirmar"],
  ["county", "Unincorporated San Diego County", "Condado de San Diego no incorporado"],
  ["city", "City of San Diego", "Ciudad de San Diego"],
  ["sacramento", "Sacramento", "Sacramento"],
  ["unknown", "Unknown", "Desconocida"],
];

export function InspectionTimeline() {
  const { t, lang } = useLang();
  const v = useInsp();
  const today = todayIso();
  const items = computeItems(v, today);
  const field = (id: string, en: string, es: string, key: "issue" | "lastPassed" | "next" | "renewChecked") => (
    <div className="grid gap-1">
      <label htmlFor={id} className="font-semibold">{t(en, es)}</label>
      <Input id={id} type="date" value={v[key]} onChange={(e) => setInsp({ [key]: e.target.value })} className="h-12 text-base" />
    </div>
  );
  const renewOk = v.renewExpiry && parse(v.renewExpiry);
  const renewState = renewOk ? stateFor(v.renewExpiry, today) : null;
  const max = v.issue ? addYears(v.issue, 3) : null;
  const beyond = renewOk && max && daysBetween(max, v.renewExpiry) > 0;

  return (
    <section id="inspection-timeline" className="ap-card scroll-mt-4">
      <h2 className="text-xl">{t("Inspection reminders", "Recordatorios de inspección")}</h2>
      <p className="ap-muted text-sm">{t("In-site reminders only. Nothing is sent or filed with the county.", "Solo recordatorios en el sitio. No se envía ni presenta nada al condado.")}</p>

      <div className="grid gap-3">
        <div className="grid gap-1">
          <label htmlFor="insp-juris" className="font-semibold">{t("Jurisdiction (office confirms)", "Jurisdicción (la oficina confirma)")}</label>
          <select id="insp-juris" value={v.juris} onChange={(e) => setInsp({ juris: e.target.value as Juris })} className="h-12 rounded-md border border-input bg-white px-3 text-base">
            {JURIS.map(([k, en, es]) => <option key={k} value={k}>{t(en, es)}</option>)}
          </select>
        </div>
        {field("insp-issue", "Permit issue date", "Fecha de emisión del permiso", "issue")}
        {field("insp-last", "Last passed inspection", "Última inspección aprobada", "lastPassed")}
        {field("insp-next", "Next inspection date", "Fecha de la próxima inspección", "next")}
        <label className="ap-chk" style={{ gap: "1rem" }}>
          <Checkbox id="insp-gap" checked={v.gapConfirmed} onCheckedChange={(c) => setInsp({ gapConfirmed: c === true })} className="size-8 border-2 border-[#12264a] data-[state=checked]:bg-[#12264a]" />
          <span>{t("Office confirms the next inspection is more than 180 days after the last one", "La oficina confirma que la próxima inspección es en más de 180 días después de la última")}</span>
        </label>
      </div>

      {!v.juris && <p className="ap-next" role="status">{t("NEEDED: confirm jurisdiction. No dates are calculated until the office confirms it.", "FALTA: confirme la jurisdicción. No se calculan fechas hasta que la oficina la confirme.")}</p>}
      {v.juris === "unknown" && <p className="ap-next" role="status">{t("OFFICE TO CONFIRM: jurisdiction unknown. No county dates shown.", "LA OFICINA DEBE CONFIRMAR: jurisdicción desconocida. No se muestran fechas del condado.")}</p>}
      {(v.juris === "city" || v.juris === "sacramento") && <p className="ap-next" role="status">{t("County PDS 807 dates do not apply to a city address. OFFICE TO CONFIRM the city's own rule. No county dates shown.", "Las fechas del condado (PDS 807) no aplican a una dirección en la ciudad. LA OFICINA DEBE CONFIRMAR la regla de la ciudad. No se muestran fechas del condado.")}</p>}
      {v.juris === "county" && !v.issue && <p className="ap-next" role="status">{t("NEEDED: enter the permit issue date.", "FALTA: ingrese la fecha de emisión del permiso.")}</p>}

      {v.juris === "county" && (
        <ul className="grid gap-2" aria-label={t("Inspection timeline", "Cronología de inspecciones")}>
          {items.map((i) => (
            <li key={i.key} className="ap-card" data-state={i.state} data-testid={`insp-${i.key}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <strong>{t(i.en, i.es)}</strong>
                <strong style={{ color: COLOR[i.state] }}>{t(...STATE_LABEL[i.state])}</strong>
              </div>
              <p>{i.date ? fmtDate(i.date, lang) : t("NEEDED", "FALTA")}</p>
              {i.detail && <p className="ap-muted text-sm">{t(...i.detail)}</p>}
              <p className="ap-muted text-sm">{t("Source", "Fuente")}: {RULE_SOURCE} · {t("checked", "revisado")} {RULE_CHECKED}</p>
            </li>
          ))}
          <li className="ap-card">
            <strong>{t("Re-inspection / progress fee and renewal fee", "Tarifa de reinspección / avance y tarifa de renovación")}</strong>
            <p className="ap-next">{t("OFFICE TO CONFIRM / NEEDED", "LA OFICINA DEBE CONFIRMAR / FALTA")}</p>
          </li>
        </ul>
      )}
      {v.next && parse(v.next) && <p>{t("Next inspection recorded", "Próxima inspección registrada")}: <strong>{fmtDate(v.next, lang)}</strong></p>}

      <div className="grid gap-3" style={{ borderTop: "1px solid #d6dce8", paddingTop: ".75rem" }}>
        <h3 className="text-lg font-semibold">{t("Renewal (office confirmed)", "Renovación (confirmada por la oficina)")}</h3>
        <div className="grid gap-1">
          <label htmlFor="insp-renew" className="font-semibold">{t("Confirmed renewed expiry", "Vencimiento renovado confirmado")}</label>
          <Input id="insp-renew" type="date" value={v.renewExpiry} onChange={(e) => setInsp({ renewExpiry: e.target.value })} className="h-12 text-base" />
        </div>
        <div className="grid gap-1">
          <label htmlFor="insp-renew-src" className="font-semibold">{t("Source of renewed date", "Fuente de la fecha renovada")}</label>
          <Input id="insp-renew-src" type="text" value={v.renewSource} onChange={(e) => setInsp({ renewSource: e.target.value })} className="h-12 text-base" />
        </div>
        {field("insp-renew-chk", "Date checked", "Fecha de revisión", "renewChecked")}
        {renewOk && renewState ? (
          <div className="ap-card" data-testid="insp-renew">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <strong>{t("Active renewed expiry", "Vencimiento renovado activo")}</strong>
              <strong style={{ color: COLOR[renewState] }}>{t(...STATE_LABEL[renewState])}</strong>
            </div>
            <p>{fmtDate(v.renewExpiry, lang)}</p>
            <p className="ap-muted text-sm">{t("Source", "Fuente")}: {v.renewSource || t("NEEDED", "FALTA")} · {t("checked", "revisado")} {v.renewChecked ? fmtDate(v.renewChecked, lang) : t("NEEDED", "FALTA")}</p>
            <p className="ap-muted text-sm">{t("The original milestones above stay on record. A renewal does not extend the permit beyond its three-year maximum.", "Los hitos originales de arriba se conservan. Una renovación no extiende el permiso más allá de su máximo de tres años.")}</p>
            {beyond && <p className="ap-next">{t("This date is after the three-year maximum. OFFICE TO CONFIRM.", "Esta fecha es posterior al máximo de tres años. LA OFICINA DEBE CONFIRMAR.")}</p>}
          </div>
        ) : (
          <p className="ap-muted">{t("NEEDED: renewal status. Office to confirm which renewal fee applies.", "FALTA: estado de renovación. La oficina debe confirmar qué tarifa aplica.")}</p>
        )}
      </div>
    </section>
  );
}
