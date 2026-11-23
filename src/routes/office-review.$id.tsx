import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppPage } from "../components/app-shell";
import { SignInForm, useSessionEmail } from "../components/core-offer";
import { backend } from "../lib/backend";
import { Image } from "../image";
import { useLang } from "../lib/lang";
import { markPacketReceived, requestCorrection } from "../lib/account";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";

export const Route = createFileRoute("/office-review/$id")({
  head: () => ({ meta: [{ title: "Office review — PermitDraft" }, { name: "description", content: "A finished job's packet, for your company's signed-in office reviewers." }, { name: "robots", content: "noindex" }] }),
  component: OfficeReview,
});

type Packet = { id: string; job_id: string; sent_by_name: string; employee_id: string | null; sent_at: string; captured_fields: { values?: Record<string, string>; formDefaults?: Record<string, string> }; photo_links: { photoId: string; table?: string; slot: string; name: string }[] };
type Photo = { id: string; slot: string; name: string; data_url: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const nice = (k: string) => k.replace(/[_-]+/g, " ").replace(/^./, (c) => c.toUpperCase());

/** Opens only for a signed-in admin or office reviewer of the packet's company: the database's rules decide, not the link. */
function OfficeReview() {
  const { id } = Route.useParams();
  const { t, lang } = useLang();
  const email = useSessionEmail();
  const [pk, setPk] = useState<Packet | null | undefined>(undefined);
  const [photos, setPhotos] = useState<Photo[]>([]);
  useEffect(() => {
    if (!email) return;
    if (!UUID.test(id)) { setPk(null); return; }
    let live = true;
    (async () => {
      const { data } = await backend.from("office_packets").select("id, job_id, sent_by_name, employee_id, sent_at, captured_fields, photo_links").eq("id", id).maybeSingle();
      if (!live) return;
      setPk((data as Packet | null) ?? null);
      const links = ((data as Packet | null)?.photo_links ?? []).filter((p) => UUID.test(String(p.photoId)));
      const ids = links.filter((p) => p.table !== "extra").map((p) => p.photoId);
      const extraIds = links.filter((p) => p.table === "extra").map((p) => p.photoId);
      const [ph, ex] = await Promise.all([
        ids.length ? backend.from("job_photos").select("id, slot, name, data_url").in("id", ids) : Promise.resolve({ data: [] }),
        extraIds.length ? backend.from("job_extra_photos").select("id, slot, name, data_url").in("id", extraIds) : Promise.resolve({ data: [] }),
      ]);
      if (live) setPhotos([...((ph.data as Photo[] | null) ?? []), ...((ex.data as Photo[] | null) ?? [])]);
    })().catch(() => { if (live) setPk(null); });
    return () => { live = false; };
  }, [email, id]);

  const [reqs, setReqs] = useState<{ id: string; note: string; requested_by: string; created_at: string }[]>([]);
  const [note, setNote] = useState("");
  const [cmsg, setCmsg] = useState("");
  const [cbusy, setCbusy] = useState(false);
  const loadReqs = (pid: string) => Promise.resolve(backend.from("correction_requests").select("id, note, requested_by, created_at").eq("packet_id", pid).order("created_at", { ascending: false })).then(({ data }) => setReqs((data as typeof reqs | null) ?? []));
  useEffect(() => {
    if (!pk) return;
    void loadReqs(pk.id);
    // Opening the packet as the company's office records its receipt (once) and tells the submitter if they asked to hear.
    backend.auth.getSession().then(({ data }) => { const tk = data.session?.access_token; if (tk) return markPacketReceived({ data: { token: tk, packetId: pk.id } }); }).catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pk?.id]);
  const ask = async (e: React.FormEvent) => {
    e.preventDefault(); if (!pk || !note.trim()) return;
    setCbusy(true); setCmsg("");
    try {
      const { data } = await backend.auth.getSession();
      const r = await requestCorrection({ data: { token: data.session?.access_token ?? "", packetId: pk.id, note } });
      if (r.ok) { setNote(""); setCmsg(t("Correction request saved.", "Solicitud de corrección guardada.")); await loadReqs(pk.id); } else setCmsg(t("Could not save the request.", "No se pudo guardar la solicitud."));
    } catch { setCmsg(t("Could not save the request.", "No se pudo guardar la solicitud.")); }
    setCbusy(false);
  };
  const fields = pk ? { ...(pk.captured_fields?.formDefaults ?? {}), ...(pk.captured_fields?.values ?? {}) } : {};
  return (
    <AppPage>
      <h1 className="text-3xl">{t("Office review", "Revisión de oficina")}</h1>
      {email === null && (
        <section className="ap-card" aria-labelledby="or-sign">
          <h2 id="or-sign" className="ap-h2">{t("Sign in to open this packet", "Inicie sesión para abrir este paquete")}</h2>
          <p className="ap-muted">{t("Only your company's office reviewers can open it.", "Solo los revisores de oficina de su empresa pueden abrirlo.")}</p>
          <SignInForm />
        </section>
      )}
      {email && pk === undefined && <p className="ap-muted" role="status">{t("Loading…", "Cargando…")}</p>}
      {email && pk === null && (
        <section className="ap-card" data-testid="or-denied">
          <p role="alert"><strong>{t("This packet is not available to you.", "Este paquete no está disponible para usted.")}</strong></p>
          <p className="ap-muted">{t(`Signed in as ${email}. Only signed-in office reviewers and admins of the company that finished the job can open it. Ask your company's admin to add you in `, `Sesión iniciada como ${email}. Solo los revisores de oficina y administradores de la empresa que terminó el trabajo pueden abrirlo. Pida al administrador de su empresa que lo agregue en `)}<Link to="/office-setup" className="underline font-semibold">{t("Office setup", "Configuración de oficina")}</Link>.</p>
        </section>
      )}
      {pk && (
        <>
          <section className="ap-card" aria-labelledby="or-sent" data-testid="or-packet">
            <h2 id="or-sent" className="ap-h2">{t("Job", "Trabajo")} {pk.job_id}</h2>
            <p data-testid="or-submitted"><strong>{t("Submitted by", "Enviado por")}</strong> {pk.sent_by_name}{pk.employee_id ? ` · ${t("Employee ID", "ID de empleado")} ${pk.employee_id}` : ""}</p>
            <p className="ap-muted">{new Date(pk.sent_at).toLocaleString(lang === "es" ? "es" : "en-US")}</p>
            <p className="ap-muted">{t("For office review only, not permit filing. Contractor review and signature required.", "Solo para revisión de oficina, no para presentar el permiso. Se requiere revisión y firma del contratista.")}</p>
          </section>
          <section className="ap-card" aria-labelledby="or-corr" data-testid="or-corrections">
            <h2 id="or-corr" className="ap-h2">{t("Correction requests", "Solicitudes de corrección")}</h2>
            <form onSubmit={ask} className="ap-form">
              <div className="ap-field"><Label htmlFor="or-note">{t("What needs correcting?", "¿Qué hay que corregir?")}</Label>
                <Textarea id="or-note" value={note} maxLength={1000} onChange={(e) => setNote(e.target.value)} data-testid="or-note" /></div>
              <button type="submit" className="ap-btn primary" disabled={cbusy || !note.trim()} data-testid="or-ask">{t("Ask technician for a correction", "Pedir una corrección al técnico")}</button>
              {cmsg && <p role="status" className="ap-muted" data-testid="or-corr-msg">{cmsg}</p>}
            </form>
            <ul className="grid gap-2">
              {reqs.map((r) => <li key={r.id} data-testid="or-corr-item">{r.note} <span className="ap-muted">· {r.requested_by} · {new Date(r.created_at).toLocaleString(lang === "es" ? "es" : "en-US")}</span></li>)}
            </ul>
          </section>
          <section className="ap-card" aria-labelledby="or-fields">
            <h2 id="or-fields" className="ap-h2">{t("Captured details", "Datos capturados")}</h2>
            <dl className="grid gap-1">
              {Object.entries(fields).filter(([, v]) => String(v).trim()).map(([k, v]) => (
                <div key={k}><dt className="font-semibold">{nice(k)}</dt><dd className="break-words">{String(v)}</dd></div>
              ))}
            </dl>
          </section>
          <section className="ap-card" aria-labelledby="or-photos">
            <h2 id="or-photos" className="ap-h2">{t(`Photos (${pk.photo_links.length})`, `Fotos (${pk.photo_links.length})`)}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {photos.map((ph) => (
                <figure key={ph.id} className="grid gap-1">
                  <Image src={ph.data_url} alt={nice(ph.slot)} width={480} height={360} className="w-full rounded-md border" />
                  <figcaption className="ap-muted">{nice(ph.slot)}</figcaption>
                </figure>
              ))}
            </div>
          </section>
        </>
      )}
    </AppPage>
  );
}
