import { useEffect, useId, useRef, useState } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { useLang } from "../lib/lang";

/** Copies one NEEDED field's follow-up request as plain text, for the office to paste by hand. Nothing is sent. */
export function CopyRequest({ text, field, testId }: { text: [string, string]; field: string; testId: string }) {
  const { t, lang } = useLang();
  const msg = lang === "es" ? text[1] : text[0];
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const box = useRef<HTMLTextAreaElement>(null);
  const boxId = useId();

  useEffect(() => setState("idle"), [msg]);
  useEffect(() => { if (state === "failed") { box.current?.focus(); box.current?.select(); } }, [state]);

  async function copy() {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("no clipboard");
      await navigator.clipboard.writeText(msg);
      setState("copied");
    } catch {
      setState("failed");
    }
  }

  return (
    <div className="cr-wrap" data-testid={testId}>
      <Button type="button" variant="outline" size="sm" className="cr-btn" onClick={copy} aria-label={t(`Copy request for ${field}`, `Copiar solicitud para ${field}`)} data-copy-text={msg}>
        {t("Copy request", "Copiar solicitud")}
      </Button>
      <p role="status" aria-live="polite" className="cr-status">
        {state === "copied" ? t("Copied. Paste it into your own message; nothing is sent from here.", "Copiado. Péguelo en su propio mensaje; no se envía nada desde aquí.") : ""}
      </p>
      {state === "failed" && (
        <div className="cr-fallback">
          <label htmlFor={boxId} className="cr-status">{t("Could not copy automatically. Select this text and copy it:", "No se pudo copiar automáticamente. Seleccione este texto y cópielo:")}</label>
          <Textarea id={boxId} ref={box} readOnly value={msg} rows={4} onFocus={(e) => e.currentTarget.select()} data-testid={`${testId}-text`} />
        </div>
      )}
    </div>
  );
}
