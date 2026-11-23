// Foundable payments kit: the website's own orders, made and read in its server code, and every sale read back, a Buy
// button's included. Foundable keeps this file and replaces it whole when the kit changes, so never edit it. The website's
// server prices each order itself (its cart or quote, and the shipping it worked out) and sells it here as one order on
// Stripe's checkout page. Foundable's hosting proves each call is this website's, so the website holds no payments key; in
// Build's preview an order is a test order on Stripe's test page, and a Buy a test sale.
// Call these only from server code: a server function or a route under src/routes/api/, never from a page.
import { getRequest } from "@tanstack/react-start/server";

/**
 * One line of an order, in Stripe's own Checkout fields: its price per unit in the smallest unit of the business's currency
 * (cents), how many, and where the site keeps one, the item's own code (`metadata.sku`, one `isItemCode` takes), which the
 * paid order's lines hand back. It names no currency: the business sets the one it sells in in Foundable, and createOrder
 * names that one on every line as it makes the order. A `currency` written here is one a website built for an earlier kit
 * still names.
 */
export interface OrderLine {
  price_data: { currency?: string; unit_amount: number; product_data: { name: string; metadata?: { sku: string } } };
  quantity: number;
}

/**
 * Whether Foundable takes `code` as a line's item code (`metadata.sku`), by its order rule: the item's SKU on one line, 1 to 100
 * characters with no control or invisible character, no space at either end and no accent mark first, such as the id the maker
 * or warehouse that ships it knows it by ("TEE-BLU-M") or a store's own ("HB WHOLE"); its size and colour go in its name.
 * Foundable refuses a whole order for one code it does not take, so priceCart from cart.server.ts refuses such a cart item
 * before any order is made.
 */
export function isItemCode(code: unknown): code is string {
  return typeof code === "string" && /^(?![\s\p{M}])[^\p{Cc}\p{Cf}\p{Cs}\p{Zl}\p{Zp}]{1,100}(?<!\s)$/u.test(code);
}

/** A delivery estimate's bound, in Stripe's fields. */
export interface DeliveryBound { unit: "hour" | "day" | "business_day" | "week" | "month"; value: number }

/**
 * The one shipping charge the website worked out (its own rate, or a carrier's the buyer picked), in Stripe's fields, its
 * amount in the smallest unit of the business's currency and its currency left out, as a line's is.
 */
export interface OrderShipping {
  shipping_rate_data: { type: "fixed_amount"; fixed_amount: { amount: number; currency?: string }; display_name: string;
    delivery_estimate?: { minimum?: DeliveryBound; maximum?: DeliveryBound } };
}

/** Where an order ships, in Stripe's fields: a name and an address with its two-letter country. */
export interface OrderAddress {
  name: string;
  phone?: string;
  address: { line1: string; line2?: string; city?: string; state?: string; postal_code?: string; country: string };
}

/**
 * An order as the website's server asks for it, in Stripe's own Checkout Session fields: its lines, at most one shipping
 * charge with the address it ships to (passed as `payment_intent_data.shipping`, or asked on Stripe's page with
 * `shipping_address_collection`), the website's own order number, the buyer's email where it knows it, and its own pages on
 * its own address that Stripe sends the buyer back to. The thanks page's address carries the website's own order number, never
 * Stripe's `{CHECKOUT_SESSION_ID}`: readOrder takes the `id` this order answers with, which the website saves by its number.
 */
export interface NewOrder {
  /** At most 16 lines: Foundable refuses a larger order, and cuts a line's name past 120 characters. */
  line_items: OrderLine[];
  shipping_options?: [OrderShipping];
  payment_intent_data?: { shipping: OrderAddress };
  shipping_address_collection?: { allowed_countries: string[] };
  /** The website's own order number, at most 200 characters. */
  client_reference_id: string;
  customer_email?: string;
  success_url: string;
  cancel_url: string;
  /** When the checkout page closes unpaid, in Unix seconds: 35 minutes to 24 hours from now; 35 minutes by default. */
  expires_at?: number;
}

