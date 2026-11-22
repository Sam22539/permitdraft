import { createServerFn } from "@tanstack/react-start";

type Input = { company: string; contact: string; email: string; county: string };

export const joinPilot = createServerFn({ method: "POST" })
  .inputValidator((d: Input) => {
    const company = String(d?.company ?? "").trim();
    const contact = String(d?.contact ?? "").trim();
    const email = String(d?.email ?? "").trim();
    const county = String(d?.county ?? "");
    if (!company || [...company].length > 150) throw new Error("company");
    if (!contact || [...contact].length > 100) throw new Error("contact");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) throw new Error("email");
    if (county !== "Sacramento" && county !== "San Diego") throw new Error("county");
    return { company, contact, email, county };
  })
  .handler(async ({ data }) => {
    const { serverBackend } = await import("./backend.server");
    const { error } = await serverBackend().from("pilot_signups").insert({
      company_name: data.company, contact_name: data.contact, email: data.email, county: data.county,
    });
    if (error) throw new Error("save");
    return { ok: true as const };
  });
