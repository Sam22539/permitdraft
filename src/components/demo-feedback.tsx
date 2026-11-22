import { useEffect, useState } from "react";
import { backend } from "../lib/backend";
import { useLang } from "../lib/lang";
import { Textarea } from "./ui/textarea";

/** Optional one-question box shown in the demo right after capture, beside the review link. */
export function DemoFeedback() {
  const { t, lang } = useLang() as { t: (en: string, es: string) => string; lang?: string };
  const [text, setText] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "sent" | "error">("idle");
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const len = [...text.trim()].length;
  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (len < 1 || len > 1000) return;
    setState("busy");
    const { error } = await backend.from("demo_feedback").insert({ slowed_me_down: text.trim(), language: lang === "es" ? "es" : "en" });
    setState(error ? "error" : "sent");
  }
  if (state === "sent") return <p role="status" className="cx-note" data-testid="feedback-thanks">{t("Thank you. Your feedback was saved.", "Gracias. Se guardó su comentario.")}</p>;
  return (
    <form onSubmit={send} className="cx-field" data-testid="demo-feedback" style={{ display: "grid", gap: ".5rem" }}>
      <label htmlFor="demo-fb" className="font-semibold">{t("What, if anything, slowed you down while capturing this heat-pump job?", "¿Qué, si algo, lo retrasó al capturar este trabajo de bomba de calor?")}</label>
      <Textarea id="demo-fb" value={text} onChange={(e) => setText(e.target.value)} maxLength={1000} rows={3} data-testid="feedback-text" />
      {state === "error" && <p role="alert" className="cx-err" data-testid="feedback-error">{t("Could not save your feedback. Try again, or just continue.", "No se pudo guardar su comentario. Intente de nuevo o continúe.")}</p>}
      <button type="submit" className="ap-btn ghost" disabled={!ready || state === "busy" || len < 1} data-testid="feedback-send">{state === "busy" ? t("Sending…", "Enviando…") : t("Send feedback", "Enviar comentario")}</button>
    </form>
  );
}
