import { useEffect, useRef, useState } from "react";
import type * as LType from "leaflet";
import "leaflet/dist/leaflet.css";
import { backend } from "../lib/backend";
import { useLang } from "../lib/lang";
import { Button } from "./ui/button";
import { MapPin } from "lucide-react";

type Job = { id: string; tracking_no: string; job_id: string };
type Pin = { packet_id: string; lat: number; lng: number };

/** Enterprise Job Locations: the company's jobs on a free OpenStreetMap map. Pins are placed by hand by the office, never guessed or looked up from an address. */
export function JobLocations({ company, jobs, onOpen }: { company: string; jobs: Job[]; onOpen: (id: string) => void }) {
  const { t } = useLang();
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LType.Map | null>(null);
  const layerRef = useRef<LType.LayerGroup | null>(null);
  const lib = useRef<typeof LType | null>(null);
  const [ready, setReady] = useState(false);
  const [pins, setPins] = useState<Record<string, Pin> | null>(null);
  const [placing, setPlacing] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState(false);
  const placingRef = useRef<string | null>(null);
  placingRef.current = placing;
  const pinsRef = useRef<Record<string, Pin>>({});
  pinsRef.current = pins ?? {};
  const openRef = useRef(onOpen);
  openRef.current = onOpen;
  const jobsById = useRef<Record<string, Job>>({});
  jobsById.current = Object.fromEntries(jobs.map((j) => [j.id, j]));

  useEffect(() => {
    let live = true;
    backend.from("job_locations").select("packet_id, lat, lng").eq("company_id", company)
      .then(({ data, error }) => { if (!live) return; if (error) { setErr(true); setPins({}); } else setPins(Object.fromEntries((data as Pin[]).map((p) => [p.packet_id, p]))); }, () => { if (live) { setErr(true); setPins({}); } });
    return () => { live = false; };
  }, [company]);

  const save = async (id: string, lat: number, lng: number) => {
    const { data: sess } = await backend.auth.getSession();
    const by = sess.session?.user.email?.toLowerCase() ?? "";
    const rl = { lat: Math.round(lat * 1e5) / 1e5, lng: ((Math.round(lng * 1e5) / 1e5 + 540) % 360) - 180 };
    const { error } = pinsRef.current[id]
      ? await backend.from("job_locations").update({ ...rl, placed_by: by, placed_at: new Date().toISOString() }).eq("packet_id", id)
      : await backend.from("job_locations").insert({ packet_id: id, company_id: company, ...rl, placed_by: by });
    if (error) { setMsg(t("Pin not saved. Check your role and try again.", "No se guardó el pin. Revise su rol e intente de nuevo.")); return; }
    setPins((p) => ({ ...(p ?? {}), [id]: { packet_id: id, ...rl } }));
    setMsg(t("Pin saved.", "Pin guardado."));
  };
  const saveRef = useRef(save);
  saveRef.current = save;

  const remove = async (id: string) => {
    const { error } = await backend.from("job_locations").delete().eq("packet_id", id);
    if (error) { setMsg(t("Pin not removed.", "No se quitó el pin.")); return; }
    setPins((p) => { const n = { ...(p ?? {}) }; delete n[id]; return n; });
    setMsg(t("Pin removed.", "Pin quitado."));
  };

  useEffect(() => {
    let dead = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (dead || !el.current || mapRef.current) return;
      lib.current = L;
      const map = L.map(el.current, { center: [39.5, -98.35], zoom: 4, scrollWheelZoom: false });
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors' }).addTo(map);
      layerRef.current = L.layerGroup().addTo(map);
      map.on("click", (e: LType.LeafletMouseEvent) => {
        const id = placingRef.current;
        if (!id) return;
        setPlacing(null);
        void saveRef.current(id, e.latlng.lat, e.latlng.lng);
      });
      mapRef.current = map;
      setReady(true);
    })();
    return () => { dead = true; mapRef.current?.remove(); mapRef.current = null; setReady(false); };
  }, []);

  const fitted = useRef(false);
  useEffect(() => {
    const L = lib.current, map = mapRef.current, layer = layerRef.current;
    if (!ready || !L || !map || !layer || !pins) return;
    layer.clearLayers();
    const pts: [number, number][] = [];
    for (const p of Object.values(pins)) {
      const j = jobsById.current[p.packet_id];
      if (!j) continue;
      pts.push([p.lat, p.lng]);
      const icon = L.divIcon({ className: "jl-pin", html: `<span title="${j.tracking_no}"></span>`, iconSize: [26, 26], iconAnchor: [13, 26], popupAnchor: [0, -24] });
      const m = L.marker([p.lat, p.lng], { icon, title: j.tracking_no, alt: `Job ${j.tracking_no}`, keyboard: true });
      const box = document.createElement("div");
      const b = document.createElement("strong"); b.textContent = j.tracking_no;
      const btn = document.createElement("button"); btn.type = "button"; btn.className = "jl-open"; btn.textContent = t("Open packet", "Abrir paquete");
      btn.setAttribute("data-testid", "jl-open-packet");
      btn.onclick = () => openRef.current(j.id);
      box.append(b, document.createElement("br"), btn);
      m.bindPopup(box);
      m.on("keypress", () => m.openPopup());
      layer.addLayer(m);
    }
    if (!fitted.current && pts.length) { fitted.current = true; map.fitBounds(pts, { padding: [40, 40], maxZoom: 13 }); }
  }, [ready, pins, jobs, t]);

  useEffect(() => { const c = mapRef.current?.getContainer(); if (c) c.style.cursor = placing ? "crosshair" : ""; }, [placing, ready]);

  const pinned = jobs.filter((j) => pins?.[j.id]);
  const unpinned = jobs.filter((j) => !pins?.[j.id]);
  const row = (j: Job, isPinned: boolean) => (
    <li key={j.id} className="oh-row" data-testid={isPinned ? "jl-pinned" : "jl-unpinned"}>
      <div className="oh-row-main">
        <button type="button" className="crm-trk" onClick={() => onOpen(j.id)}>{j.tracking_no}</button>
        <span className="ap-muted">{isPinned ? t("Pinned on the map", "Fijado en el mapa") : t("No pin yet", "Sin pin todavía")}</span>
      </div>
      <div className="oh-row-actions">
        <Button type="button" variant="outline" className="oh-more" onClick={() => { setMsg(null); setPlacing(placing === j.id ? null : j.id); }} aria-pressed={placing === j.id} data-testid="jl-place">
          <MapPin size={14} aria-hidden />{placing === j.id ? t("Cancel", "Cancelar") : isPinned ? t("Move pin", "Mover pin") : t("Place pin", "Colocar pin")}
        </Button>
        {isPinned && <Button type="button" variant="outline" className="oh-more" onClick={() => remove(j.id)}>{t("Remove pin", "Quitar pin")}</Button>}
      </div>
    </li>
  );
  const shown = jobs.length > 12;
  return (
    <section className="crm-panel" aria-labelledby="crm-jl-h" data-testid="job-locations">
      <div className="crm-panel-head">
        <h3 id="crm-jl-h" className="crm-h3">{t("Job Locations", "Ubicaciones de trabajos")}</h3>
        <p className="crm-note">{t("Your office places each pin by hand. Customer addresses are never sent to the map and no location is guessed.", "Su oficina coloca cada pin a mano. Las direcciones de clientes nunca se envían al mapa y no se adivina ninguna ubicación.")}</p>
      </div>
      <div ref={el} className="jl-map" data-testid="jl-map" role="region" aria-label={t("Map of job locations", "Mapa de ubicaciones de trabajos")} />
      {placing && <p className="crm-note" role="status" data-testid="jl-hint">{t(`Click the map to place the pin for ${jobsById.current[placing]?.tracking_no ?? "this job"}.`, `Haga clic en el mapa para colocar el pin de ${jobsById.current[placing]?.tracking_no ?? "este trabajo"}.`)}</p>}
      {msg && <p className="crm-note" role="status" data-testid="jl-msg">{msg}</p>}
      {err && <p className="crm-note" role="alert">{t("Could not load saved pins.", "No se pudieron cargar los pines guardados.")}</p>}
      {jobs.length === 0 ? <p className="crm-note">{t("No jobs to show yet.", "Todavía no hay trabajos.")}</p> : (
        <div className="jl-lists">
          <div>
            <h4 className="crm-h3">{t(`Unpinned jobs (${unpinned.length})`, `Trabajos sin pin (${unpinned.length})`)}</h4>
            {unpinned.length ? <ul className="oh-rows">{unpinned.slice(0, shown ? 8 : 99).map((j) => row(j, false))}</ul> : <p className="crm-note">{t("Every job has a pin.", "Todos los trabajos tienen pin.")}</p>}
          </div>
          {pinned.length > 0 && <div>
            <h4 className="crm-h3">{t(`Pinned jobs (${pinned.length})`, `Trabajos con pin (${pinned.length})`)}</h4>
            <ul className="oh-rows">{pinned.slice(0, shown ? 8 : 99).map((j) => row(j, true))}</ul>
          </div>}
        </div>
      )}
    </section>
  );
}
