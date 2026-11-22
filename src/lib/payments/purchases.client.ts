// Foundable payments kit: who is signed in to buy, and what they bought, read in the browser. Foundable keeps this file and
// replaces it whole when the kit changes, so never edit it. A Buy press asks the page for the signed-in user's session, which
// this file answers, so the purchase reaches their account; what they bought is a row in the website's own database, which
// the database lets each signed-in user read for themselves alone. A page reads it through buy.tsx (useAccess, sessionHeaders),
// which reaches this file in the browser alone, since TanStack Start refuses a `.client` file the server's code reaches.
import type { SupabaseClient } from "@supabase/supabase-js";

/** The website's backend client as src/lib/backend.ts exports it; null where the website has none. */
function backend(): SupabaseClient | null {
  // Vite resolves this at build time; it is empty where src/lib/backend.ts does not exist.
  const modules: Record<string, unknown> = import.meta.env ? import.meta.glob("../backend.ts", { eager: true }) : {};
  for (const module of Object.values(modules))
    for (const value of Object.values(module as Record<string, unknown>)) {
      const client = value as { auth?: { getSession?: unknown }; from?: unknown } | null;
      if (client && typeof client === "object" && typeof client.auth?.getSession === "function" && typeof client.from === "function")
        return value as SupabaseClient;
    }
  return null;
}

/**
 * The signed-in user's access token as the website's backend answers it (refreshed first where it ran out): null for nobody
 * signed in, and undefined where the backend could not say, its session read answering an error or failing, as a refresh that
 * could not reach it does while the session stays kept.
 */
async function signedIn(client: SupabaseClient): Promise<string | null | undefined> {
  try {
    const { data, error } = await client.auth.getSession();
    return error ? undefined : data.session?.access_token ?? null;
  } catch {
    return undefined;
  }
}

/**
 * The signed-in user's access token, which a Buy carries for Foundable to check with the website's backend (refreshed first
 * where it ran out); null for nobody signed in, or where the website cannot ask.
 */
export async function sessionToken(): Promise<string | null> {
  const client = backend();
  return client ? (await signedIn(client)) ?? null : null;
}

/** Published pages have no preview bridge. In preview, protected reads wait for verification of this exact session. */
async function previewAccess(session: string | null): Promise<boolean> {
  if (typeof document === "undefined") return true;
  const detail: { session: string | null; ready: Promise<boolean> | null } = { session, ready: null };
  document.dispatchEvent(new CustomEvent("foundable:preview-session", { detail }));
  if (!detail.ready) return true;
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([detail.ready, new Promise<boolean>(resolve => {
      timeout = setTimeout(() => resolve(false), 50000);
    })]);
  } catch { return false; }
  finally { clearTimeout(timeout); }
}

/** Each session this page asked Foundable to give the website's guest purchases to, once a page load. */
const claims = new Map<string, Promise<boolean>>();

/**
 * Whether Foundable gave the signed-in user (`token`, their session) any guest purchase of this website now: one paid before
 * they signed in, with the email they signed in with, which Foundable's Buy script asks Payments for (`foundable:claim`) and
 * answers how many it gave. Asked once a page load for each session once answered; false where nothing answers (Build's
 * preview, or a Buy script not yet loaded, asked again later) or it fails.
 */
function claimGuestPurchases(token: string): Promise<boolean> {
  const held = claims.get(token);
  if (held) return held;
  if (typeof document === "undefined" || typeof CustomEvent !== "function") return Promise.resolve(false);
  const detail: { session: string; claimed: unknown } = { session: token, claimed: null };
  document.dispatchEvent(new CustomEvent("foundable:claim", { detail }));
  // Nothing answered (Build's preview, or a Buy script still loading): asked again on the next read.
  if (detail.claimed === null || detail.claimed === undefined) return Promise.resolve(false);
  const asked = (async () => {
    let timeout: ReturnType<typeof setTimeout> | undefined;
    try {
      const claimed = await Promise.race([Promise.resolve(detail.claimed), new Promise<number>(resolve => {
        timeout = setTimeout(() => resolve(0), 15000);
      })]);
      return typeof claimed === "number" && claimed > 0;
    } catch { return false; }
    finally { clearTimeout(timeout); }
  })();
  claims.set(token, asked);
  return asked;
}

