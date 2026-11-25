import { useState } from "react";
import { useLang } from "../../lib/lang";

type Step = 0 | 1 | 2 | 3 | 4;
const STEPS: [string, string][] = [["Capture", "Capturar"], ["Queued", "En cola"], ["Delivered", "Entregado"], ["Review", "Revisión"], ["Sign", "Firma"]];
const CAPTION: [string, string][] = [
  ["Capture: the tech works down a checklist built for this permit.", "Capturar: el técnico sigue una lista hecha para este permiso."],
  ["Queued: no signal at the job site. The job waits on the phone and says so.", "En cola: no hay señal en el sitio. El trabajo espera en el teléfono y lo dice."],
  ["Delivered: the office has packet v1 only once the server confirms it.", "Entregado: la oficina tiene el paquete v1 solo cuando el servidor lo confirma."],
  ["Review: the panel label photo disagrees with what was typed. The office decides.", "Revisión: la foto de la etiqueta no coincide con lo escrito. La oficina decide."],
  ["Sign: the contractor signs one exact version. Then they file it with the city.", "Firma: el contratista firma una versión exacta. Luego la presenta a la ciudad."],
];

function Row({ done, title, sub }: { done: boolean; title: string; sub: string }) {
  return (
    <div className="flex items-center gap-3 rounded-[12px] bg-white px-3 py-2.5">
      <span aria-hidden className={`grid size-6 shrink-0 place-items-center rounded-full ${done ? "bg-[var(--pd-success-bg)] text-[12px] font-extrabold text-[var(--pd-success-icon)]" : "border-2 border-dashed border-[var(--pd-gray-500)]"}`}>{done ? "✓" : ""}</span>
      <div><p className="text-[14px] font-bold text-[var(--pd-navy-900)]">{title}</p><p className="text-[12px] text-[var(--pd-gray-600)]">{sub}</p></div>
    </div>
  );
}

