import { useEffect, useId, useRef, useState } from "react";
import { Input } from "./ui/input";
import { useLang } from "../lib/lang";

// Sacramento County GIS "Address" points (CC0 public domain), queried straight from the browser.
const SOURCE = "https://services1.arcgis.com/5NARefyPVtAeuJPU/arcgis/rest/services/Address/FeatureServer/0/query";
export type AddressPick = { street: string; city: string };

const title = (s: string) => s.toLowerCase().replace(/\b([a-z])/g, (m) => m.toUpperCase());

export function AddressLookup({ id, value, onText, onPick }: { id: string; value: string; onText: (v: string) => void; onPick: (a: AddressPick) => void }) {
  const { t } = useLang();
  const uid = useId();
  const listId = `${uid}-list`;
  const [items, setItems] = useState<AddressPick[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [status, setStatus] = useState<"idle" | "loading" | "none" | "error">("idle");
  const typed = useRef(false);

  useEffect(() => {
    if (!typed.current) return;
    const q = value.trim().replace(/\s+/g, " ").toUpperCase();
    if (q.length < 4) { setItems([]); setOpen(false); setStatus("idle"); return; }
    const ctl = new AbortController();
    const timer = setTimeout(async () => {
      setStatus("loading");
      try {
        const safe = q.replace(/'/g, "''").replace(/[%_\\]/g, "");
        const params = new URLSearchParams({
          where: `UPPER(Address_Line_1) LIKE '${safe}%'`,
          outFields: "Address_Line_1,Postal_City",
          returnGeometry: "false",
          orderByFields: "Address_Line_1",
          resultRecordCount: "6",
          f: "json",
        });
        const res = await fetch(`${SOURCE}?${params}`, { signal: ctl.signal, referrerPolicy: "no-referrer", credentials: "omit" });
        const json = await res.json();
        if (!Array.isArray(json.features)) throw new Error("bad");
        const seen = new Set<string>();
        const list: AddressPick[] = [];
        for (const f of json.features) {
          const street = String(f.attributes.Address_Line_1 ?? "").trim();
          const city = title(String(f.attributes.Postal_City ?? "").trim());
          const k = `${street}|${city}`;
          if (street && !seen.has(k)) { seen.add(k); list.push({ street: title(street).replace(/\bPo\b/, "PO"), city }); }
        }
        setItems(list); setActive(-1); setOpen(list.length > 0); setStatus(list.length ? "idle" : "none");
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        setItems([]); setOpen(false); setStatus("error");
      }
    }, 300);
    return () => { clearTimeout(timer); ctl.abort(); };
  }, [value]);

  function pick(a: AddressPick) {
    typed.current = false;
    onPick(a); setOpen(false); setItems([]); setStatus("idle"); setActive(-1);
  }
  function key(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown" && items.length) { e.preventDefault(); setOpen(true); setActive((i) => (i + 1) % items.length); }
    else if (e.key === "ArrowUp" && open) { e.preventDefault(); setActive((i) => (i <= 0 ? items.length - 1 : i - 1)); }
    else if (e.key === "Enter" && open && active >= 0) { e.preventDefault(); pick(items[active]); }
    else if (e.key === "Escape" && open) { e.preventDefault(); setOpen(false); }
  }
  const msg =
    status === "loading" ? t("Searching Sacramento addresses…", "Buscando direcciones de Sacramento…")
    : status === "none" ? t("No matching Sacramento address. Keep typing, or enter it yourself.", "Sin direcciones de Sacramento coincidentes. Siga escribiendo o escríbala usted.")
    : status === "error" ? t("Address search is unavailable. Type the address yourself.", "La búsqueda no está disponible. Escriba la dirección usted.")
    : open ? t(`${items.length} suggestions. Use arrow keys and Enter, or tap one.`, `${items.length} sugerencias. Use las flechas y Enter, o toque una.`) : "";

  return (
    <div className="relative">
      <Input
        id={id} value={value} autoComplete="off" role="combobox" aria-autocomplete="list" aria-expanded={open}
        aria-controls={listId} aria-activedescendant={active >= 0 ? `${uid}-o${active}` : undefined}
        onChange={(e) => { typed.current = true; onText(e.target.value); }}
        onKeyDown={key}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onFocus={() => items.length && setOpen(true)}
      />
      <ul id={listId} role="listbox" aria-label={t("Address suggestions", "Sugerencias de dirección")} hidden={!open}
        className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md">
        {items.map((a, i) => (
          <li key={`${a.street}${a.city}${i}`} id={`${uid}-o${i}`} role="option" aria-selected={i === active}
            className={`min-h-11 cursor-pointer px-3 py-2 text-sm ${i === active ? "bg-accent text-accent-foreground" : ""}`}
            onMouseDown={(e) => e.preventDefault()} onClick={() => pick(a)}>
            {a.street}, {a.city}
          </li>
        ))}
      </ul>
      <p className="cx-note" role="status" aria-live="polite">{msg}</p>
    </div>
  );
}