/**
 * Whether the signed-in user holds paid access to a product now (`productHandle`, the sales plan's), read from the website's
 * purchases view as them: true or false as the website's backend answers, false for nobody signed in (a website with no
 * backend has nobody), and null, never false, where the read could not be made: the backend could not say who is signed in
 * (signedIn) or refused the session or the read, or a preview could not verify the session or it changed meanwhile, as the
 * server's readAccess (purchases.server.ts) answers.
 * A page says null is not known, never that the product was not bought, so a buyer whose read failed is never offered what
 * they bought. One who holds none is first given any purchase they paid for before signing in, with the email they signed in
 * with (`claimGuestPurchases`), and read again. It only decides what a page shows; what must be withheld is withheld by the
 * data's own policy.
 */
export async function hasAccess(productHandle: string): Promise<boolean | null> {
  // Foundable's checks read which products a page asks about here, so its gate counts however the page names the product.
  ((globalThis as unknown as Record<string, Set<string> | undefined>)["__foundableGates"] ??= new Set<string>()).add(productHandle);
  const client = backend();
  const token = client ? await signedIn(client) : null;
  if (token === undefined) return null;
  if (!client || !token) return false;
  if (!(await previewAccess(token)) || await sessionToken() !== token) return null;
  const read = async () => {
    const { data, error } = await client.from("foundable_access").select("product_handle").eq("product_handle", productHandle).limit(1);
    return error || !Array.isArray(data) ? null : data.length > 0;
  };
  const held = await read();
  return held === false && await claimGuestPurchases(token) ? read() : held;
}

/** Calls `listener` each time a Buy on this page comes back from its checkout, so the page reads its access again. */
export function onCheckout(listener: () => void): () => void {
  if (typeof document === "undefined") return () => {};
  document.addEventListener("foundable:checkout", listener);
  return () => { document.removeEventListener("foundable:checkout", listener); };
}

/** Calls `listener` with whether someone is signed in as it starts and each time that changes, as the website's backend says. */
export function watchSignIn(listener: (signedIn: boolean) => void): () => void {
  const client = backend();
  if (!client) {
    listener(false);
    return () => {};
  }
  const { data } = client.auth.onAuthStateChange((_event, session) => { listener(session !== null); });
  return () => { data.subscription.unsubscribe(); };
}

/** The header a page sends the website's own server the signed-in user's session in, which accessFor (purchases.server.ts) reads. */
export const sessionHeader = "x-foundable-session";

/** The headers a page sends its own server routes with, so their server code knows who asks; none for nobody signed in. */
export async function sessionHeaders(): Promise<Record<string, string>> {
  const token = await sessionToken();
  return token && await previewAccess(token) && await sessionToken() === token ? { [sessionHeader]: token } : {};
}

/** The sales this page has told the website's own route of, by id, so a return told twice (each read's answer) is posted once. */
const salesTold = new Set<string>();
/**
 * A Buy's return reaches the website's one fulfil: the Buy script (the website preview's bridge in its place) tells the document
 * each answer about the returned checkout, and a paid sale is posted once to the website's own route (/api/foundable/order-events,
 * orders.server.ts's orderEvents) in the word Foundable's own notice of an order carries, which reads the sale back from Foundable
 * and hands it to fulfil, a preview's test sale to the website's record-only handler instead. Sent as a beacon, so it outlives a
 * page that reloads or moves on at once (Build's preview reloads the page after a paid test Buy); a website without the route
 * answers 404, which nothing reads.
 */
function tellSale(event: Event): void {
  const detail = (event as CustomEvent<{ id?: unknown; status?: unknown } | null>).detail;
  if (!detail || typeof detail !== "object" || typeof detail.id !== "string" || detail.status !== "paid" || salesTold.has(detail.id)) return;
  salesTold.add(detail.id);
  const word = JSON.stringify({ type: "order.updated", related_object: { id: detail.id, type: "order" } });
  if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function"
    && navigator.sendBeacon("/api/foundable/order-events", new Blob([word], { type: "application/json" }))) return;
  void fetch("/api/foundable/order-events", { method: "POST", headers: { "content-type": "application/json" }, body: word, keepalive: true }).catch(() => {});
}

// A Buy press asks the page for its signed-in user's session on the pressed button (Foundable's Buy script, and the website
// preview's bridge in its place): answered with a promise of the access token, which the press waits a moment for.
if (typeof document !== "undefined") {
  document.addEventListener("foundable:session", event => {
    const detail = (event as CustomEvent<{ session?: unknown } | null>).detail;
    if (detail && typeof detail === "object") detail.session = sessionToken();
  });
  document.addEventListener("foundable:checkout", tellSale);
  // Never await Auth or call getSession inside this callback: Supabase emits it while holding its session lock.
  backend()?.auth.onAuthStateChange((_event, session) => { void previewAccess(session?.access_token ?? null); });
}
