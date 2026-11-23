import { ResourceLink } from "../components/resource-link";
import { CoreGate } from "../components/core-offer";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { FixBar } from "../components/fix-bar";
import { fixSearch, useFixFocus, useStepDraft } from "../lib/fix-mode";
import { AppPage } from "../components/app-shell";
import { PinnedAction, StepHead } from "../components/step-shell";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useLang } from "../lib/lang";
import { useCorePath } from "../components/demo";
import { AddressLookup } from "../components/address-lookup";

export const Route = createFileRoute("/new/")({
  validateSearch: fixSearch,
  head: () => ({ meta: [{ title: "New job — PermitDraft" }, { name: "description", content: "Step 1 of 5: homeowner and job site." }] }),
  component: () => <CoreGate><NewJob lookup /></CoreGate>,
});

export function NewJob({ lookup = false }: { lookup?: boolean } = {}) {
  const { t } = useLang();
  const p = useCorePath();
  const nav = useNavigate();
  const d = useStepDraft(1);
  useFixFocus(d.fix, d.fix?.value ?? "");
  const f = { name: d.get("name"), phone: d.get("phone"), addr: d.get("addr"), city: d.get("city") };
  const [draft, setDraft] = useState<typeof f | null>(null);
  const [err, setErr] = useState("");
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => d.set(k, e.target.value);

  function next(e: React.FormEvent) {
    e.preventDefault();
    if (d.fixState !== "off") return;
    if (!f.name.trim() || !f.addr.trim() || !f.city.trim()) return setErr(t("Fill in the fields marked *.", "Complete los campos marcados con *."));
    setDraft(f);
    nav({ to: p("/new/equipment") });
  }

  return (
    <AppPage bottom capture>
      <StepHead n={1} title={["New job", "Nuevo trabajo"]} />
      <p className="cx-note">{t("Fields marked * are needed for the paperwork. Your work saves as you go.", "Los campos marcados con * son necesarios para el papeleo. Su trabajo se guarda mientras avanza.")}</p>
      
      <form className="cx-card cx-grid2" onSubmit={next} data-saved={draft ? "yes" : "no"}>
        <div className="cx-field"><Label htmlFor="n">{t("Homeowner name *", "Nombre del propietario *")}</Label><Input id="n" value={f.name} onChange={set("name")} autoComplete="off" /></div>
        <div className="cx-field"><Label htmlFor="p">{t("Phone", "Teléfono")}</Label><Input id="p" type="tel" value={f.phone} onChange={set("phone")} /></div>
        <div className="cx-field"><Label htmlFor="a">{t("Job site address *", "Dirección del sitio *")}</Label>{lookup && d.fixState === "off"
          ? <AddressLookup id="a" value={f.addr} onText={(v) => d.set("addr", v)} onPick={(a) => { d.set("addr", a.street); d.set("city", a.city); }} />
          : <Input id="a" value={f.addr} onChange={set("addr")} />}</div>
        <div className="cx-field"><Label htmlFor="c">{t("City *", "Ciudad *")}</Label><Input id="c" value={f.city} onChange={set("city")} /></div>
        <p className="cx-note">{t("County: set in Settings", "Condado: se define en Ajustes")}</p>
        {d.fixState === "off" && <div className="cx-actions">
          <PinnedAction className="cx-pin-err">
            {err && <p role="alert" className="cx-err">{err}</p>}
            <button type="submit" className="ap-btn primary">{t("Next", "Siguiente")}</button>
          </PinnedAction>
          <Link to={p("/jobs")} className="cx-back">{t("Back", "Atrás")}</Link>
        </div>}
      </form>
      {d.fixState !== "off" && <FixBar fix={d.fix} capId={d.fixParams.fix} rule={d.fixParams.rule} />}
      <ResourceLink stage="setup" />
    </AppPage>
  );
}
