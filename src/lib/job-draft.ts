import { useState } from "react";

// In-page practice draft shared by the capture steps (lives until the page is reloaded).
const store: Record<string, string> = {
  type: "Heat pump change-out", maker: "", model: "", serial: "", refrig: "", loc: "",
  work: "Heat-pump change-out, same pad, left side yard", panel: "", duct: "", ductReason: "",
  c1: "", c2: "", c3: "", c4: "", sub: "", sup: "", p1: "", p2: "", p3: "", plate: "",
};

export function useDraft() {
  const [, bump] = useState(0);
  return {
    get: (k: string) => store[k] ?? "",
    set: (k: string, v: string) => { store[k] = v; bump((n) => n + 1); },
  };
}
