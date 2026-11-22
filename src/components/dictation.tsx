import { useEffect, useRef, useState } from "react";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { useLang } from "../lib/lang";

type Rec = {
  lang: string; continuous: boolean; interimResults: boolean;
  start: () => void; stop: () => void; abort: () => void;
  onresult: ((e: any) => void) | null; onerror: ((e: any) => void) | null; onend: (() => void) | null;
};

/** Dictation into a staged box; nothing touches the notes until "Save to notes" (appends). No audio is kept. */
export function Dictation({ notes, onSave }: { notes: string; onSave: (next: string) => void }) {
  const { lang, t } = useLang();
  const [open, setOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [staged, setStaged] = useState("");
  const [err, setErr] = useState("");
  const rec = useRef<Rec | null>(null);
  const base = useRef("");

  const Ctor = () => (typeof window === "undefined" ? undefined : (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  useEffect(() => () => { try { rec.current?.abort(); } catch { /* ignore */ } }, []);

  const start = () => {
    const C = Ctor();
    setOpen(true);
    if (!C) { setErr(t("Dictation isn't available in this browser. Type your notes instead; nothing is lost.", "El dictado no está disponible en este navegador. Escriba sus notas; no se pierde nada.")); return; }
    setErr("");
    base.current = staged;
    const r: Rec = new C();
    r.lang = lang === "es" ? "es-US" : "en-US";
    r.continuous = true; r.interimResults = true;
    r.onresult = (e: any) => {
      let text = "";
      for (let i = 0; i < e.results.length; i++) text += e.results[i][0].transcript;
      setStaged((base.current ? base.current.replace(/\s+$/, "") + " " : "") + text.trim());
    };
    r.onerror = (e: any) => {
      const k = e?.error;
      if (k === "not-allowed" || k === "service-not-allowed") setErr(t("Microphone permission was blocked. Allow it in the browser, or type your notes.", "Se bloqueó el permiso del micrófono. Permítalo en el navegador o escriba sus notas."));
      else if (k === "network") setErr(t("Dictation needs a connection and none was found. Type your notes; they are safe.", "El dictado necesita conexión y no se encontró. Escriba sus notas; están a salvo."));
      else if (k === "no-speech") setErr(t("No speech heard. Try again.", "No se oyó nada. Intente de nuevo."));
      else if (k !== "aborted") setErr(t("Dictation stopped unexpectedly. Type your notes instead.", "El dictado se detuvo. Escriba sus notas."));
      setListening(false);
    };
    r.onend = () => setListening(false);
    rec.current = r;
    try { r.start(); setListening(true); } catch { setErr(t("Could not start the microphone.", "No se pudo iniciar el micrófono.")); }
  };
  const stop = () => { try { rec.current?.stop(); } catch { /* ignore */ } setListening(false); };
  const close = () => { try { rec.current?.abort(); } catch { /* ignore */ } setListening(false); setStaged(""); setErr(""); setOpen(false); };
  const save = () => {
    try { rec.current?.abort(); } catch { /* ignore */ }
    const add = staged.trim();
    if (add) onSave(notes.trim() ? notes.replace(/\s+$/, "") + "\n" + add : add);
    setListening(false); setStaged(""); setErr(""); setOpen(false);
  };

  return (
    <div className="ap-field">
      <button type="button" className="ap-btn ghost w-full min-h-16 text-xl" aria-pressed={listening} onClick={listening ? stop : start}>
        {listening ? t("■ Stop dictation", "■ Detener dictado") : t("🎤 Start dictation", "🎤 Iniciar dictado")}
      </button>
      {open && (
        <div className="ap-field">
          <Label htmlFor="dictated">{t("Dictated text (edit before saving)", "Texto dictado (edite antes de guardar)")}</Label>
          <Textarea id="dictated" rows={4} className="text-lg bg-white" value={staged} onChange={(e) => setStaged(e.target.value)} />
          {listening && <p role="status" className="font-semibold">{t("Listening… speak now.", "Escuchando… hable ahora.")}</p>}
          {err && <p role="alert" className="font-semibold">{err}</p>}
          <div className="flex flex-wrap gap-3">
            <button type="button" className="ap-btn min-h-14" onClick={save} disabled={!staged.trim()}>{t("Save to notes", "Guardar en las notas")}</button>
            <button type="button" className="ap-btn ghost min-h-14" onClick={close}>{t("Cancel", "Cancelar")}</button>
          </div>
        </div>
      )}
    </div>
  );
}
