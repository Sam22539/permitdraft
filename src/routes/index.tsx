import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { useLang } from "../lib/lang";
import { WorkflowDemo } from "../components/home/workflow-demo";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "PermitDraft — finish the job, send the paperwork to the office" }, { name: "description", content: "Job-site photos become a permit draft your office reviews against each photo, and the contractor signs one locked version before filing with the city. A documentation tool: it does not file permits." }] }),
  component: Home,
});

const PLACES = ["California", "Arizona", "Texas", "Las Vegas, Nevada"];

/** Homepage, direction A (docs/design/mockups/HomepageA.dc.html). */
function Home() {
  const { t, lang, setLang } = useLang();
  const [menu, setMenu] = useState(false);
  const nav: [string, string, string][] = [["#workflow", "How it works", "Cómo funciona"], ["#products", "Technician app", "App del técnico"]];
  const eyebrow = "font-mono text-[12px] uppercase tracking-[0.16em] text-[var(--pd-orange-700)]";
  const h2 = "font-display text-[40px] font-bold leading-[1.02] tracking-[-0.03em] !text-[var(--pd-navy-900)] sm:text-[56px]";
  return (
    <div className="pd-ui min-h-screen bg-[#FAF9F6] text-[var(--pd-navy-900)]">
      <header className="pd-dark sticky top-0 z-30 bg-[var(--pd-navy-900)] text-white">
        <div className="mx-auto flex h-[68px] max-w-[1240px] items-center gap-4 px-5">
          <Link to="/" className="flex items-center gap-2.5"><img src="/generated-assets/company-logo-white.png" alt="" className="size-8" /><span className="font-display text-[19px] font-bold">PermitDraft</span></Link>
          <nav aria-label={t("Main", "Principal")} className="ml-auto hidden items-center gap-6 md:flex">
            {nav.map(([h, en, es]) => <a key={h} href={h} className="text-[15px] text-[#C9D2E0] hover:text-white">{t(en, es)}</a>)}
            <button type="button" onClick={() => setLang(lang === "es" ? "en" : "es")} className="text-[15px] text-[#C9D2E0] hover:text-white">{lang === "es" ? "English" : "Español"}</button>
            <Link to="/office" className="rounded-[10px] border border-[#2A3F63] px-4 py-2 text-[15px] font-bold text-white hover:bg-[#13264A]">{t("Office sign in", "Acceso de oficina")}</Link>
          </nav>
          <button type="button" className="ml-auto grid size-11 place-items-center rounded-[10px] md:hidden" aria-expanded={menu} aria-controls="hm-menu" onClick={() => setMenu(!menu)}>{menu ? <X aria-hidden /> : <Menu aria-hidden />}<span className="sr-only">{t("Menu", "Menú")}</span></button>
        </div>
        {menu && (
          <nav id="hm-menu" aria-label={t("Main", "Principal")} className="flex flex-col border-t border-[#2A3F63] px-5 pb-4 md:hidden">
            {nav.map(([h, en, es]) => <a key={h} href={h} onClick={() => setMenu(false)} className="flex min-h-12 items-center text-[16px] text-white">{t(en, es)}</a>)}
            <button type="button" onClick={() => setLang(lang === "es" ? "en" : "es")} className="flex min-h-12 items-center text-left text-[16px] text-white">{lang === "es" ? "English" : "Español"}</button>
            <Link to="/office" className="mt-2 flex min-h-12 items-center justify-center rounded-[10px] border border-[#2A3F63] font-bold text-white">{t("Office sign in", "Acceso de oficina")}</Link>
          </nav>
        )}
      </header>

      <main>
        <section className="mx-auto max-w-[1240px] px-5 pb-14 pt-14 sm:pt-20">
          <p className={eyebrow}>{t("For residential HVAC contractors", "Para contratistas residenciales de HVAC")}</p>
          <h1 className="mt-5 max-w-[1040px] font-display text-[44px] font-bold leading-[0.98] tracking-[-0.035em] !text-[var(--pd-navy-900)] sm:text-[72px] lg:text-[84px]">{t("Finish the job.", "Termine el trabajo.")}<br />{t("Send the paperwork to the office.", "Mande el papeleo a la oficina.")}</h1>
          <p className="mt-7 text-[19px] font-semibold sm:text-[22px]">{t("Job-site photos", "Fotos del sitio")} <span className="text-[var(--pd-orange-700)]" aria-hidden>→</span> {t("permit draft", "borrador del permiso")} <span className="text-[var(--pd-orange-700)]" aria-hidden>→</span> {t("office review", "revisión de oficina")} <span className="text-[var(--pd-orange-700)]" aria-hidden>→</span> {t("contractor signature.", "firma del contratista.")}</p>
          <p className="mt-5 max-w-[620px] text-[17px] leading-relaxed text-[var(--pd-gray-700)]">{t("Your technician captures what the permit needs, even with no signal. Your office reviews every value against its photo, and the contractor signs one locked version before filing with the city.", "Su técnico captura lo que el permiso necesita, aun sin señal. Su oficina revisa cada valor contra su foto, y el contratista firma una versión bloqueada antes de presentarla a la ciudad.")}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/demo" data-testid="try-demo" className="flex h-[52px] items-center rounded-[12px] bg-[var(--pd-orange-700)] px-6 text-[16px] font-bold text-white hover:bg-[var(--pd-orange-800)]">{t("Try the free demo", "Probar la demo gratis")}</Link>
            <a href="#workflow" className="flex h-[52px] items-center rounded-[12px] border border-[#C5CDD8] bg-white px-6 text-[16px] font-bold hover:bg-[var(--pd-gray-50)]">{t("See the workflow", "Ver el flujo")}</a>
          </div>
          <div id="how" className="mt-12 scroll-mt-20"><WorkflowDemo /></div>
        </section>

        <section id="features" aria-label={t("Highlights", "Puntos clave")} className="scroll-mt-20 border-y border-[#E6E2D8]">
          <div className="mx-auto grid max-w-[1240px] gap-6 px-5 py-9 sm:grid-cols-2 lg:grid-cols-4">
            {[["Works with no signal", "Funciona sin señal", "Queued on the phone until it reconnects. It says so.", "En cola en el teléfono hasta reconectar. Y lo dice."], ["Evidence-linked", "Ligado a evidencia", "Every value points to its photo or entry.", "Cada valor apunta a su foto o entrada."], ["Version-locked", "Versión bloqueada", "Signatures belong to one exact draft.", "Las firmas pertenecen a un borrador exacto."], ["English y Español", "English y Español", "Every screen, both languages.", "Cada pantalla, en ambos idiomas."]].map(([en, es, den, des]) => (
              <div key={en}><h3 className="font-display text-[21px] font-bold">{t(en, es)}</h3><p className="mt-1 text-[15px] text-[var(--pd-gray-700)]">{t(den, des)}</p></div>
            ))}
          </div>
        </section>

        <section className="mx-auto grid max-w-[1240px] items-center gap-10 px-5 py-20 lg:grid-cols-2">
          <div>
            <p className={eyebrow}>{t("Evidence", "Evidencia")}</p>
            <h2 className={`mt-4 ${h2}`}>{t("The photo is the proof.", "La foto es la prueba.")}</h2>
            <p className="mt-5 max-w-[560px] text-[17px] leading-relaxed text-[var(--pd-gray-700)]">{t("The tech photographs the data plate. The model and serial land in the draft with a link back to that exact photo, so your office checks a value in seconds instead of calling the field.", "El técnico fotografía la placa de datos. El modelo y la serie llegan al borrador con un enlace a esa foto exacta, así su oficina revisa un valor en segundos en vez de llamar al campo.")}</p>
          </div>
          <div className="grid items-center gap-4 sm:grid-cols-[1.1fr_1fr]">
            <figure>
              <div className="rounded-[14px] bg-[#8A93A3] p-2"><div className="rounded-[8px] bg-[#D6DAE0] p-5 font-mono text-[13px] leading-[1.9] text-[#1F2937]">
                <p>OUTDOOR HEAT PUMP UNIT</p><p className="-mx-1.5 rounded-[6px] border-2 border-[var(--pd-orange-500)] px-1">MODEL 25VNA036A003</p><p>SERIAL 4823X9</p><p>REFRIGERANT R-454B</p><p>208/230V 1PH 60HZ</p>
              </div></div>
              <figcaption className="mt-1.5 text-[12px] text-[var(--pd-gray-600)]">{t("Illustration of a data plate.", "Ilustración de una placa de datos.")}</figcaption>
            </figure>
            <div className="rounded-[16px] border border-[#E6E2D8] bg-white p-5">
              <p className="text-[13px] text-[var(--pd-gray-600)]">{t("Draft field", "Campo del borrador")} · PD-1187</p>
              <p className="mt-1 text-[15px] font-bold">{t("Model number", "Número de modelo")}</p>
              <p className="font-display text-[22px] font-bold">25VNA036A003</p>
              <p className="text-[14px] font-semibold text-[var(--pd-orange-700)]">{t("Source: data plate photo, 9:38 AM", "Fuente: foto de la placa, 9:38 AM")}</p>
              <span className="mt-2 inline-block rounded-[6px] bg-[var(--pd-success-bg)] px-2 py-0.5 text-[13px] font-bold text-[#166534]">{t("Matched", "Coincide")}</span>
            </div>
          </div>
        </section>

        <section id="products" className="mx-auto max-w-[1240px] px-5 pb-20">
          <div className="grid gap-4 lg:grid-cols-2 lg:items-end">
            <h2 className={h2}>{t("Two products. One handoff.", "Dos productos. Una entrega.")}</h2>
            <p className="text-[17px] text-[var(--pd-gray-700)]">{t("The technician app is built for the job site. The office portal is built for the people who review, track and sign.", "La app del técnico está hecha para el sitio de trabajo. El portal de oficina, para quienes revisan, siguen y firman.")}</p>
          </div>
          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            <div className="rounded-[24px] border border-[#E6E2D8] bg-white p-7">
              <p className={eyebrow}>{t("Technician app · phone", "App del técnico · teléfono")}</p>
              <h3 className="mt-3 font-display text-[26px] font-bold">{t("One job. One checklist. Big buttons.", "Un trabajo. Una lista. Botones grandes.")}</h3>
              <p className="mt-2 text-[16px] text-[var(--pd-gray-700)]">{t("Today's jobs, a camera step for each label, and a status that says exactly where your work is.", "Los trabajos de hoy, un paso de cámara para cada etiqueta y un estado que dice exactamente dónde está su trabajo.")}</p>
              <div className="mt-5 flex flex-col gap-2 rounded-[16px] bg-[var(--pd-gray-50)] p-3">
                <div className="flex justify-between px-1 text-[14px]"><strong>PD-1187 · 1187 Oak St</strong><span className="text-[var(--pd-gray-600)]">{t("4 of 6", "4 de 6")}</span></div>
                <Row2 done label={t("Outdoor data plate", "Placa de datos exterior")} />
                <Row2 label={t("Panel label photo", "Foto de la etiqueta del panel")} action={t("Take photo", "Tomar foto")} />
              </div>
              <Link to="/demo" className="mt-5 inline-block font-bold text-[var(--pd-orange-700)] underline">{t("Try the technician demo", "Probar la demo del técnico")}</Link>
            </div>
            <div className="pd-dark rounded-[24px] bg-[var(--pd-navy-900)] p-7 text-white">
              <p className="font-mono text-[12px] uppercase tracking-[0.16em] text-[#FDBA74]">{t("Office portal · desktop", "Portal de oficina · escritorio")}</p>
              <h3 className="mt-3 font-display text-[26px] font-bold !text-white">{t("Every permit, every stage, one screen.", "Cada permiso, cada etapa, una pantalla.")}</h3>
              <p className="mt-2 text-[16px] text-[#C9D2E0]">{t("A permit pipeline, evidence review, questions back to the tech, and signature tracking.", "Un flujo de permisos, revisión de evidencia, preguntas al técnico y seguimiento de firmas.")}</p>
              <div className="mt-5 rounded-[16px] bg-white p-3 text-[var(--pd-navy-900)]">
                <div className="grid grid-cols-4 gap-1.5 text-[13px] font-bold">
                  <span className="rounded-[8px] bg-[var(--pd-gray-100)] px-2 py-1.5">{t("Field 9", "Campo 9")}</span><span className="rounded-[8px] bg-[#E0E7FF] px-2 py-1.5 text-[#1E3A8A]">{t("Review 8", "Revisión 8")}</span><span className="rounded-[8px] bg-[#E0F2FE] px-2 py-1.5 text-[#075985]">{t("Ready 7", "Listo 7")}</span><span className="rounded-[8px] bg-[var(--pd-success-bg)] px-2 py-1.5 text-[#166534]">{t("Signed 26", "Firmado 26")}</span>
                </div>
                <div className="mt-2 flex items-center justify-between rounded-[8px] px-2 py-2 text-[14px]"><strong className="text-[var(--pd-orange-700)]">PD-1187</strong><span>1187 Oak St</span><span className="rounded-[6px] bg-[#E0E7FF] px-2 py-0.5 text-[13px] font-semibold text-[#1E3A8A]">{t("Office review", "Revisión de oficina")}</span></div>
              </div>
              <Link to="/demo/office" className="mt-5 inline-block font-bold text-[#FDBA74] underline">{t("See the office with sample data", "Ver la oficina con datos de muestra")}</Link>
            </div>
          </div>
        </section>

        <section className="bg-white">
          <div className="mx-auto grid max-w-[1240px] items-center gap-10 px-5 py-20 lg:grid-cols-2">
            <div>
              <p className={eyebrow}>{t("Trust", "Confianza")}</p>
              <h2 className={`mt-4 ${h2}`}>{t("A paper trail that holds up.", "Un registro que se sostiene.")}</h2>
              <p className="mt-5 max-w-[580px] text-[17px] leading-relaxed text-[var(--pd-gray-700)]">{t("Each send seals a numbered version with a fingerprint. Office decisions create a new version and keep the old one read-only. The contractor signs one exact version.", "Cada envío sella una versión numerada con una huella. Las decisiones de la oficina crean una versión nueva y dejan la anterior de solo lectura. El contratista firma una versión exacta.")}</p>
            </div>
            <ol className="flex flex-col gap-3">
              {[["v1 · A91C", "Sent by Luis from PD-1187", "Enviado por Luis desde PD-1187", false], ["v2 · 7F3A", "Office set panel to 125 A from the label photo", "La oficina puso 125 A según la foto de la etiqueta", false], ["Signed v2", "Contractor signed. Ready to file on the city portal.", "El contratista firmó. Listo para presentar en el portal de la ciudad.", true]].map(([k, en, es, ok]) => (
                <li key={String(k)} className={`flex items-center gap-3 rounded-[14px] border p-4 ${ok ? "border-[#BBF7D0] bg-[#F0FDF4]" : "border-[#E6E2D8] bg-[#FAF9F6]"}`}><span className={`rounded-full px-2.5 py-0.5 font-mono text-[13px] ${ok ? "bg-[var(--pd-success-bg)] text-[#166534]" : "bg-[#E0E7FF] text-[#1E3A8A]"}`}>{String(k)}</span><span className={`text-[15px] ${ok ? "text-[#166534]" : ""}`}>{t(String(en), String(es))}</span></li>
              ))}
            </ol>
          </div>
        </section>

        <section className="border-t border-[#E6E2D8]">
          <div className="mx-auto flex max-w-[1240px] flex-wrap items-center gap-x-6 gap-y-3 px-5 py-8">
            <h2 className="text-[17px] font-bold !text-[var(--pd-navy-900)]">{t("Coverage for residential HVAC contractors", "Cobertura para contratistas residenciales de HVAC")}</h2>
            <ul className="flex flex-wrap gap-2">{PLACES.map((p) => <li key={p} className="rounded-full border border-[#E6E2D8] bg-white px-3 py-1 text-[14px]">{p}</li>)}</ul>
            <Link to="/coverage" data-testid="landing-coverage" className="text-[15px] font-semibold text-[var(--pd-orange-700)] underline">{t("View coverage details", "Ver detalles de cobertura")}</Link>
          </div>
        </section>

        <section className="pd-dark bg-[var(--pd-navy-900)] text-white">
          <div className="mx-auto max-w-[1240px] px-5 py-20">
            <h2 className="max-w-[900px] font-display text-[44px] font-bold leading-[1.02] tracking-[-0.03em] !text-white sm:text-[64px]">{t("See it on a real heat pump change-out.", "Véalo en un cambio real de bomba de calor.")}</h2>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/demo" className="flex h-[52px] items-center rounded-[12px] bg-[var(--pd-orange-700)] px-6 text-[16px] font-bold text-white hover:bg-[var(--pd-orange-800)]">{t("Try the free demo", "Probar la demo gratis")}</Link>
              <a href="#workflow" className="flex h-[52px] items-center rounded-[12px] border border-[#2A3F63] px-6 text-[16px] font-bold text-white hover:bg-[#13264A]">{t("Replay the workflow", "Repetir el flujo")}</a>
              <Link to="/sample-job" data-testid="view-sample-packet" className="flex h-[52px] items-center px-2 text-[16px] font-bold text-[#FDBA74] underline">{t("View a sample packet", "Ver un paquete de muestra")}</Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="pd-dark bg-[#05080F] text-[#C9D2E0]">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-4 px-5 py-8 text-[13px]">
          <p className="max-w-[680px]">{t("PermitDraft prepares drafts for contractor review. It does not file permits or guarantee compliance. The licensed contractor is responsible for every submission.", "PermitDraft prepara borradores para revisión del contratista. No presenta permisos ni garantiza el cumplimiento. El contratista con licencia es responsable de cada presentación.")}</p>
          <nav aria-label={t("Footer", "Pie de página")} className="flex flex-wrap gap-4">
            <Link to="/coverage" className="underline hover:text-white">{t("What PermitDraft covers", "Qué cubre PermitDraft")}</Link>
            <Link to="/resources" className="underline hover:text-white">{t("Official resources", "Recursos oficiales")}</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

function Row2({ label, done, action }: { label: string; done?: boolean; action?: string }) {
  return (
    <div className="flex items-center gap-3 rounded-[10px] bg-white px-3 py-2.5">
      <span aria-hidden className={`grid size-6 shrink-0 place-items-center rounded-full ${done ? "bg-[var(--pd-success-bg)] text-[12px] font-extrabold text-[var(--pd-success-icon)]" : "border-2 border-dashed border-[#8A93A3]"}`}>{done ? "✓" : ""}</span>
      <span className="text-[15px] font-semibold">{label}</span>
      {action && <span className="ml-auto rounded-[8px] bg-[var(--pd-orange-700)] px-3 py-1.5 text-[13px] font-bold text-white">{action}</span>}
    </div>
  );
}
