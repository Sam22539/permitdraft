import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppPage } from "../components/app-shell";
import { SignInForm, useSessionEmail } from "../components/core-offer";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { backend } from "../lib/backend";
import { getOwnerDashboard, type OwnerCompany } from "../lib/owner";

export const Route = createFileRoute("/owner")({
  head: () => ({ meta: [{ title: "Owner dashboard — PermitDraft" }, { name: "description", content: "Private, read-only overview of the company accounts on PermitDraft, for the platform owner." }, { name: "robots", content: "noindex" }] }),
  component: OwnerPage,
});

const INBOX = { verified: "Office inbox verified", pending: "Inbox verification pending", none: "Office inbox not set up" } as const;

function OwnerPage() {
  const email = useSessionEmail();
  const [state, setState] = useState<"loading" | "denied" | "error" | OwnerCompany[]>("loading");
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!email) return;
    let live = true;
    setState("loading");
    backend.auth.getSession()
      .then(({ data }) => {
        const t = data.session?.access_token;
        if (!t) throw new Error("auth");
        return getOwnerDashboard({ data: { token: t } });
      })
      .then((r) => { if (live) setState(r.ok ? r.companies : "denied"); }, () => { if (live) setState("error"); });
    return () => { live = false; };
  }, [email]);

  const list = Array.isArray(state) ? state : [];
  const shown = useMemo(() => list.filter((c) => c.name.toLowerCase().includes(q.trim().toLowerCase())), [list, q]);
  const members = list.reduce((s, c) => s + c.members, 0);

  return (
    <AppPage bottom>
      <h1 className="text-3xl">Owner dashboard</h1>
      <p className="ap-muted">A read-only list of the company accounts on PermitDraft. It shows company names, setup status and member counts only; no passwords, payment details, homeowner data, photos or job records.</p>

      {email === null && (
        <section className="ap-card" aria-labelledby="ow-sign">
          <h2 id="ow-sign" className="ap-h2">Sign in</h2>
          <p className="ap-muted">Sign in with the platform owner's address to continue.</p>
          <SignInForm />
        </section>
      )}
      {email && state === "loading" && <p className="ap-muted" role="status">Loading…</p>}
      {email && state === "denied" && (
        <section className="ap-card" data-testid="ow-denied"><h2 className="ap-h2">Not available</h2><p className="ap-muted">This area is for the PermitDraft platform owner only. Company admins and members keep using their own company pages.</p></section>
      )}
      {email && state === "error" && <p role="alert" className="cx-err">Could not load the dashboard. Reload to try again.</p>}

      {Array.isArray(state) && (
        <section className="ap-card" aria-labelledby="ow-list" data-testid="ow-dashboard">
          <h2 id="ow-list" className="ap-h2">Company accounts</h2>
          <p className="ap-muted" data-testid="ow-totals">{list.length} {list.length === 1 ? "company" : "companies"} · {members} {members === 1 ? "member" : "members"} in total</p>
          <div className="ap-field"><Label htmlFor="ow-search">Search company names</Label>
            <Input id="ow-search" type="search" value={q} onChange={(e) => setQ(e.target.value)} maxLength={120} data-testid="ow-search" /></div>
          {shown.length === 0 ? <p className="ap-muted" data-testid="ow-empty">No companies match.</p> : (
            <ul className="grid gap-2">
              {shown.map((c) => (
                <li key={c.id} className="flex flex-wrap items-center justify-between gap-2" data-testid="ow-company">
                  <span className="font-semibold">{c.name}</span>
                  <span className="ap-muted">{INBOX[c.inbox]} · {c.members} {c.members === 1 ? "member" : "members"} ({c.admins} {c.admins === 1 ? "admin" : "admins"}) · since {new Date(c.createdAt).toLocaleDateString("en-US", { timeZone: "UTC" })}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </AppPage>
  );
}