/** A paid order's shipment once its seller marks it: `trackingUrl` is the page of a carrier Foundable has no address for. */
export interface OrderShipment { carrier: string; trackingNumber: string | null; trackingUrl: string | null; shippedAt: string }

/**
 * A sale as Foundable holds it, in Stripe's words: the website's own order, or a Buy button's sale (`kind`). `url` is its
 * checkout page while it can be paid, `test` says it is a preview's test sale, which never ships, and `shipment` is null until
 * its seller marks an order shipped. A Buy's sale names what it sold (`price_handle`, `product_handle`, the sales plan's) and the
 * website's own signed-in buyer (`user_id`, null for a guest's), its `client_reference_id` the sale's own id; an order's three
 * are null, and `customer_email` is the email the buyer gave Stripe's Checkout. A preview's test sale is recorded and delivers
 * nothing: Foundable tells it paid only to orderEvents and orderReturn, which hand it to the website's own test handler,
 * never with its buyer's email. `check` marks a site check's test sale (Ted's check of the website), which goes through the
 * website's fulfilment as a live sale does, its emails to the check's own address kept unsent. `delivery_consent` is the
 * sentence its buyer ticked on Stripe's checkout page before paying, as Stripe showed it (its purchase terms link in Stripe's
 * `[words](address)` form), where the owner had Ted ask one for what it sold; null where checkout asked none.
 */
export interface Order {
  id: string;
  kind: "buy" | "order";
  status: "pending" | "issued" | "paid" | "expired" | "failed";
  /**
   * Whether its buyer completed the checkout page and the payment is still on its way, as a bank debit's or a voucher's is for
   * days: an `issued` order that is neither open to pay nor ended yet. What the website holds for it stays held until it is
   * paid or fails. A Buy's sale, which holds nothing, never is; an older Foundable says nothing of it.
   */
  settling?: boolean;
  url: string | null;
  client_reference_id: string;
  /** The total it was made at, an order's what the website saved, which a website fulfils by. */
  amount_total: number;
  currency: string;
  expires_at: number;
  /**
   * Once paid, what its buyer bought and paid, else null: how many of a Buy's item (null for an order, whose lines say), what
   * Stripe charged, what a discount code took off and the tax Stripe added. A website shows `amount_paid` as what was paid.
   */
  quantity: number | null;
  amount_paid: number | null;
  amount_discount: number | null;
  amount_tax: number | null;
  amount_refunded: number;
  disputed: boolean;
  customer_email: string | null;
  shipping_details: OrderAddress | null;
  test: boolean;
  check: boolean;
  shipment: OrderShipment | null;
  price_handle: string | null;
  product_handle: string | null;
  user_id: string | null;
  delivery_consent: string | null;
}

/** What a refused order call tells the website's buyer, by its code: Foundable's words, the ones its Buy buttons say. */
const buyerWords: { codes: Record<string, string>; otherwise: string } = {"codes":{"not_ready":"This site isn’t taking payments right now.","unauthenticated":"This site isn’t taking payments right now.","not_configured":"This site isn’t taking payments right now.","rate_limited":"Too many tries. Please wait a moment and try again."},"otherwise":"Something went wrong. Please try again."};

/**
 * Why Foundable refused an order call: its HTTP status and code, the plain sentence its buyer may read (its message, which a
 * page shows as it is) and Foundable's own reason (`problem`, naming the field a refused order breaks), which the website's
 * server log keeps, where its owner and Foundable read it. `not_saved` is the kit's own: an order the website's save did not
 * hold (createOrder's `save`), its `cause` what the save failed with.
 */
export class OrderError extends Error {
  constructor(readonly status: number, readonly code: string, readonly problem: string, options?: ErrorOptions) {
    super(buyerWords.codes[code] ?? buyerWords.otherwise, options);
    this.name = "OrderError";
  }
}

/** A refused call, its reason written to the website's server log as it is thrown. */
function refused(status: number, code: string, problem: string): OrderError {
  console.error(`Foundable refused this website's order call (${status} ${code}): ${problem}`);
  return new OrderError(status, code, problem);
}