/** The homepage's 5-step walk-through (HomepageA.dc.html): illustrative, sample data, nothing is sent. */
export function WorkflowDemo() {
  const { t } = useLang();
  const [s, setS] = useState<Step>(0);
  const phoneStatus = s === 0 ? t("Saved on phone", "Guardado en el teléfono") : s === 1 ? t("Queued · no signal", "En cola · sin señal") : t("Delivered to office", "Entregado a la oficina");
  const phonePill = s === 0 ? "bg-[var(--pd-navy-800)] text-white" : s === 1 ? "bg-[var(--pd-conflict-bg)] text-[var(--pd-conflict-fg)]" : "bg-[var(--pd-success-bg)] text-[var(--pd-success-fg)]";
  const captured = s === 0 ? 4 : 6;
  const officeOn = s >= 2;

  const phone = (
    <div className="mx-auto w-full max-w-[310px] rounded-[34px] border-[6px] border-[var(--pd-black)] bg-[var(--pd-gray-50)] shadow-xl">
      <div className="rounded-t-[28px] bg-[var(--pd-navy-900)] px-4 pb-4 pt-5 text-white">
        <div className="flex items-center justify-between gap-2"><span className="text-[13px] text-[var(--pd-on-navy-muted)]">{t("Job", "Trabajo")} PD-1187</span><span className={`rounded-full px-2.5 py-0.5 text-[12px] font-bold ${phonePill}`}>{phoneStatus}</span></div>
        <p className="mt-1 font-display text-[19px] font-bold">1187 Oak St, Pasadena</p>
        <p className="text-[13px] text-[var(--pd-on-navy-muted)]">{t("Heat pump change-out · Luis M.", "Cambio de bomba de calor · Luis M.")}</p>
      </div>
      <div className="flex flex-col gap-2 p-3">
        <Row done title={t("Outdoor data plate", "Placa de datos exterior")} sub="Carrier 25VNA036" />
        <Row done title={t("Model and serial", "Modelo y serie")} sub="25VNA036A003" />
        <Row done title={t("Panel rating", "Capacidad del panel")} sub="100 A" />
        <Row done={captured === 6} title={t("Outdoor unit photo", "Foto de la unidad exterior")} sub={captured === 6 ? t("Photo saved", "Foto guardada") : t("Needed for this permit", "Necesaria para este permiso")} />
        <Row done={captured === 6} title={t("Panel label photo", "Foto de la etiqueta del panel")} sub={captured === 6 ? t("Photo saved", "Foto guardada") : t("Needed for this permit", "Necesaria para este permiso")} />
        <div className={`mt-1 rounded-[12px] py-3 text-center text-[14px] font-bold ${s === 0 ? "bg-[var(--pd-gray-200)] text-[var(--pd-gray-700)]" : s === 1 ? "bg-[var(--pd-conflict-bg)] text-[var(--pd-conflict-fg)]" : "bg-[var(--pd-success-bg)] text-[var(--pd-success-fg)]"}`}>
          {s === 0 ? t("Capture 2 more to send", "Capture 2 más para enviar") : s === 1 ? t("Sends when there is signal", "Se envía cuando haya señal") : t("Packet v1 delivered", "Paquete v1 entregado")}
        </div>
      </div>
    </div>
  );

  const office = (
    <div className="flex min-h-[420px] flex-col gap-3 rounded-[20px] bg-[var(--pd-gray-50)] p-5 text-[var(--pd-navy-900)]">
      <div className="flex items-center justify-between gap-2"><p className="text-[17px] font-bold">{t("Office", "Oficina")} · PD-1187</p><span className="rounded-full bg-white px-2.5 py-0.5 font-mono text-[12px] text-[var(--pd-gray-700)]">{!officeOn ? t("Nothing received", "Nada recibido") : s === 4 ? "v2 · 7F3A·92C1" : s === 3 ? "v1 → v2" : "v1 · A91C·04E2"}</span></div>
      {!officeOn && <p className="text-[15px] text-[var(--pd-gray-700)]">{s === 0 ? t("Nothing received yet. Luis is still capturing PD-1187.", "Aún no se recibe nada. Luis sigue capturando PD-1187.") : t("Nothing received yet. The job is queued on Luis's phone, not lost and not sent.", "Aún no se recibe nada. El trabajo está en cola en el teléfono de Luis: ni perdido ni enviado.")}</p>}
      {s === 2 && (
        <div className="flex flex-col gap-2">
          <div className="rounded-[12px] border-2 border-[var(--pd-conflict-border)] bg-white p-3"><p className="text-[13px] font-bold text-[var(--pd-conflict-fg)]">{t("1 conflict", "1 conflicto")}</p><p className="text-[15px] font-semibold">{t("Panel rating: typed 100 A · label photo reads 125 A", "Capacidad: escrito 100 A · la foto dice 125 A")}</p></div>
          <div className="rounded-[12px] border border-[var(--pd-success-border)] bg-[var(--pd-success-soft-bg)] p-3 text-[15px] text-[var(--pd-success-fg)]">{t("5 items matched their photos", "5 datos coinciden con sus fotos")}</div>
          <p className="text-[13px] text-[var(--pd-gray-600)]">{t("Office email delivered (confirmed) · 9:47 AM", "Correo a la oficina entregado (confirmado) · 9:47 AM")}</p>
        </div>
      )}
      {s === 3 && (
        <div className="flex flex-col gap-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-[12px] bg-white p-3"><p className="text-[13px] text-[var(--pd-gray-700)]">{t("Luis entered", "Luis ingresó")}</p><p className="font-display text-[24px] font-bold">100 A</p></div>
            <div className="rounded-[12px] bg-white p-3"><p className="text-[13px] text-[var(--pd-gray-700)]">{t("Label photo reads", "La foto dice")}</p><p className="font-display text-[24px] font-bold">125 A</p></div>
          </div>
          <p className="rounded-[12px] bg-[var(--pd-orange-700)] px-3 py-2.5 text-center text-[14px] font-bold text-white">{t("Office chose: use photo value (125 A)", "La oficina eligió: usar el valor de la foto (125 A)")}</p>
          <p className="text-[14px] text-[var(--pd-gray-700)]">{t("That decision sealed version 2. Version 1 stays read-only.", "Esa decisión selló la versión 2. La versión 1 queda de solo lectura.")}</p>
        </div>
      )}
      {s === 4 && (
        <div className="flex flex-col gap-2">
          {[["v1 · A91C", t("Sent by Luis from PD-1187", "Enviado por Luis desde PD-1187")], ["v2 · 7F3A", t("Office set panel to 125 A from the label photo", "La oficina puso 125 A según la foto")]].map(([k, v]) => (
            <div key={k} className="flex items-center gap-3 rounded-[12px] border border-[var(--pd-gray-200)] bg-white p-3"><span className="rounded-full bg-[var(--pd-info-bg)] px-2.5 py-0.5 font-mono text-[12px] text-[var(--pd-info-fg)]">{k}</span><span className="text-[14px]">{v}</span></div>
          ))}
          <div className="flex items-center gap-3 rounded-[12px] border border-[var(--pd-success-border)] bg-[var(--pd-success-soft-bg)] p-3"><span className="rounded-full bg-[var(--pd-success-bg)] px-2.5 py-0.5 font-mono text-[12px] text-[var(--pd-success-fg)]">{t("Signed v2", "Firmado v2")}</span><span className="text-[14px] text-[var(--pd-success-fg)]">{t("Contractor signed. Ready to file on the city portal.", "El contratista firmó. Listo para presentar en el portal de la ciudad.")}</span></div>
        </div>
      )}
    </div>
  );

  return (
    <section id="workflow" aria-labelledby="wf-h" className="pd-dark rounded-[28px] bg-[var(--pd-navy-900)] p-4 text-white sm:p-7">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 id="wf-h" className="text-[17px] font-bold !text-white">{t("One job, start to finish", "Un trabajo, de principio a fin")}</h2>
        <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-[var(--pd-on-navy-muted)]">{t("Illustrative demo · sample data · no real permit is sent", "Demo ilustrativa · datos de muestra · no se envía ningún permiso real")}</p>
      </div>
      <div role="tablist" aria-label={t("Workflow steps", "Pasos del flujo")} className="flex gap-1 overflow-x-auto rounded-[14px] bg-[var(--pd-navy-800)] p-1 sm:grid sm:grid-cols-5">
        {STEPS.map(([en, es], i) => (
          <button key={en} role="tab" type="button" aria-selected={s === i} onClick={() => setS(i as Step)}
            className={`flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-[10px] px-3 text-[13px] sm:px-1 font-bold sm:text-[15px] ${s === i ? "bg-white text-[var(--pd-navy-900)]" : "text-white hover:bg-[var(--pd-navy-700)]"}`}>
            <span aria-hidden className={`hidden size-6 place-items-center rounded-full text-[12px] sm:grid ${s === i ? "bg-[var(--pd-orange-700)] text-white" : "bg-[var(--pd-navy-700)] text-white"}`}>{i + 1}</span>{t(en, es)}
          </button>
        ))}
      </div>
      <div className="my-4 h-1 overflow-hidden rounded-full bg-[var(--pd-navy-700)]"><div className="h-full bg-[var(--pd-orange-500)] transition-[width] duration-300" style={{ width: `${((s + 1) / 5) * 100}%` }} /></div>
      <div role="tabpanel" aria-live="polite" className="grid items-start gap-5 md:grid-cols-[310px_minmax(0,1fr)]">
        <div className={s >= 2 ? "hidden md:block" : ""}>{phone}</div>
        <div className={s < 2 ? "hidden md:block" : ""}>{office}</div>
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[15px] text-white">{t(`Step ${s + 1} of 5. `, `Paso ${s + 1} de 5. `)}{t(...CAPTION[s])}</p>
        <button type="button" onClick={() => setS(((s + 1) % 5) as Step)} className="h-12 rounded-[12px] bg-[var(--pd-orange-700)] px-5 text-[15px] font-bold text-white hover:bg-[var(--pd-orange-800)]">{s === 4 ? t("Replay ↺", "Repetir ↺") : t("Next step →", "Siguiente paso →")}</button>
      </div>
    </section>
  );
}
