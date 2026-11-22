import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppTop } from "../components/app-shell";
import { Image } from "../image";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import "../permit.css";
import { usePhotos } from "../lib/photos";

export const Route = createFileRoute("/permit/hp-1187")({
  head: () => ({ meta: [{ title: "Heat-pump change-out permit draft" }, { name: "description", content: "Heat-pump change-out permit draft for Job #HP-1187 with every value traced to its source." }] }),
  component: Page,
});

type Field = {
  id: string;
  label: string;
  value: string;
  status: "Confirmed" | "NEEDED";
  source: string;
  evidence: string;
  conflict?: { value: string; source: string; note: string; origValue: string; origSource: string };
};

type Entry = {
  id: string;
  fieldId: string;
  action: "Flagged conflict" | "Confirmed value" | "Resolved conflict";
  priorValue: string;
  resultValue: string;
  proposedValue?: string;
  resultStatus: string;
  editor: string;
  at: string;
};

const EDITOR = "Practice reviewer (named practice role, not a verified identity)";

function fmt(iso: string) {
  return new Date(iso).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "medium" });
}

const SOURCES = ["Equipment photo", "Dictated note", "Meter reading", "Office entry"];

const initial: Field[] = [
  { id: "model", label: "Equipment model", value: "Carrier 25HPB536A003", status: "Confirmed", source: "Equipment photo", evidence: "Photo IMG_2041 (outdoor unit data plate), taken Nov 18, 2026 9:42 AM by Marcus Reyes. Label reads: “MODEL NO. 25HPB536A003”." },
  { id: "serial", label: "Serial number", value: "2819E04417", status: "Confirmed", source: "Equipment photo", evidence: "Photo IMG_2041 (outdoor unit data plate), taken Nov 18, 2026 9:42 AM by Marcus Reyes. Label reads: “SERIAL NO. 2819E04417”." },
  { id: "refrigerant", label: "Refrigerant type", value: "R-410A", status: "Confirmed", source: "Equipment photo", evidence: "Photo IMG_2042 (refrigerant line of the data plate), Nov 18, 2026 9:43 AM, Marcus Reyes. Label reads: “REFRIGERANT R-410A, FACTORY CHARGE 8 LB 4 OZ”." },
  { id: "location", label: "Outdoor unit location", value: "Left side yard, 36 in. from the property line", status: "Confirmed", source: "Dictated note", evidence: "Voice note 0:21, Nov 18, 2026 10:05 AM, Marcus Reyes: “New outdoor unit goes on the left side yard, same pad, about three feet off the fence.”" },
  { id: "panel", label: "Panel size", value: "", status: "NEEDED", source: "None yet", evidence: "No evidence on file. Ask the tech for a photo of the main panel label, or have the office enter the amperage." },
  { id: "duct", label: "Duct sealing answer", value: "", status: "NEEDED", source: "None yet", evidence: "No evidence on file. The tech has not dictated whether existing ducts were tested or sealed." },
  { id: "charge", label: "Refrigerant charge reading", value: "Subcooling 10.5°F, superheat 12°F", status: "Confirmed", source: "Meter reading", evidence: "Gauge reading logged Nov 18, 2026 1:17 PM by Marcus Reyes: subcooling 10.5°F, superheat 12°F, outdoor ambient 71°F." },
];