/**
 * The signed-in shopper's session the page sent this server with the request it is answering (sessionHeaders() from buy.tsx,
 * sent with the checkout's call), which createOrder hands Foundable, so an order the website's owner or an admin makes on the
 * live website in Test on live site is a test one; null outside a request, or with nobody signed in.
 */
function shopperSession(): string | null {
  try {
    return getRequest().headers.get("x-foundable-session");
  } catch {
    return null;
  }
}

/**
 * One call to the website's own orders at Foundable, on the address and, in a live preview, the credential Foundable set, with
 * the kit's record-only word where the call is the kit's own read of a test sale, and a create's shopper's session where the page
 * sent one.
 */
async function call(path: string, init: { method: "GET" | "POST"; body?: unknown; idempotencyKey?: string; recordOnly?: boolean;
  session?: string | null }): Promise<Order> {
  const address = process.env.FOUNDABLE_PAYMENTS_URL;
  if (!address) throw refused(503, "not_configured", "This website sells no orders where it runs now.");
  const token = process.env.FOUNDABLE_PAYMENTS_PREVIEW_TOKEN;
  const response = await fetch(`${address}${path}`, { method: init.method,
    headers: { ...(init.body === undefined ? {} : { "content-type": "application/json" }),
      ...(init.idempotencyKey ? { "idempotency-key": init.idempotencyKey } : {}), ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(init.recordOnly ? { ["foundable-test-sales"]: "record-only" } : {}),
      ...(init.session ? { ["foundable-app-session"]: init.session } : {}) },
    ...(init.body === undefined ? {} : { body: JSON.stringify(init.body) }) });
  const answer = await response.json().catch(() => null) as { error?: { code?: string; message?: string } } | null;
  if (!response.ok) throw refused(response.status, answer?.error?.code ?? "unavailable", answer?.error?.message ?? "Foundable could not take the order.");
  return answer as unknown as Order;
}

/**
 * What this website's orders are taken on now. The business sets its currency in Foundable (its Settings, or Ted for it), and
 * a change there reaches every page and checkout by itself, so the website's code names no currency, code or sign.
 */
export interface OrderTerms {
  /** The currency every price and order is in, Stripe's three lowercase letters ("eur"); null where Foundable names none yet, and then nothing is priced or sold. */
  currency: string | null;
  /** How many of an amount's last digits are its decimals in that currency: 2 where 1250 is 12.50; 0 where it has nothing smaller, so 500 is 500. */
  decimals: number;
  /** Whether an order is taken now: false while the business's payments are not set up, and then pages show what is for sale with nothing to buy. */
  sells: boolean;
  /** Whether an order made here is a test (a preview's), paid with Stripe's test card. */
  test: boolean;
}

/** The currencies Stripe writes an amount of in whole units (500 is 500 JPY); every other amount is in hundredths. */
const wholeUnits: ReadonlySet<string> = new Set(["bif","clp","djf","gnf","jpy","kmf","krw","mga","pyg","rwf","vnd","vuv","xaf","xof","xpf"]);

/** How many of an amount's last digits are its decimals in `currency`: 0 where Stripe writes it in whole units, else 2. */
export function currencyDecimals(currency: string): number {
  return wholeUnits.has(currency.toLowerCase()) ? 0 : 2;
}

/** An amount in a currency's smallest unit as a plain number, as a page's data states a price: 1250 at 2 decimals is "12.50", 500 at none "500". */
export function amountText(amount: number, decimals: number): string {
  const written = String(amount).padStart(decimals + 1, "0");
  return decimals ? `${written.slice(0, -decimals)}.${written.slice(-decimals)}` : written;
}

/** What stands where Foundable has given no answer yet: no currency, nothing sold. */
const noTerms: OrderTerms = { currency: null, decimals: 2, sells: false, test: false };
/** How long a read that got no answer stands before Foundable is asked again, so a door that is down is not asked on every page view. */
const askAgainMs = 5_000;
/** How long one read may take: past it there is no answer, so a slow door never holds a page that shows a price. */
const readMs = 3_000;
/** Foundable's last answer and until when it stands. */
let held: { terms: OrderTerms; until: number } | null = null;

