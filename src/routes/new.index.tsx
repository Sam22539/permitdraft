import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useDraft } from "../lib/job-draft";
import { AppPage } from "../components/app-shell";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useLang } from "../lib/lang";

export const Route = createFileRoute("/new/")({
  head: () => ({ meta: [{ title: "New job — PermitDraft" }, { name: "description", content: "Step 1 of 5: homeowner and job site." }] }),
  component: NewJob,
});

function NewJob() {
  const { t } = useLang();
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
    nav({ to: "/new/equipment" });
  }

  return (
    <AppPage bottom>
      <h1 className="text-3xl">{t("New job", "Nuevo trabajo")}</h1>
      <div>
        <p className="font-semibold">{t("Step 1 of 5 · Homeowner & site", "Paso 1 de 5 · Propietario y sitio")}</p>
        <div className="ap-prog mt-2" role="progressbar" aria-valuenow={1} aria-valuemin={0} aria-valuemax={5}><div style={{ width: "20%" }} /></div>
      </div>
      <p className="ap-muted">{t("Fields marked * are needed for the paperwork. Your work saves as you go.", "Los campos marcados con * son necesarios para el papeleo. Su trabajo se guarda mientras avanza.")}</p>
      <form className="ap-card" onSubmit={next} data-saved={draft ? "yes" : "no"}>
        <div className="ap-field"><Label htmlFor="n">{t("Homeowner name *", "Nombre del propietario *")}</Label><Input id="n" value={f.name} onChange={set("name")} autoComplete="off" /></div>
        <div className="ap-field"><Label htmlFor="p">{t("Phone", "Teléfono")}</Label><Input id="p" type="tel" value={f.phone} onChange={set("phone")} /></div>
        <div className="ap-field"><Label htmlFor="a">{t("Job site address *", "Dirección del sitio *")}</Label><Input id="a" value={f.addr} onChange={set("addr")} /></div>
        <div className="ap-field"><Label htmlFor="c">{t("City *", "Ciudad *")}</Label><Input id="c" value={f.city} onChange={set("city")} /></div>
        <p className="ap-muted">{t("County: set in Settings", "Condado: se define en Ajustes")}</p>
        {err && <p role="alert" className="ap-next">{err}</p>}
        <div className="ap-two">
          <Link to="/jobs" className="ap-btn ghost">{t("Back", "Atrás")}</Link>
          <button type="submit" className="ap-btn primary">{t("Next", "Siguiente")}</button>
        </div>
      </form>
    </AppPage>
  );
}
