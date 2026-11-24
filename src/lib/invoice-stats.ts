/** Shared by Invoices and the Office Command Center so both show the same recorded-paid month-to-date figure. */
export type PaidInv = { status: string; paid_on: string | null; total_cents: number };

export const usd = (c: number) => (c / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
export const localToday = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };

/** Recorded payments dated this calendar month up to today; drafts never count. */
export function monthToDate(invs: PaidInv[]) {
  const now = localToday(); const start = now.slice(0, 8) + "01";
  const paid = invs.filter((i) => i.status === "paid" && i.paid_on && i.paid_on >= start && i.paid_on <= now);
  return { total: paid.reduce((s, i) => s + i.total_cents, 0), count: paid.length };
}
