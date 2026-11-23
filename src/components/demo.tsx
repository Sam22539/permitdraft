import { createContext, useContext, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { useLang } from "../lib/lang";
import { DEMO_KEY_PREFIX, isDemo, toDemoPath } from "../lib/demo-mode";
import { seedDraft } from "../lib/job-draft";
import { setInsp } from "../lib/inspection";
import { DEMO_PHOTO_DB, savePhoto, setPhotoUnit } from "../lib/photos";

export const DEMO_PHOTO = "/generated-assets/95a552760ec65fbcb531b422ad4af9fdbf6083b01c75ac0a59a8e81d98040ca2.webp";
const SEEDED = DEMO_KEY_PREFIX + "seeded-v2";

// The demo's sample job: made-up homeowner and equipment. Panel size, duct sealing and two photos are left out on
// purpose, so the review shows how missing details are flagged.
const DEMO_VALUES: Record<string, string> = {
  name: "Marcus Reyes", phone: "(555) 010-0142", addr: "4412 Alder Court", city: "Sacramento",
  type: "Heat pump change-out", maker: "Carrier", model: "25HPB536A003", serial: "1824E21045", refrig: "R-410A",
  loc: "Left side yard, same pad", work: "Heat-pump change-out, same pad, left side yard",
};

const Ctx = createContext(false);
/** True inside the free demo. */
export function useDemo() { return useContext(Ctx); }
/** A Core screen's address, or the demo's copy of it inside the demo. */
export function useCorePath() {
  const demo = useDemo();
  return (path: string) => (demo ? toDemoPath(path) : path);
}

async function seedDemo() {
  if (!isDemo()) return;
  try { if (localStorage.getItem(SEEDED)) return; localStorage.setItem(SEEDED, "1"); } catch { return; }
  seedDraft(DEMO_VALUES);
  const d = new Date(); d.setMonth(d.getMonth() - 2);
  const n = new Date(); n.setDate(n.getDate() + 12);
  const ymd = (x: Date) => `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
  setInsp({ juris: "sacramento-city", issue: ymd(d), next: ymd(n) });
  try {
    const blob = await (await fetch(DEMO_PHOTO)).blob();
    await savePhoto("plate", new File([blob], "sample-data-plate.webp", { type: blob.type || "image/webp" }));
    await setPhotoUnit("plate", "outdoor");
  } catch { /* the sample photo is optional: the slot simply stays empty */ }
}

/** Clear every demo key and the demo's photo database, then start the sample job again. Real work is never touched. */
async function resetDemo() {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k?.startsWith(DEMO_KEY_PREFIX)) keys.push(k); }
    keys.forEach((k) => localStorage.removeItem(k));
  } catch { /* blocked storage: nothing saved to clear */ }
  await new Promise<void>((res) => {
    try { const r = indexedDB.deleteDatabase(DEMO_PHOTO_DB); r.onsuccess = r.onerror = r.onblocked = () => res(); } catch { res(); }
  });
  window.location.assign("/demo");
}

export function DemoProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => { void seedDemo(); }, []);
  return <Ctx.Provider value={true}>{children}</Ctx.Provider>;
}

export function DemoBar() {
  const { t } = useLang();
  const [busy, setBusy] = useState(false);
  return (
    <section className="ap-demo" aria-label={t("Free demo", "Demo gratis")} data-testid="demo-bar">
      <p><strong>{t("Free demo", "Demo gratis")}</strong> · {t("Every step unlocked, no sign-in, no card. Practice data stays in this browser, apart from real jobs; nothing is sent or filed.", "Todos los pasos abiertos, sin iniciar sesión ni tarjeta. Los datos de práctica quedan en este navegador, aparte de los trabajos reales; no se envía ni presenta nada.")}</p>
      <p>
        <Link to="/" hash="core-offer" className="underline font-semibold">{t("See Core plans", "Ver planes de Core")}</Link>
        {" · "}
        <Dialog>
          <DialogTrigger asChild><button type="button" className="underline font-semibold" data-testid="demo-reset">{t("Reset demo", "Reiniciar demo")}</button></DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("Reset the demo?", "¿Reiniciar la demo?")}</DialogTitle>
              <DialogDescription>{t("This clears your PermitDraft Demo jobs, photos and dates and starts the sample job again. Real jobs are not touched.", "Esto borra los trabajos, fotos y fechas de PermitDraft Demo y vuelve a empezar el trabajo de muestra. Los trabajos reales no se tocan.")}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild><button type="button" className="ap-btn ghost">{t("Cancel", "Cancelar")}</button></DialogClose>
              <button type="button" className="ap-btn primary" disabled={busy} data-testid="demo-reset-confirm" onClick={() => { setBusy(true); void resetDemo(); }}>{busy ? t("Resetting…", "Reiniciando…") : t("Reset demo", "Reiniciar demo")}</button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </p>
    </section>
  );
}
