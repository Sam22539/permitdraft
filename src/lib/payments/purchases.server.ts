// Foundable payments kit: what the person asking the website's own server bought, read in its server code. Foundable keeps this
// file and replaces it whole when the kit changes, so never edit it.
import { createClient } from "@supabase/supabase-js";

/**
 * The header a page sends the signed-in user's session in (sessionHeaders, from buy.tsx), as purchases.client.ts names it: held
 * here too, since TanStack Start refuses a `.client` file the server's code reaches. The website's own server code reads the
 * session from it too, checking it with its backend before it reads what that person's own orders gave them.
 */
export const sessionHeader = "x-foundable-session";

/** A client that keeps no session of its own: each request names its person. */
const sessionless = { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } as const;

/**
 * The website's backend, its address and publishable key: as Foundable sets them for the published website and its live
 * preview, else as src/lib/backend.ts, the client the website's code makes from the same two values, holds them.
 */
function backend(): { url: string; key: string } | null {
  const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (url && key) return { url, key };
  // Vite resolves this at build time; it is empty where src/lib/backend.ts does not exist.
  const modules: Record<string, unknown> = import.meta.env ? import.meta.glob("../backend.ts", { eager: true }) : {};
  for (const module of Object.values(modules))
    for (const value of Object.values(module as Record<string, unknown>)) {
      const client = value as { supabaseUrl?: unknown; supabaseKey?: unknown } | null;
      if (client && typeof client.supabaseUrl === "string" && typeof client.supabaseKey === "string") return { url: client.supabaseUrl, key: client.supabaseKey };
    }
  return null;
}

/**
 * Whether the person who sent `request` holds paid access to a product now (`productHandle`, the sales plan's): their session,
 * which the page sends with sessionHeaders() from buy.tsx, is checked by the website's backend as it reads the
 * purchases view as them. False for anyone not signed in, a session the backend refuses, or where the website cannot ask.
 */
export async function accessFor(request: Request, productHandle: string): Promise<boolean> {
  return (await readAccess(request, productHandle)) === true;
}

/**
 * Whether the person who sent `request` holds paid access to a product now, read as accessFor reads it, but with a read that
 * could not be made told apart: true or false as the website's backend answers (false for anyone not signed in), null where
 * the website cannot ask, or its backend refused the session or the read. A page says null is not known yet, never that the
 * product was not bought, and anything only buyers may have stays withheld from it.
 */
export async function readAccess(request: Request, productHandle: string): Promise<boolean | null> {
  const token = request.headers.get(sessionHeader);
  if (!token) return false;
  const address = backend();
  if (!address) return null;
  const client = createClient(address.url, address.key, { auth: sessionless, global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data, error } = await client.from("foundable_access").select("product_handle").eq("product_handle", productHandle).limit(1);
  return error || !Array.isArray(data) ? null : data.length > 0;
}