function Page() {
  const [fields, setFields] = useState<Field[]>(initial);
  const [selId, setSelId] = useState("model");
  const [value, setValue] = useState("");
  const [source, setSource] = useState(SOURCES[3]);
  const [note, setNote] = useState("");
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState("");
  const [flagOpen, setFlagOpen] = useState(false);
  const [cv, setCv] = useState("");
  const [cs, setCs] = useState(SOURCES[0]);
  const [cn, setCn] = useState("");
  const [cerr, setCerr] = useState("");
  const [history, setHistory] = useState<Entry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [pid, setPid] = useState("");
  const { photos } = usePhotos();

  useEffect(() => {
    try {
      let id = localStorage.getItem("pd-participant");
      if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem("pd-participant", id);
      }
      setPid(id);
      const raw = localStorage.getItem(`pd-hp1187:${id}`);
      if (raw) {
        const d = JSON.parse(raw);
        if (Array.isArray(d.fields)) setFields(d.fields);
        if (Array.isArray(d.history)) setHistory(d.history);
      }
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded || !pid) return;
    try {
      localStorage.setItem(`pd-hp1187:${pid}`, JSON.stringify({ fields, history }));
    } catch {}
  }, [fields, history, loaded, pid]);

  function log(e: Omit<Entry, "id" | "editor" | "at">) {
    const at = new Date().toISOString();
    setHistory((h) => [{ ...e, id: `${at}-${h.length}`, editor: EDITOR, at }, ...h]);
  }

  useEffect(() => {
    if (window.location.hash === "#panel-size") {
      setSelId("panel");
      document.getElementById("panel-size")?.scrollIntoView();
    }
  }, []);

  const sel = fields.find((f) => f.id === selId) ?? fields[0];
  const blockers = fields.filter((f) => f.status !== "Confirmed");
  const canReady = blockers.length === 0;

  function pick(id: string) {
    setSelId(id);
    setValue("");
    setNote("");
    setErr("");
    setFlagOpen(false);
    setCv("");
    setCn("");
    setCerr("");
  }

  function flag(e: React.FormEvent) {
    e.preventDefault();
    if (!cv.trim()) return setCerr("Enter the conflicting value.");
    if (!cs) return setCerr("Choose a source.");
    log({ fieldId: sel.id, action: "Flagged conflict", priorValue: sel.value, resultValue: sel.value, proposedValue: cv.trim(), resultStatus: "NEEDED (blocks Ready)" });
    setFields((fs) =>
      fs.map((f) =>
        f.id === sel.id
          ? { ...f, status: "NEEDED", conflict: { value: cv.trim(), source: cs, note: cn.trim(), origValue: f.value, origSource: f.source } }
          : f,
      ),
    );
    setReady(false);
    setFlagOpen(false);
    setCv("");
    setCn("");
    setCerr("");
  }

  function confirm(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim()) return setErr("Enter the value.");
    if (!source) return setErr("Choose a source.");
    log({ fieldId: sel.id, action: sel.conflict ? "Resolved conflict" : "Confirmed value", priorValue: sel.value, resultValue: value.trim(), proposedValue: sel.conflict?.value, resultStatus: "Confirmed" });
    const when = new Date().toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
    setFields((fs) =>
      fs.map((f) =>
        f.id === sel.id
          ? {
              ...f,
              value: value.trim(),
              status: "Confirmed",
              source,
              conflict: undefined,
              evidence: `${source} entered by the office reviewer, ${when}.${note.trim() ? ` Note: “${note.trim()}”` : ""}${f.conflict ? ` Resolved conflict. Original value: ${f.conflict.origValue} (${f.conflict.origSource}). Conflicting value: ${f.conflict.value} (${f.conflict.source}).${f.conflict.note ? ` Conflict note: “${f.conflict.note}”` : ""}` : ""}`,
            }
          : f,
      ),
    );
    setReady(false);
    setValue("");
    setNote("");
    setErr("");
  }

  const status = ready ? "Ready" : "Not ready";

  return (
    <div className="pd">
      <AppTop />
      <header className="pd-top">
        <Image src="/generated-assets/company-logo.png" alt="PermitDraft logo" width={44} height={44} priority />
        <div>
          <p className="pd-brand">PermitDraft</p>
          <p className="pd-practice">Practice job — not connected to real permit filing</p>
        </div>
      </header>

      <main className="pd-main">
        <section className="pd-head">
          <div>
            <h1>Heat-pump change-out permit draft</h1>
            <p className="pd-job">Single-family home, 4412 Alder Court, Sacramento · Job #HP-1187 · Tech: Marcus Reyes</p>
          </div>
          <div className={`pd-status ${ready ? "ok" : "no"}`} role="status">
            <span>Packet status</span>
            <strong>{status}</strong>
          </div>
        </section>

        <section className={`pd-block ${canReady ? "clear" : ""}`} aria-live="polite">
          <div>
            {canReady ? (
              <p><strong>Nothing is blocking.</strong> Every required field is Confirmed.</p>
            ) : (
              <p>
                <strong>Blocked by {blockers.length} required {blockers.length === 1 ? "field" : "fields"}:</strong>{" "}
                {blockers.map((b) => b.label).join(", ")}.
              </p>
            )}
          </div>
          <Button size="lg" className="pd-ready" disabled={!canReady || ready} onClick={() => setReady(true)}>
            {ready ? "Marked Ready" : "Mark Ready"}
          </Button>
        </section>

        <div className="pd-grid">
          <section aria-labelledby="fl">
            <h2 id="fl">Draft fields</h2>
            <ul className="pd-list">
              {fields.map((f) => (
                <li key={f.id} id={f.id === "panel" ? "panel-size" : undefined}>
                  <button type="button" className={`pd-row ${f.id === sel.id ? "on" : ""}`} aria-pressed={f.id === sel.id} onClick={() => pick(f.id)}>
                    <span className="pd-label">{f.label}</span>
                    <span className="pd-value">{f.value || "—"}</span>
                    <span className={`pd-badge ${f.status === "NEEDED" ? "needed" : "conf"}`}>{f.status}</span>
                    <span className="pd-src">Source: {f.source}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <aside className="pd-side">
            <div className="pd-card">
              <h2>Evidence</h2>
              <p className="pd-ev-label">{sel.label}</p>
              <p className="pd-ev-value">{sel.value || "No value yet"}</p>
              <p className="pd-ev-text">{sel.evidence}</p>
              <p className="pd-ev-src">Source: {sel.source}</p>
              {sel.source === "Equipment photo" && photos.plate && (
                <div className="ph-ev" data-testid="permit-plate">
                  <Image src={photos.plate.url} alt="Saved data plate photo" width={240} height={240} />
                  <p className="pd-ev-text">Photo saved on this device · Waiting to upload. Shown for reference only; it does not confirm any value.</p>
                </div>
              )}
              {sel.conflict && (
                <div className="pd-conflict" role="alert">
                  <p className="pd-ev-label">Conflict: resolve before Ready</p>
                  <p className="pd-ev-text">Original value: <strong>{sel.conflict.origValue || "No value yet"}</strong> (Source: {sel.conflict.origSource})</p>
                  <p className="pd-ev-text">Conflicting value: <strong>{sel.conflict.value}</strong> (Source: {sel.conflict.source})</p>
                  {sel.conflict.note && <p className="pd-ev-text">Conflict note: “{sel.conflict.note}”</p>}
                </div>
              )}
              {!sel.conflict && sel.value && !flagOpen && (
                <Button type="button" variant="outline" size="sm" onClick={() => setFlagOpen(true)}>Flag a conflict</Button>
              )}
            </div>

            <div className="pd-card" aria-labelledby="hist">
              <h2 id="hist">History: {sel.label}</h2>
              <p className="pd-ev-src">Newest first. Practice entries only, kept in this browser for this participant.</p>
              {history.filter((h) => h.fieldId === sel.id).length === 0 ? (
                <p className="pd-ev-text">No changes recorded for this field yet.</p>
              ) : (
                <ol className="pd-hist">
                  {history.filter((h) => h.fieldId === sel.id).map((h) => (
                    <li key={h.id}>
                      <p><strong>{h.action}</strong> · <time dateTime={h.at}>{fmt(h.at)}</time></p>
                      <p>Prior value: {h.priorValue || "No value yet"}</p>
                      {h.proposedValue !== undefined && <p className="pd-prop">Proposed conflicting value (not the actual value): {h.proposedValue}</p>}
                      <p>Resulting actual value: {h.resultValue || "No value yet"} · {h.resultStatus}</p>
                      <p className="pd-ev-src">Editor: {h.editor}</p>
                    </li>
                  ))}
                </ol>
              )}
            </div>

            {flagOpen && !sel.conflict && (
              <form className="pd-card" onSubmit={flag}>
                <h2>Flag a conflict on {sel.label.toLowerCase()}</h2>
                <Label htmlFor="cv">Conflicting value</Label>
                <Input id="cv" className="pd-in" value={cv} onChange={(e) => setCv(e.target.value)} />
                <Label htmlFor="cs">Source of conflicting value</Label>
                <select id="cs" className="pd-in pd-select" value={cs} onChange={(e) => setCs(e.target.value)}>
                  {SOURCES.map((s) => (<option key={s}>{s}</option>))}
                </select>
                <Label htmlFor="cn">Note</Label>
                <Textarea id="cn" value={cn} onChange={(e) => setCn(e.target.value)} placeholder="What does not match, and where you saw it" />
                {cerr && <p className="pd-err" role="alert">{cerr}</p>}
                <div className="pd-actions">
                  <Button type="submit" size="lg">Flag conflict</Button>
                  <Button type="button" variant="outline" size="lg" onClick={() => setFlagOpen(false)}>Cancel</Button>
                </div>
              </form>
            )}

            {sel.status === "NEEDED" ? (
              <form className="pd-card" onSubmit={confirm}>
                <h2>Confirm {sel.label.toLowerCase()}</h2>
                <Label htmlFor="v">Value</Label>
                <Input id="v" className="pd-in" value={value} onChange={(e) => setValue(e.target.value)} placeholder={sel.id === "panel" ? "e.g. 200 A" : "e.g. Tested and sealed, 6% leakage"} />
                <Label htmlFor="s">Source</Label>
                <select id="s" className="pd-in pd-select" value={source} onChange={(e) => setSource(e.target.value)}>
                  {SOURCES.map((s) => (<option key={s}>{s}</option>))}
                </select>
                <Label htmlFor="n">Evidence note (optional)</Label>
                <Textarea id="n" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Photo name, who said it, when" />
                {err && <p className="pd-err" role="alert">{err}</p>}
                <Button type="submit" size="lg">Confirm field</Button>
              </form>
            ) : (
              <div className="pd-card pd-done"><p>This field is Confirmed. Select a NEEDED field to enter its value and source.</p></div>
            )}
          </aside>
        </div>
      </main>

      <footer className="pd-foot">
        <p>Draft — not a guarantee of compliance. Contractor review and signature required.</p>
        <p>Practice screen with a sample job. Not connected to real permit filing.</p>
      </footer>
    </div>
  );
}
