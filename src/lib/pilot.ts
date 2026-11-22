import { createServerFn } from "@tanstack/react-start";

export const US_STATES = ["Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan","Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota","Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia","Wisconsin","Wyoming"] as const;

type Input = { company: string; contact: string; email: string; state: string; paperworkDelay?: string };

// Optional answer: trimmed, capped at 300 characters, blank saved as nothing.
export function cleanPaperworkDelay(v: unknown): string | null {
  const s = [...String(v ?? "").trim()].slice(0, 300).join("").trim();
  return s ? s : null;
}

export const joinPilot = createServerFn({ method: "POST" })
  .inputValidator((d: Input) => {
    const company = String(d?.company ?? "").trim();
    const contact = String(d?.contact ?? "").trim();
    const email = String(d?.email ?? "").trim();
    const state = String(d?.state ?? "");
    if (!company || [...company].length > 150) throw new Error("company");
    if (!contact || [...contact].length > 100) throw new Error("contact");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) throw new Error("email");
    if (!(US_STATES as readonly string[]).includes(state)) throw new Error("state");
    const paperworkDelay = cleanPaperworkDelay(d?.paperworkDelay);
    return { company, contact, email, state, paperworkDelay };
  })
  .handler(async ({ data }) => {
    const { serverBackend } = await import("./backend.server");
    const { error } = await serverBackend().from("pilot_signups").insert({
      company_name: data.company, contact_name: data.contact, email: data.email, county: "", state: data.state,
      paperwork_delay: data.paperworkDelay,
    });
    if (error) throw new Error("save");
    return { ok: true as const };
  });
