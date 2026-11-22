// Offline shell: public app pages and static assets only. Never caches server functions or non-200 / no-store responses.
const CACHE = "pd-shell-v1";
const ROUTES = ["/", "/jobs", "/jobs/hp-1187", "/new", "/new/work", "/new/equipment", "/new/checks", "/new/photos", "/permit/hp-1187"];
const okToCache = (res) => res && res.status === 200 && res.type === "basic" && !/no-store|private/i.test(res.headers.get("cache-control") || "");

async function precache() {
  const c = await caches.open(CACHE);
  const assets = new Set();
  await Promise.all(ROUTES.map(async (r) => {
    try {
      const res = await fetch(r, { credentials: "omit" });
      if (!okToCache(res)) return;
      const html = await res.clone().text();
      await c.put(r, res);
      for (const m of html.matchAll(/(?:href|src)="(\/(?:assets|generated-assets)\/[^"]+)"/g)) assets.add(m[1]);
    } catch {}
  }));
  await Promise.all([...assets].map(async (a) => {
    try { if (!(await c.match(a))) { const res = await fetch(a, { credentials: "omit" }); if (okToCache(res)) await c.put(a, res); } } catch {}
  }));
}

self.addEventListener("install", (e) => { self.skipWaiting(); });
self.addEventListener("activate", (e) => e.waitUntil(
  caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener("message", (e) => { if (e.data === "precache") e.waitUntil(precache()); });

self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin || url.pathname.startsWith("/_serverFn") || url.pathname.startsWith("/api")) return;
  const nav = req.mode === "navigate";
  const asset = /^\/(assets|generated-assets)\//.test(url.pathname);
  if (!nav && !asset) return;
  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    if (asset) {
      const hit = await c.match(req);
      if (hit) return hit;
      const res = await fetch(req);
      if (okToCache(res)) c.put(req, res.clone());
      return res;
    }
    try {
      const res = await fetch(req);
      if (okToCache(res) && ROUTES.includes(url.pathname)) c.put(url.pathname, res.clone());
      return res;
    } catch {
      return (await c.match(url.pathname)) || (await c.match("/")) || Response.error();
    }
  })());
});