/**
 * One read of the terms at Foundable, made by the request that asks and never awaited from a read another request began:
 * where the website runs on Cloudflare, a read whose own request ended first (its visitor left) never settles, and every
 * request waiting on it would hang. A read that fails, that Foundable refuses or that runs past `readMs` is no answer: the
 * last one stands.
 */
async function askTerms(): Promise<OrderTerms> {
  const address = process.env.FOUNDABLE_PAYMENTS_URL;
  if (!address) return noTerms;
  try {
    const token = process.env.FOUNDABLE_PAYMENTS_PREVIEW_TOKEN;
    const response = await fetch(`${address}/terms`, { method: "GET", headers: token ? { authorization: `Bearer ${token}` } : {},
      signal: AbortSignal.timeout(readMs) });
    const answer = response.ok ? await response.json() as { currency?: unknown; sells?: unknown; test?: unknown; freshSeconds?: unknown } | null : null;
    if (!answer || (answer.currency !== null && typeof answer.currency !== "string")) throw new Error("Foundable gave no terms.");
    const currency = answer.currency === null ? null : answer.currency.toLowerCase();
    const terms = { currency, decimals: currency === null ? 2 : currencyDecimals(currency), sells: answer.sells === true, test: answer.test === true };
    const freshMs = typeof answer.freshSeconds === "number" && answer.freshSeconds > 0 ? answer.freshSeconds * 1000 : askAgainMs;
    held = { terms, until: Date.now() + freshMs };
  } catch {
    held = { terms: held?.terms ?? noTerms, until: Date.now() + askAgainMs };
  }
  return held.terms;
}

/**
 * The website's order terms as Foundable holds them now: the currency its prices and orders are in, how its amounts are
 * written, and whether an order is taken. A page's loader reads them through a server function to show its prices, and
 * createOrder prices by them. Foundable's answer is kept for as long as it says, so calling this on every request costs
 * nothing; while it cannot be reached the last answer stands, and with none there is no currency and nothing is sold. It
 * never throws.
 */
export function orderTerms(): Promise<OrderTerms> {
  return held && Date.now() < held.until ? Promise.resolve(held.terms) : askTerms();
}

/** The order with `currency` on each line and shipping charge that names none, as Foundable takes it. */
function inCurrency(order: NewOrder, currency: string): NewOrder {
  return { ...order,
    line_items: order.line_items.map(line => ({ ...line, price_data: { ...line.price_data, currency: line.price_data.currency ?? currency } })),
    ...(order.shipping_options ? { shipping_options: order.shipping_options.map(option => ({ shipping_rate_data: { ...option.shipping_rate_data,
      fixed_amount: { ...option.shipping_rate_data.fixed_amount, currency: option.shipping_rate_data.fixed_amount.currency ?? currency } } })) as [OrderShipping] } : {}) };
}

/**
 * Makes an order and answers it with its checkout page (`url`), which the page sends the buyer to with openCheckout() from
 * buy.tsx. Its amounts are in the business's currency, which this names on the order from orderTerms(); where Foundable names
 * none yet it is refused as not taking payments. `save` is the website's own write of the order with its record, by its
 * number: its id, amount_total and test, since a paid order is fulfilled only when it is one the website made, at the total it
 * saved. Once the order can be paid, createOrder awaits it and answers only where it held, so nobody is sent to pay an order
 * the website holds no record of: a save that throws, answers a database error (supabase-js's `{ error }`) or answers the rows
 * it saved with none is refused `not_saved`, its buyer reading a plain sentence and the website's server log why, and the
 * order stays unpaid until the same key, pressed again, saves it. The same idempotencyKey with the same order answers the same
 * order, so a retry never makes two. A preview's order answers `test`: it holds nothing. A test order made at the website's
 * share link sends its buyer back to its success page, wherever they paid; one made in Build's preview goes back to Build.
 * `testSales`, which websites written for an earlier kit pass, changes nothing.
 * Where the page sent the signed-in shopper's session with its call (sessionHeaders() from buy.tsx), it goes with the order, so
 * the website's owner or an admin trying the live website in Test on live site makes a test order there, answering `test`.
 */
