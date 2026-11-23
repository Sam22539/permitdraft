import { useRef, useState } from "react";
import { Image } from "../image";
import { useLang } from "../lib/lang";
import { removePhoto, savePhoto, setPhotoUnit, type PhotoView, type Slot, type Unit } from "../lib/photos";

export function PendingLabel({ p }: { p: PhotoView }) {
  const { t } = useLang();
  return <span className="ph-wait">{p.uploaded ? t("Uploaded", "Subida") : t("Saved on this device", "Guardada en este dispositivo")}</span>;
}

export function PhotoSlot({ slot, label, photo, takeLabel, tagUnit, job, onChanged }: { job?: string; onChanged?: () => void | Promise<void>; tagUnit?: boolean; slot: Slot; label: [string, string]; photo?: PhotoView; takeLabel?: [string, string] }) {
  const { t, lang } = useLang();
  const cam = useRef<HTMLInputElement>(null);
  const file = useRef<HTMLInputElement>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState(false);

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setBusy(true); setErr(""); setOk(false);
    try { await savePhoto(slot, f, job); await onChanged?.(); setOk(true); }
    catch (x) {
      const bad = x instanceof Error && x.message === "not-image";
      setErr(bad
        ? t("That file is not a readable image. Nothing was changed.", "Ese archivo no es una imagen legible. No se cambió nada.")
        : t("Could not save the photo on this device. " + (photo ? "Your previous photo is still saved." : "Try again."), "No se pudo guardar la foto en este dispositivo. " + (photo ? "Su foto anterior sigue guardada." : "Inténtelo de nuevo.")));
    }
    setBusy(false);
  }
  async function remove() {
    setErr(""); setOk(false);
    try { await removePhoto(slot, job); await onChanged?.(); } catch { setErr(t("Could not remove the photo. It is still saved.", "No se pudo quitar la foto. Sigue guardada.")); }
  }
  const lbl = t(...label);
  return (
    <div className="ph-slot" data-slot={slot}>
      {photo && (
        <div className="ph-thumb">
          <Image src={photo.url} alt={lbl} width={96} height={96} />
          <div>
            <PendingLabel p={photo} />
            <span className="ap-muted">{new Date(photo.savedAt).toLocaleString(lang === "es" ? "es" : "en-US")}</span>
          </div>
        </div>
      )}
      {tagUnit && photo && (
        <fieldset className="ph-unit" data-testid={`unit-${slot}`} style={{ display: "flex", gap: ".75rem", flexWrap: "wrap", alignItems: "center", border: 0, padding: 0, margin: ".5rem 0" }}>
          <legend className="font-semibold">{t("Which unit is this?", "¿De qué unidad es?")}</legend>
          {(["indoor", "outdoor"] as Unit[]).map((u) => (
            <label key={u} style={{ display: "inline-flex", gap: ".4rem", alignItems: "center", minHeight: 44 }}>
              <input type="radio" name={`unit-${slot}`} value={u} checked={photo.unit === u} data-testid={`unit-${slot}-${u}`}
                onChange={() => { setPhotoUnit(slot, u, job).then(() => onChanged?.()).catch(() => setErr(t("Could not save the unit tag.", "No se pudo guardar la etiqueta de unidad."))); }} />
              {u === "indoor" ? t("Indoor unit", "Unidad interior") : t("Outdoor unit", "Unidad exterior")}
            </label>
          ))}
        </fieldset>
      )}
      <input ref={cam} type="file" accept="image/*" capture="environment" className="sr-only" tabIndex={-1} aria-hidden data-testid={`cam-${slot}`} onChange={pick} />
      <input ref={file} type="file" accept="image/*" className="sr-only" tabIndex={-1} aria-hidden data-testid={`file-${slot}`} onChange={pick} />
      <div className="ap-two">
        <button type="button" className="ap-btn navy" disabled={busy} onClick={() => cam.current?.click()}>
          {photo ? t("Retake photo", "Volver a tomar") : t(...(takeLabel ?? ["Take photo", "Tomar foto"]))}
        </button>
        <button type="button" className="ap-btn ghost" disabled={busy} onClick={() => file.current?.click()}>{t("Choose file", "Elegir archivo")}</button>
      </div>
      {photo && <button type="button" className="ph-remove" onClick={remove}>{t("Remove photo", "Quitar foto")}</button>}
      {busy && <p role="status" className="ap-muted">{t("Saving…", "Guardando…")}</p>}
      {ok && !busy && <p role="status" className="font-semibold">{t("Photo saved on this device. Waiting to upload.", "Foto guardada en este dispositivo. Esperando para subir.")}</p>}
      {err && <p role="alert" className="ph-err">{err}</p>}
    </div>
  );
}
