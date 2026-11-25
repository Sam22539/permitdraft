import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { AppPage } from "../components/app-shell";
import { SignInForm, useSessionEmail } from "../components/core-offer";
import { PacketReview, type CheckKind, type Decision, type ReviewData } from "../components/office/review";
import { backend } from "../lib/backend";
import { useLang } from "../lib/lang";

export const Route = createFileRoute("/office-packet/$id")({
  head: () => ({ meta: [{ title: "Packet review — PermitDraft" }, { name: "description", content: "Review one sealed packet version, decide conflicts, and send it for the contractor's signature." }, { name: "robots", content: "noindex" }] }),
  component: LivePacketReview,
});

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const nice = (k: string) => k.replace(/[_-]+/g, " ").replace(/^./, (c) => c.toUpperCase());
const hm = (iso: string) => new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }).replace(/\s?[AP]M$/, "");

/** Live review of a packet's latest sealed version. The database's rules decide who may read it and who may decide. */
function LivePacketReview() {
  const { id } = Route.useParams();
  const { t } = useLang();
  const email = useSessionEmail();
  const [data, setData] = useState<ReviewData | null | undefined>(undefined);

  const load = useCallback(async () => {
    if (!UUID.test(id)) { setData(null); return; }
    const { data: pk } = await backend.from("office_packets").select("id, job_id, tracking_no, sent_by_name, sent_at, captured_fields, office_received_at, photo_links").eq("id", id).maybeSingle();
    if (!pk) { setData(null); return; }
    const { data: ver } = await backend.from("packet_versions").select("id, version, fingerprint, fields, photo_ids, created_at, created_by, reason").eq("packet_id", id).order("version", { ascending: false });
    const latest = ver?.[0] ?? null;
    const [{ data: checks }, { data: sig }, { data: mail }] = latest
      ? await Promise.all([
        backend.from("packet_checks").select("id, field_key, kind, captured_value, evidence_value, evidence_photo_id, decision, note").eq("packet_version_id", latest.id),
        backend.from("signatures").select("signer_name, signed_at").eq("packet_version_id", latest.id).maybeSingle(),
        backend.from("email_deliveries").select("to_email, status, created_at").eq("packet_version_id", latest.id).eq("kind", "signature_request").order("created_at", { ascending: false }).limit(1),
      ])
      : [{ data: [] }, { data: null }, { data: [] }];
    // Evidence photos: the version's photo ids, read from the same tables (and rules) as the existing office review.
    type PL = { photoId?: string; table?: string; slot?: string };
    const links = ((pk.photo_links as PL[] | null) ?? []).filter((l) => UUID.test(String(l.photoId)));
    const want = new Set(((latest?.photo_ids as string[] | undefined) ?? links.map((l) => String(l.photoId))));
    const mainIds = links.filter((l) => l.table !== "extra" && want.has(String(l.photoId))).map((l) => String(l.photoId));
    const extraIds = links.filter((l) => l.table === "extra" && want.has(String(l.photoId))).map((l) => String(l.photoId));
    const [ph, ex] = await Promise.all([
      mainIds.length ? backend.from("job_photos").select("id, slot, data_url").in("id", mainIds) : Promise.resolve({ data: [] as { id: string; slot: string; data_url: string }[] }),
      extraIds.length ? backend.from("job_extra_photos").select("id, slot, data_url").in("id", extraIds) : Promise.resolve({ data: [] as { id: string; slot: string; data_url: string }[] }),
    ]);
    const pics = [...((ph.data ?? []) as { id: string; slot: string; data_url: string }[]), ...((ex.data ?? []) as { id: string; slot: string; data_url: string }[])];
    const picUrl = new Map(pics.map((x) => [String(x.id), String(x.data_url)]));
    const raw = (latest?.fields ?? (pk.captured_fields as { values?: Record<string, string> } | null)?.values ?? {}) as Record<string, unknown>;
    const fields = ((raw.values as Record<string, string> | undefined) ?? raw) as Record<string, string>;
    const byField = new Map((checks ?? []).map((c) => [String(c.field_key), c]));
    const ck = (checks ?? []).map((c) => ({ id: String(c.id), field: String(c.field_key), label: nice(String(c.field_key)), kind: c.kind as CheckKind, captured: c.captured_value as string | null, evidence: c.evidence_value as string | null, decision: c.decision as Decision | null, note: c.note as string | null, evidencePhotoUrl: c.evidence_photo_id ? picUrl.get(String(c.evidence_photo_id)) : undefined }));
    const { data: s } = await backend.auth.getSession();
    const me = s.session?.user;
    const m = me?.email ? (await backend.from("company_members").select("role").eq("email", me.email.toLowerCase()).maybeSingle()).data : null;
    const r = mail?.[0];
    setData({
      packetId: String(pk.id), tracking: String(pk.tracking_no ?? pk.job_id), addr: [fields.addr, fields.city].filter(Boolean).join(", ") || "—", type: fields.type || t("Job", "Trabajo"), customer: fields.name || "—",
      tech: String(pk.sent_by_name ?? t("the technician", "el técnico")), sentAt: new Date(String(pk.sent_at)).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }),
      version: latest ? { id: String(latest.id), n: Number(latest.version), fingerprint: String(latest.fingerprint) } : null,
      checks: ck,
      rows: Object.entries(fields).filter(([, v]) => String(v ?? "").trim()).map(([k, v]) => { const c = byField.get(k); return { label: nice(k), value: String(v), source: c ? (c.kind === "conflict" ? t("Entered · evidence disagrees", "Ingresado · la evidencia no coincide") : t("Entered · checked", "Ingresado · revisado")) : t("Entered by the tech", "Ingresado por el técnico"), check: (c?.decision === "use_evidence" || c?.decision === "keep_with_note" ? "matched" : (c?.kind as CheckKind | undefined)) }; }),
      photos: pics.length ? pics.map((x) => ({ id: String(x.id), label: nice(String(x.slot)), url: String(x.data_url) })) : [...want].map((pid, i) => ({ id: pid, label: t(`Photo ${i + 1}`, `Foto ${i + 1}`) })),
      activity: [
        ...(ver ?? []).map((v) => ({ time: hm(String(v.created_at)), text: v.reason === "sent" ? t(`${pk.sent_by_name ?? "Tech"} sent packet v${v.version}`, `${pk.sent_by_name ?? "Técnico"} envió el paquete v${v.version}`) : t(`v${v.version} sealed by ${v.created_by}`, `v${v.version} sellada por ${v.created_by}`) })),
        ...(pk.office_received_at ? [{ time: hm(String(pk.office_received_at)), text: t("Office opened the packet", "La oficina abrió el paquete") }] : []),
      ],
      signature: sig ? { signedBy: String(sig.signer_name), signedAt: new Date(String(sig.signed_at)).toLocaleString("en-US") } : r ? { requestedTo: `${r.to_email}${r.status === "delivered" ? t(" (delivered)", " (entregado)") : ""}`, failed: r.status === "failed" || r.status === "bounced" } : null,
      user: { name: me?.email?.split("@")[0] ?? "", role: m?.role === "admin" ? t("Office admin", "Admin. de oficina") : t("Office", "Oficina") },
    });
  }, [id, t]);
  useEffect(() => { if (email) void load(); }, [email, load]);

  if (email === null) return <AppPage core><h1 className="cx-h1">{t("Packet review", "Revisión del paquete")}</h1><SignInForm returnTo={`/office-packet/${id}`} /></AppPage>;
  if (data === undefined) return <AppPage core><p className="ap-muted" role="status">{t("Loading the packet…", "Cargando el paquete…")}</p></AppPage>;
  if (data === null) return <AppPage core><h1 className="cx-h1">{t("Packet not found", "Paquete no encontrado")}</h1><p className="ap-muted">{t("It does not exist, or your company's office cannot see it.", "No existe, o la oficina de su empresa no puede verlo.")}</p><Link to="/office" className="ap-btn primary">{t("Office dashboard", "Panel de oficina")}</Link></AppPage>;

  const fail = (e: { message?: string } | null) => (e ? t(`Not saved: ${e.message ?? "try again"}`, `No se guardó: ${e.message ?? "intente de nuevo"}`) : null);
  return (
    <PacketReview backTo="/office" data={data} actions={{
      decide: async (checkId, decision, note) => { const { error } = await backend.rpc("decide_packet_check", { p_check_id: checkId, p_decision: decision, p_note: note ?? null }); if (!error) await load(); return fail(error); },
      requestSignature: async (to) => { if (!data.version) return t("No sealed version yet.", "Aún no hay versión sellada."); const { error } = await backend.rpc("request_signature", { p_version_id: data.version.id, p_to_email: to }); if (!error) await load(); return fail(error); },
    }} />
  );
}
