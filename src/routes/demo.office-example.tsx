import { createFileRoute, Link } from "@tanstack/react-router";
import { AppPage } from "../components/app-shell";
import { DemoProvider, DEMO_PHOTO } from "../components/demo";
import { Image } from "../image";
import { useLang } from "../lib/lang";

export const Route = createFileRoute("/demo/office-example")({
  head: () => ({ meta: [{ title: "Example office handoff packet — PermitDraft" }, { name: "description", content: "A read-only example heat-pump handoff: employee ID, photos, notes, readings and office review status." }] }),
  component: () => <DemoProvider><Example /></DemoProvider>,
});

const READINGS: [string, string, string, string][] = [
  ["Refrigerant", "Refrigerante", "R-410A", "R-410A"],
  ["Suction pressure", "Presión de succión", "118 psig", "118 psig"],
  ["Liquid line temperature", "Temperatura de línea de líquido", "96 °F", "96 °F"],
  ["Supply / return split", "Diferencial suministro / retorno", "18 °F", "18 °F"],
];

function Example() {
  const { t } = useLang();
  return (
    <AppPage bottom wide>
      <header className="jb-head">
        <div className="jb-title"><h1>{t("Example handoff packet", "Paquete de entrega de ejemplo")}</h1></div>
        <p className="ap-muted">{t("Read-only example with fictional data. Nothing is sent or filed.", "Ejemplo de solo lectura con datos ficticios. No se envía ni se presenta nada.")}</p>
      </header>
      <section className="cx-card calm" data-testid="ex-id">
        <h2 className="cx-h">{t("Submitted by", "Enviado por")}</h2>
        <p><strong>{t("Employee ID", "ID de empleado")}:</strong> TECH-0427 (Sample Tech)</p>
        <p>{t("Job", "Trabajo")} EX-1001 · {t("Heat-pump change-out", "Cambio de bomba de calor")} · 100 Sample Street, Sampleville</p>
        <p>{t("Customer: Sample Customer", "Cliente: Cliente de Ejemplo")}</p>
      </section>
      <section className="cx-card calm" data-testid="ex-status">
        <h2 className="cx-h">{t("Office review status", "Estado de revisión de oficina")}</h2>
        <p className="font-semibold">{t("Ready for office review", "Listo para revisión de oficina")} · {t("Not ready for filing", "No listo para presentar")}</p>
        <p className="cx-note">{t("Waiting on: office to check the sample notes.", "Pendiente: la oficina revisa las notas de ejemplo.")}</p>
      </section>
      <section className="cx-card calm" data-testid="ex-photos">
        <h2 className="cx-h">{t("Captured photos", "Fotos capturadas")}</h2>
        <Image src={DEMO_PHOTO} alt={t("Sample equipment data plate", "Placa de datos de equipo de ejemplo")} width={480} height={360} className="w-full max-w-md rounded-lg object-cover" />
        <p className="cx-note">{t("Equipment data plate (outdoor unit) · 1 of 3 photos", "Placa de datos del equipo (unidad exterior) · 1 de 3 fotos")}</p>
      </section>
      <section className="cx-card calm" data-testid="ex-readings">
        <h2 className="cx-h">{t("Readings", "Lecturas")}</h2>
        <ul>{READINGS.map(([a, b, c, d]) => <li key={a} className="ap-chk"><span style={{ flex: 1 }}>{t(a, b)}</span><strong>{t(c, d)}</strong></li>)}</ul>
      </section>
      <section className="cx-card calm" data-testid="ex-notes">
        <h2 className="cx-h">{t("Technician notes", "Notas del técnico")}</h2>
        <p>{t("Replaced the outdoor unit on the same pad. Line set flushed, nitrogen pressure test held, charge verified.", "Se reemplazó la unidad exterior en la misma base. Línea lavada, prueba de nitrógeno aprobada, carga verificada.")}</p>
      </section>
      <Link to="/demo/office-handoff" className="ap-btn ghost">{t("Back to office handoff", "Volver a entrega a oficina")}</Link>
    </AppPage>
  );
}