export async function createOrder(order: NewOrder, options: { idempotencyKey?: string; testSales?: "record-only";
  save?: (order: Order) => PromiseLike<unknown> } = {}): Promise<Order> {
  const made = await makeOrder(order, options.idempotencyKey);
  if (options.save && made.url) await saveOrder(made, options.save);
  return made;
}

/**
 * Runs the website's save of a made order (createOrder's `save`) and answers once it held. Where it threw, answered a database
 * error or answered the rows it saved with none, the website holds no record of the order, so this throws `not_saved`, its
 * reason in the website's server log, and nobody is sent to pay it.
 */
async function saveOrder(order: Order, save: (order: Order) => PromiseLike<unknown>): Promise<void> {
  let failure: unknown;
  try {
    const answer: unknown = await save(order);
    const { error, data } = typeof answer === "object" && answer !== null ? answer as { error?: unknown; data?: unknown } : {};
    if (!error && !(Array.isArray(data) && data.length === 0)) return;
    failure = error || new Error("It saved no row.");
  } catch (error) {
    failure = error;
  }
  const said = (failure as { message?: unknown } | null | undefined)?.message;
  const why = typeof said === "string" ? said : String(failure);
  console.error(`This website did not save its order ${order.id}, so nobody was sent to pay it: ${why}`);
  throw new OrderError(500, "not_saved", `The website did not save the order: ${why}`, { cause: failure });
}

/** The order made at Foundable, in the business's currency where an amount names none (createOrder's making). */
async function makeOrder(order: NewOrder, idempotencyKey: string | undefined): Promise<Order> {
  const session = shopperSession();
  const make = (body: NewOrder) => call("", { method: "POST", body, ...(idempotencyKey ? { idempotencyKey } : {}), session });
  const amounts = [...(order.line_items ?? []).map(line => line.price_data), ...(order.shipping_options ?? []).map(option => option.shipping_rate_data.fixed_amount)];
  if (amounts.every(amount => amount.currency !== undefined)) return make(order);
  const { currency } = await orderTerms();
  if (!currency) throw refused(409, "not_ready", "Foundable names no currency for this website's orders yet.");
  try {
    return await make(inCurrency(order, currency));
  } catch (error) {
    // The business may have changed its currency since Foundable's answer was kept: ask afresh, and where it has, make the order in it.
    if (!(error instanceof OrderError) || error.status !== 400) throw error;
    if (held) held.until = 0;
    const now = (await orderTerms()).currency;
    if (!now || now === currency) throw error;
    return make(inCurrency(order, now));
  }
}

/**
 * The sale as it stands now, an order's or a Buy's: paid, refunded or disputed, the buyer's email, where it ships and its
 * shipment. A preview's test sale reads here as one not paid yet, with no buyer's email: only orderEvents and orderReturn are
 * told it is paid, and they hand it to the website's test handler.
 */
export function readOrder(id: string): Promise<Order> {
  return call(`/${encodeURIComponent(id)}`, { method: "GET" });
}

/**
 * Ends an order nobody has paid, so the website can free what it held for it; a paid one answers as it stands, a preview's
 * paid test order as one not paid yet.
 */
export function expireOrder(id: string): Promise<Order> {
  return call(`/${encodeURIComponent(id)}/expire`, { method: "POST" });
}

/**
 * Marks one of the website's own paid orders shipped, or changes its carrier and tracking, as its seller's Mark shipped does in
 * Store: for a package the website's own code hears of (its maker's or carrier's word). Orders then shows the order shipped
 * with its tracking, and Foundable sends its word that the order changed. `carrier` is one of these, `"other"` with that
 * carrier's own https `trackingUrl`; an order not paid, a preview's test order, which touches no shipping step, or one refunded
 * in full is refused.
 */
export function shipOrder(id: string, shipment: { carrier: "usps" | "ups" | "fedex" | "dhl" | "canada_post" | "royal_mail" | "australia_post" | "other"; trackingNumber?: string; trackingUrl?: string }): Promise<Order> {
  return call(`/${encodeURIComponent(id)}/shipment`, { method: "POST",
    body: { carrier: shipment.carrier, trackingNumber: shipment.trackingNumber ?? null, trackingUrl: shipment.trackingUrl ?? null } });
}

