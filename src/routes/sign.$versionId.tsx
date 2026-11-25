import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { AppPage } from "../components/app-shell";
import { SignInForm, useSessionEmail } from "../components/core-offer";
import { SignVersion, type SignData } from "../components/office/sign";
import { backend } from "../lib/backend";
import { useLang } from "../lib/lang";

export const Route = createFileRoute("/sign/$versionId")({
  head: () => ({ meta: [{ title: "Sign permit draft — PermitDraft" }, { name: "description", content: "Review and sign one exact version of a permit draft." }, { name: "robots", content: "noindex" }] }),
  component: SignPage,
});

const nice = (k: string) => k.replace(/[_-]+/g, " ").replace(/^./, (c) => c.toUpperCase());

/** A company admin signs the latest version; the database refuses an older version, a changed fingerprint or open items. */
function SignPage() {
  const { versionId } = Route.useParams();
  const { t } = useLang();
  const email = useSessionEmail();
  const [d, setD] = useState<SignData | null | undefined>(undefined);
  const load = useCallback(async () => {
    const { data: v } = await backend.from("packet_versions").select("id, version, fingerprint, fields, photo_ids").eq("id", versionId).maybeSingle();
    if (!v) { setD(null); return; }
    const { data: s } = await backend.from("signatures").select("signer_name, signed_at").eq("packet_version_id", v.id).maybeSingle();
    const raw = (v.fields ?? {}) as Record<string, unknown>;
    const f = ((raw.values as Record<string, string> | undefined) ?? raw) as Record<string, string>;
    const skip = new Set(["name", "phone", "addr", "city", "zip"]);
    setD({
      addr: [f.addr, f.city].filter(Boolean).join(", ") || "—", versionN: Number(v.version), fingerprint: String(v.fingerprint), area: f.city ? `${f.city}'s` : undefined,
      rows: Object.entries(f).filter(([k, val]) => !skip.has(k) && String(val ?? "").trim()).map(([k, val]) => ({ label: nice(k), value: String(val) })),
      photos: ((v.photo_ids as string[] | null) ?? []).length,
      signed: s ? { by: String(s.signer_name), at: new Date(String(s.signed_at)).toLocaleString("en-US") } : null,
    });
  }, [versionId]);
  useEffect(() => { if (email) void load(); }, [email, load]);

  if (email === null) return <AppPage core><h1 className="cx-h1">{t("Sign permit draft", "Firmar borrador de permiso")}</h1><p className="ap-muted">{t("Sign in with your company admin email.", "Inicie sesión con el correo de administrador de su empresa.")}</p><SignInForm returnTo={`/sign/${versionId}`} /></AppPage>;
  if (d === undefined) return <AppPage core><p className="ap-muted" role="status">{t("Loading…", "Cargando…")}</p></AppPage>;
  if (d === null) return <AppPage core><h1 className="cx-h1">{t("Version not found", "Versión no encontrada")}</h1><p className="ap-muted">{t("It does not exist, or this account cannot see it.", "No existe, o esta cuenta no puede verla.")}</p></AppPage>;
  return <SignVersion data={d} onSign={async (name) => {
    const { error } = await backend.rpc("sign_packet_version", { p_version_id: versionId, p_fingerprint: d.fingerprint, p_signer_name: name, p_ip: null, p_user_agent: navigator.userAgent.slice(0, 500) });
    if (error) return t(`Not signed: ${error.message}`, `No se firmó: ${error.message}`);
    await load(); return null;
  }} />;
}
