import { useCallback, useEffect, useMemo, useState } from "react";
import { backend } from "../lib/backend";
import { useLang } from "../lib/lang";
import { Gate } from "./crm";
import { monthToDate, localToday } from "../lib/invoice-stats";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "./ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Plus, Trash2 } from "lucide-react";

type Inv = { id: string; packet_id: string; number: string; status: "draft" | "paid"; tax_bps: number; subtotal_cents: number; tax_cents: number; total_cents: number; paid_on: string | null; paid_by: string | null; updated_by: string; updated_at: string };
type Line = { id: string; invoice_id: string; position: number; description: string; quantity: number; unit_cents: number; amount_cents: number };
type Pk = { id: string; job_id: string; tracking_no: string; captured_fields: { values?: Record<string, string>; formDefaults?: Record<string, string> } | null };
type Row = { description: string; quantity: string; price: string };

const usd = (c: number) => (c / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
const cents = (v: string) => { const n = Number(v.replace(/[$,\s]/g, "")); return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : NaN; };
const today = localToday;
const fmtDate = (d: string, lang: string) => new Date(d + "T00:00:00").toLocaleDateString(lang === "es" ? "es" : "en-US", { dateStyle: "medium" });

function calc(rows: Row[], taxPct: string) {
  let sub = 0; let ok = rows.length > 0;
  for (const r of rows) {
    const q = Number(r.quantity); const u = cents(r.price);
    if (!r.description.trim() || !(q > 0) || q > 100000 || Number.isNaN(u)) { ok = false; continue; }
    sub += Math.round(q * u);
  }
  const pct = Number(taxPct || "0");
  if (!(pct >= 0 && pct <= 30)) ok = false;
  const bps = Math.round((Number.isFinite(pct) ? pct : 0) * 100);
  const tax = Math.round(sub * bps / 10000);
  return { sub, tax, total: sub + tax, bps, ok };
}

export function InvoicesPage() {
  const { t } = useLang();
  return (
    <Gate title={t("Invoices", "Facturas")} intro={t("Private draft invoices for your company's jobs. Record a payment by hand when you are paid. Nothing is collected or emailed.", "Facturas borrador privadas para los trabajos de su empresa. Registre un pago a mano cuando le paguen. No se cobra ni se envía nada.")}>
      {(company) => <Invoices company={company} />}
    </Gate>
  );
}

function Invoices({ company }: { company: string }) {
  const { t, lang } = useLang();
  const [invs, setInvs] = useState<Inv[] | null>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const [packets, setPackets] = useState<Pk[]>([]);
  const [sel, setSel] = useState<string | "new" | null>(null);
  const [err, setErr] = useState(false);
  const load = useCallback(async () => {
    const [a, b, c] = await Promise.all([
      backend.from("invoices").select("id, packet_id, number, status, tax_bps, subtotal_cents, tax_cents, total_cents, paid_on, paid_by, updated_by, updated_at").eq("company_id", company).order("created_at", { ascending: false }),
      backend.from("invoice_lines").select("id, invoice_id, position, description, quantity, unit_cents, amount_cents").eq("company_id", company).order("position"),
      backend.from("office_packets").select("id, job_id, tracking_no, captured_fields").eq("company_id", company).order("sent_at", { ascending: false }).limit(500),
    ]);
    if (a.error || b.error || c.error) { setErr(true); return; }
    setInvs(a.data as Inv[]); setLines((b.data as Line[]).map((l) => ({ ...l, quantity: Number(l.quantity) }))); setPackets(c.data as Pk[]);
  }, [company]);
  useEffect(() => { void load(); }, [load]);
  const label = useCallback((id: string) => {
    const p = packets.find((x) => x.id === id);
    if (!p) return id;
    const v = { ...(p.captured_fields?.formDefaults ?? {}), ...(p.captured_fields?.values ?? {}) };
    return `${p.tracking_no} · ${t("Job", "Trabajo")} ${p.job_id}${v.addr ? " · " + v.addr : ""}`;
  }, [packets, t]);
  const mtd = useMemo(() => monthToDate(invs ?? []), [invs]);
  const cur = invs?.find((i) => i.id === sel) ?? null;
  return (
    <section className="oh-queue crm" aria-label={t("Invoices", "Facturas")} data-testid="invoices">
      <div className="crm-head">
        <div data-testid="inv-mtd">
          <p className="ap-muted">{t("Recorded payments this month", "Pagos registrados este mes")}</p>
          {invs === null ? <p className="ap-muted">—</p> : mtd.count === 0
            ? <p className="ap-muted" data-testid="inv-mtd-none">{t("No payments recorded yet this month.", "Aún no hay pagos registrados este mes.")}</p>
            : <p><strong data-testid="inv-mtd-total">{usd(mtd.total)}</strong> <span className="ap-muted">{t(`from ${mtd.count} invoice(s)`, `de ${mtd.count} factura(s)`)}</span></p>}
        </div>
        <Button type="button" className="crm-track-btn" onClick={() => setSel("new")} disabled={packets.length === 0} data-testid="inv-new"><Plus size={18} aria-hidden />{t("New invoice", "Nueva factura")}</Button>
      </div>
      {err ? <p className="ap-muted" role="alert">{t("Could not load invoices.", "No se pudieron cargar las facturas.")}</p>
        : invs === null ? <p className="ap-muted" role="status">{t("Loading…", "Cargando…")}</p>
        : invs.length === 0 ? <div className="jb-empty" data-testid="inv-empty"><p>{packets.length === 0 ? t("Invoices attach to a job your technicians sent. No jobs have been sent to your office yet.", "Las facturas se vinculan a un trabajo enviado por sus técnicos. Aún no hay trabajos enviados.") : t("No invoices yet. Start one for a job.", "Aún no hay facturas. Cree una para un trabajo.")}</p></div>
        : (
          <ul className="oh-rows" data-testid="inv-list">
            {invs.map((i) => (
              <li key={i.id} className="oh-row" data-testid="inv-row">
                <div className="oh-row-main">
                  <div className="jb-top"><span className="jb-addr">{i.number} · {usd(i.total_cents)}</span><span className="oh-stage" data-testid="inv-status">{i.status === "paid" ? t("Paid", "Pagada") : t("Draft", "Borrador")}</span></div>
                  <span className="ap-muted">{label(i.packet_id)}</span>
                  {i.paid_on && <span className="ap-muted">{t("Payment recorded for", "Pago registrado el")} {fmtDate(i.paid_on, lang)}</span>}
                </div>
                <div className="oh-row-actions"><Button type="button" variant="outline" className="oh-more" onClick={() => setSel(i.id)} data-testid="inv-open">{t("Open invoice", "Abrir factura")}</Button></div>
              </li>
            ))}
          </ul>
        )}
      <Sheet open={sel !== null} onOpenChange={(o) => !o && setSel(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto p-4">
          <SheetHeader>
            <SheetTitle>{sel === "new" ? t("New invoice", "Nueva factura") : cur?.number ?? ""}</SheetTitle>
            <SheetDescription>{t("Line items, tax and a manually recorded payment.", "Conceptos, impuesto y un pago registrado a mano.")}</SheetDescription>
          </SheetHeader>
          {sel === "new" && <InvoiceForm key="new" company={company} inv={null} lines={[]} packets={packets} label={label} onSaved={async (id) => { await load(); setSel(id); }} />}
          {cur && <InvoiceForm key={cur.id + cur.updated_at} company={company} inv={cur} lines={lines.filter((l) => l.invoice_id === cur.id)} packets={packets} label={label} onSaved={async () => { await load(); }} onDeleted={async () => { setSel(null); await load(); }} />}
        </SheetContent>
      </Sheet>
    </section>
  );
}

function InvoiceForm({ company, inv, lines, packets, label, onSaved, onDeleted }: { company: string; inv: Inv | null; lines: Line[]; packets: Pk[]; label: (id: string) => string; onSaved: (id: string) => Promise<void>; onDeleted?: () => Promise<void> }) {
  const { t, lang } = useLang();
  const paid = inv?.status === "paid";
  const [packet, setPacket] = useState(inv?.packet_id ?? "");
  const [taxPct, setTaxPct] = useState(inv ? String(inv.tax_bps / 100) : "0");
  const [rows, setRows] = useState<Row[]>(lines.length ? lines.map((l) => ({ description: l.description, quantity: String(l.quantity), price: (l.unit_cents / 100).toFixed(2) })) : [{ description: "", quantity: "1", price: "" }]);
  const [paidOn, setPaidOn] = useState(today());
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const c = calc(rows, taxPct);
  const setRow = (i: number, k: keyof Row, v: string) => setRows(rows.map((r, j) => (j === i ? { ...r, [k]: v } : r)));
  const payload = (id: string) => rows.map((r, i) => ({ invoice_id: id, company_id: company, position: i + 1, description: r.description.trim(), quantity: Number(r.quantity), unit_cents: cents(r.price) }));
  const save = async () => {
    if (!packet) { setMsg(t("Choose a job.", "Elija un trabajo.")); return; }
    if (!c.ok) { setMsg(t("Every line needs a description, a quantity above 0 and a price; tax is 0 to 30%.", "Cada línea necesita descripción, cantidad mayor que 0 y precio; el impuesto es de 0 a 30 %.")); return; }
    setBusy(true); setMsg(null);
    try {
      let id = inv?.id;
      if (!inv) {
        const r = await backend.from("invoices").insert({ company_id: company, packet_id: packet, tax_bps: c.bps }).select("id").maybeSingle();
        if (r.error || !r.data) throw new Error("invoice");
        id = r.data.id as string;
        const ins = await backend.from("invoice_lines").insert(payload(id));
        if (ins.error) { await backend.from("invoices").delete().eq("id", id); throw new Error("lines"); }
      } else {
        const ins = await backend.from("invoice_lines").insert(payload(inv.id));
        if (ins.error) throw new Error("lines");
        const del = await backend.from("invoice_lines").delete().in("id", lines.map((l) => l.id));
        if (del.error) throw new Error("lines");
        const up = await backend.from("invoices").update({ tax_bps: c.bps }).eq("id", inv.id).select("id").maybeSingle();
        if (up.error || !up.data) throw new Error("invoice");
      }
      await onSaved(id!);
    } catch { setMsg(t("Not saved. Check your role and the amounts, then try again.", "No se guardó. Revise su rol y los montos e intente de nuevo.")); }
    setBusy(false);
  };
  const markPaid = async () => {
    if (!inv) return;
    setBusy(true); setMsg(null);
    const r = await backend.from("invoices").update({ status: "paid", paid_on: paidOn }).eq("id", inv.id).select("id").maybeSingle();
    setBusy(false);
    if (r.error || !r.data) { setMsg(t("Not recorded. Use a date that is not in the future and an invoice with an amount.", "No se registró. Use una fecha que no sea futura y una factura con monto.")); return; }
    await onSaved(inv.id);
  };
  const remove = async () => {
    if (!inv) return;
    const r = await backend.from("invoices").delete().eq("id", inv.id);
    if (r.error) { setMsg(t("Not deleted.", "No se eliminó.")); return; }
    await onDeleted?.();
  };
  const shown = paid && inv ? { sub: inv.subtotal_cents, tax: inv.tax_cents, total: inv.total_cents } : c;
  return (
    <div className="oh-form" data-testid="invoice-form">
      <div className="ap-field">
        <label htmlFor="iv-job">{t("Job", "Trabajo")}</label>
        {inv ? <p id="iv-job" className="ap-muted">{label(inv.packet_id)}</p> : (
          <Select value={packet} onValueChange={setPacket}>
            <SelectTrigger id="iv-job" className="oh-select" data-testid="iv-job"><SelectValue placeholder={t("Choose a job", "Elija un trabajo")} /></SelectTrigger>
            <SelectContent>{packets.map((p) => <SelectItem key={p.id} value={p.id}>{label(p.id)}</SelectItem>)}</SelectContent>
          </Select>
        )}
      </div>
      <h3 className="crm-h3">{t("Line items", "Conceptos")}</h3>
      {rows.map((r, i) => (
        <div key={i} className="oh-form-grid" data-testid="iv-line">
          <div className="ap-field"><label htmlFor={`iv-d${i}`}>{t("Description", "Descripción")}</label><Input id={`iv-d${i}`} value={r.description} maxLength={200} disabled={paid} onChange={(e) => setRow(i, "description", e.target.value)} data-testid="iv-desc" /></div>
          <div className="ap-field"><label htmlFor={`iv-q${i}`}>{t("Quantity", "Cantidad")}</label><Input id={`iv-q${i}`} inputMode="decimal" value={r.quantity} disabled={paid} onChange={(e) => setRow(i, "quantity", e.target.value)} data-testid="iv-qty" /></div>
          <div className="ap-field"><label htmlFor={`iv-p${i}`}>{t("Unit price (USD)", "Precio unitario (USD)")}</label><Input id={`iv-p${i}`} inputMode="decimal" value={r.price} disabled={paid} onChange={(e) => setRow(i, "price", e.target.value)} data-testid="iv-price" /></div>
          {!paid && rows.length > 1 && <Button type="button" variant="outline" className="oh-more" onClick={() => setRows(rows.filter((_, j) => j !== i))} aria-label={t("Remove line", "Quitar línea")}><Trash2 size={16} aria-hidden /></Button>}
        </div>
      ))}
      {!paid && <div className="oh-save"><Button type="button" variant="outline" onClick={() => setRows([...rows, { description: "", quantity: "1", price: "" }])} disabled={rows.length >= 50} data-testid="iv-add-line"><Plus size={16} aria-hidden />{t("Add line", "Agregar línea")}</Button></div>}
      <div className="ap-field"><label htmlFor="iv-tax">{t("Tax rate (%)", "Impuesto (%)")}</label><Input id="iv-tax" inputMode="decimal" value={taxPct} disabled={paid} onChange={(e) => setTaxPct(e.target.value)} data-testid="iv-tax" /></div>
      <dl className="crm-note" data-testid="iv-totals">
        <div><dt>{t("Subtotal", "Subtotal")}</dt><dd data-testid="iv-sub">{usd(shown.sub)}</dd></div>
        <div><dt>{t("Tax", "Impuesto")}</dt><dd data-testid="iv-taxamt">{usd(shown.tax)}</dd></div>
        <div><dt>{t("Total", "Total")}</dt><dd><strong data-testid="iv-total">{usd(shown.total)}</strong></dd></div>
      </dl>
      {!paid && <div className="oh-save">
        <Button type="button" onClick={save} disabled={busy} data-testid="iv-save">{inv ? t("Save draft", "Guardar borrador") : t("Create draft invoice", "Crear factura borrador")}</Button>
        {inv && <Button type="button" variant="outline" onClick={remove} data-testid="iv-delete">{t("Delete draft", "Eliminar borrador")}</Button>}
        {msg && <span role="status" className="ap-muted">{msg}</span>}
      </div>}
      {inv && !paid && (
        <div className="oh-details" data-testid="iv-pay">
          <h3 className="crm-h3">{t("Record payment", "Registrar pago")}</h3>
          <p className="crm-note">{t("Only records that you were paid, on the date you choose. It does not collect or send anything. Save any line changes first.", "Solo registra que le pagaron, en la fecha elegida. No cobra ni envía nada. Guarde primero los cambios de líneas.")}</p>
          <div className="ap-field"><label htmlFor="iv-date">{t("Date paid", "Fecha de pago")}</label><Input id="iv-date" type="date" value={paidOn} max={today()} onChange={(e) => setPaidOn(e.target.value)} data-testid="iv-date" /></div>
          <div className="oh-save"><Button type="button" onClick={markPaid} disabled={busy || !paidOn} data-testid="iv-paid">{t("Record as paid", "Registrar como pagada")}</Button></div>
        </div>
      )}
      {inv && paid && <p className="ap-muted" data-testid="iv-paid-note">{t("Payment recorded for", "Pago registrado el")} {inv.paid_on && fmtDate(inv.paid_on, lang)} · {inv.paid_by || "—"}</p>}
    </div>
  );
}
