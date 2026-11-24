import { useEffect, useState } from "react";
import { backend } from "../lib/backend";
import { useLang } from "../lib/lang";
import { STAGE_LABEL } from "./report-charts";

type Ev = { id: string; from_stage: string; to_stage: string; actor: string; at: string };

/** Private, append-only list of the office's real stage changes for one job. Read through the database's own company/role rule. */
export function StageHistory({ packetId, version }: { packetId: string; version?: string }) {
  const { t, lang } = useLang();
  const [rows, setRows] = useState<Ev[] | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let live = true;
    setRows(null); setFailed(false);
    backend.from("packet_stage_events").select("id, from_stage, to_stage, actor, at").eq("packet_id", packetId).order("at", { ascending: false }).order("id").limit(200)
      .then(({ data, error }) => { if (!live) return; if (error) setFailed(true); else setRows((data ?? []) as Ev[]); });
    return () => { live = false; };
  }, [packetId, version]);
  const name = (k: string) => t(...(STAGE_LABEL[k] ?? STAGE_LABEL.new));
  const when = (iso: string) => new Date(iso).toLocaleString(lang === "es" ? "es" : "en-US", { dateStyle: "medium", timeStyle: "short" });
  return (
    <div className="crm-drawer-sec" data-testid="stage-history">
      <h3 className="crm-h3">{t("Office stage changes", "Cambios de etapa de la oficina")}</h3>
      <p className="crm-note">{t("Internal history of stage changes your office made in PermitDraft, kept from when this history began. Not a filing and not confirmation from any local permit authority.", "Historial interno de cambios de etapa que su oficina hizo en PermitDraft, guardado desde que empezó este historial. No es una presentación ni una confirmación de ninguna autoridad local de permisos.")}</p>
      {failed ? <p className="crm-note" role="status">{t("The history could not be loaded.", "No se pudo cargar el historial.")}</p>
        : rows === null ? <p className="crm-note" role="status">{t("Loading…", "Cargando…")}</p>
        : rows.length === 0 ? <p className="crm-note" data-testid="stage-history-empty">{t("No stage changes recorded yet.", "Aún no hay cambios de etapa registrados.")}</p>
        : (
          <ol className="crm-tl" data-testid="stage-history-list">
            {rows.map((e) => (
              <li key={e.id} className="rec"><span className="crm-tl-dot" aria-hidden /><div><strong>{name(e.from_stage)} → {name(e.to_stage)}</strong><span className="crm-sub">{when(e.at)} · {e.actor}</span></div></li>
            ))}
          </ol>
        )}
    </div>
  );
}
