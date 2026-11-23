import { useLang } from "../lib/lang";

export type Jump = { id: string; label: [string, string] };

/** Compact "On this page" jump links to a page's major sections. */
export function PageJumps({ items }: { items: Jump[] }) {
  const { t } = useLang();
  return (
    <nav className="pj" aria-label={t("On this page", "En esta página")} data-testid="page-jumps">
      <span className="pj-label">{t("On this page", "En esta página")}</span>
      <ul className="pj-list">
        {items.map((j) => (
          <li key={j.id}>
            <a href={`#${j.id}`} className="pj-link" onClick={(e) => {
              const el = document.getElementById(j.id);
              if (!el) return;
              e.preventDefault();
              el.scrollIntoView({ block: "start" });
              history.replaceState(null, "", `#${j.id}`);
              const h = el.querySelector<HTMLElement>("h2");
              if (h) { h.tabIndex = -1; h.focus({ preventScroll: true }); }
            }}>{t(...j.label)}</a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