/**
 * A preview's test sale as the website's own test handler takes it: the sale without its buyer's email. A test sale is
 * recorded, marked as a test, and delivers nothing; only the website's owner hears of it, by the email kit's owner recipient,
 * so the handler holds no buyer's address to write to.
 */
export type TestSale = Omit<Order, "customer_email">;

/** What a success page shows of its order (orderReturn's answer): never the whole sale, which only the website's handlers take. */
export type OrderStatus = Pick<Order, "id" | "status" | "test" | "client_reference_id" | "amount_total" | "currency" | "shipment">;

/** The kit's own read of a sale, with its record-only word, so a preview's test sale reads as it stands (Foundable's door). */
function readSale(id: string): Promise<Order> {
  return call(`/${encodeURIComponent(id)}`, { method: "GET", recordOnly: true });
}

/**
 * A sale handed to the website's own code: a live sale, and a site check's (`check`), to `onOrder`, the website's fulfilment; a
 * preview's other test sale to `onTestSale` without its buyer's email, never to `onOrder`, and with no `onTestSale` nowhere.
 */
async function handOver(order: Order, onOrder: (order: Order) => Promise<void>, onTestSale?: (sale: TestSale) => Promise<void>): Promise<void> {
  if (!order.test || order.check === true) return onOrder(order);
  const { customer_email: _buyer, ...sale } = order;
  if (onTestSale) await onTestSale(sale);
}

/**
 * The website's answer to the word that one of its sales changed: Foundable's, posted to /api/foundable/order-events on the website's own
 * address as an order is paid, starts settling, expires, is refunded, disputed or shipped, and the page's own on a Buy's return (the kit's
 * purchases.client.ts posts it there as the sale comes back paid). Its route, src/routes/api/foundable/order-events.ts, answers
 * POST with `async ({ request }) => (await import(<this module>)).orderEvents(request, onOrder, onTestSale)`. The word names the
 * sale and nothing else, so anyone could send one: the sale is read back from Foundable here and handed to `onOrder`, the
 * website's own, which fulfils a paid sale only once (the same sale may come again, and an order's success page hands it the
 * order it reads too) and an order only if it is one the website made, at the total it saved. A preview's test sale never
 * reaches `onOrder`: it goes to `onTestSale`, which records a paid one once, marked as a test, tells the owner alone and
 * touches nothing else, or, with none, nowhere. A 2xx answer tells Foundable it was taken, anything else has it sent again
 * for three days.
 */
export async function orderEvents(request: Request, onOrder: (order: Order) => Promise<void>, onTestSale?: (sale: TestSale) => Promise<void>): Promise<Response> {
  if (request.method !== "POST") return new Response(null, { status: 405, headers: { allow: "POST" } });
  const event = await request.json().catch(() => null) as { type?: unknown; related_object?: { id?: unknown; type?: unknown } } | null;
  const id = event?.related_object?.id;
  if (event?.type !== "order.updated" || event.related_object?.type !== "order" || typeof id !== "string") return new Response(null, { status: 400 });
  await handOver(await readSale(id), onOrder, onTestSale);
  return new Response(null, { status: 204 });
}

/**
 * The success page's read of its own order, by the id the website saved with the order number its address carries, handed to
 * the website's code as orderEvents hands a sale (a test sale to `onTestSale`, never to `onOrder`), since a buyer may come
 * back before Foundable's word and the word may never come. It answers what the page shows (`OrderStatus`), never the sale
 * itself, so the page says what its status says. Call it from a server function, never while a page renders.
 */
export async function orderReturn(id: string, onOrder: (order: Order) => Promise<void>, onTestSale?: (sale: TestSale) => Promise<void>): Promise<OrderStatus> {
  const order = await readSale(id);
  await handOver(order, onOrder, onTestSale);
  return { id: order.id, status: order.status, test: order.test, client_reference_id: order.client_reference_id,
    amount_total: order.amount_total, currency: order.currency, shipment: order.shipment };
}
