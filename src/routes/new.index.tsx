import { ResourceLink } from "../components/resource-link";
import { CoreGate } from "../components/core-offer";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useDraft } from "../lib/job-draft";
import { AppPage } from "../components/app-shell";
import { StepHead } from "../components/step-shell";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useLang } from "../lib/lang";
import { useCorePath } from "../components/demo";

export const Route = createFileRoute("/new/")({
  head: () => ({ meta: [{ title: "New job — PermitDraft" }, { name: "description", content: "Step 1 of 5: homeowner and job site." }] }),
  component: () => <CoreGate><NewJob /></CoreGate>,
});

export function NewJob() {
  const { t } = useLang();
  const p = useCorePath();
  const nav = useNavigate();
  const d = useDraft(1);
  const f = { name: d.get("name"), phone: d.get("phone"), addr: d.get("addr"), city: d.get("city") };
  const [draft, setDraft] = useState<typeof f | null>(null);
  const [err, setErr] = useState("");
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => d.set(k, e.target.value);

  function next(e: React.FormEvent) {
    e.preventDefault();
    if (!f.name.trim() || !f.addr.trim() || !f.city.trim()) return setErr(t("Fill in the fields marked *.", "Complete los campos marcados con *."));
    setDraft(f);
    nav({ to: p("/new/equipment") });
  }

  return (
    <AppPage bottom capture>
      <StepHead n={1} title={["New job", "Nuevo trabajo"]} />
      <p className="cx-note">{t("Fields marked * are needed for the paperwork. Your work saves as you go.", "Los campos marcados con * son necesarios para el papeleo. Su trabajo se guarda mientras avanza.")}</p>
      
      <form className="cx-card" onSubmit={next} data-saved={draft ? "yes" : "no"}>
        <div className="cx-field"><Label htmlFor="n">{t("Homeowner name *", "Nombre del propietario *")}</Label><Input id="n" value={f.name} onChange={set("name")} autoComplete="off" /></div>
        <div className="cx-field"><Label htmlFor="p">{t("Phone", "Teléfono")}</Label><Input id="p" type="tel" value={f.phone} onChange={set("phone")} /></div>
        <div className="cx-field"><Label htmlFor="a">{t("Job site address *", "Dirección del sitio *")}</Label><Input id="a" value={f.addr} onChange={set("addr")} /></div>
        <div className="cx-field"><Label htmlFor="c">{t("City *", "Ciudad *")}</Label><Input id="c" value={f.city} onChange={set("city")} /></div>
        <p className="cx-note">{t("County: set in Settings", "Condado: se define en Ajustes")}</p>
        {err && <p role="alert" className="cx-err">{err}</p>}
        <div className="cx-actions">
          <button type="submit" className="ap-btn primary">{t("Next", "Siguiente")}</button>
          <Link to={p("/jobs")} className="cx-back">{t("Back", "Atrás")}</Link>
        </div>
      </form>
      <ResourceLink stage="setup" />
    </AppPage>
  );
}
