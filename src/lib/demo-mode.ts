// The free demo lives under /demo. Everything it saves in this browser uses its own keys (and its own photo database),
// so practice work never mixes with a real workspace. Decided by the page's own address, so every store agrees.
export function isDemoPath(path: string) { return path === "/demo" || path.startsWith("/demo/"); }
export function isDemo() { return typeof window !== "undefined" && isDemoPath(window.location.pathname); }
export const DEMO_KEY_PREFIX = "pd-demo:";
/** The storage key for this mode: the real key, or the demo's own copy of it. */
export function nsKey(key: string) { return isDemo() ? DEMO_KEY_PREFIX + key : key; }

/** The demo's address for a Core screen's address. */
export function toDemoPath(path: string): string {
  if (path === "/jobs" || path === "/jobs/") return "/demo";
  if (path === "/jobs/sample-job") return "/demo/job";
  if (path === "/permit/draft/$id") return "/demo/draft/$id";
  if (path === "/office-handoff") return "/demo/office-handoff";
  if (path === "/settings") return "/demo/settings";
  if (path === "/sync") return "/demo/sync";
  if (path === "/new" || path.startsWith("/new/")) return "/demo" + path;
  return path;
}
