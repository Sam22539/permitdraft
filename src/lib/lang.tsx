import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "es";
const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({ lang: "en", setLang: () => {} });

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  const KEY = "pd-lang";
  useEffect(() => {
    const read = () => {
      try { const v = localStorage.getItem(KEY); if (v === "en" || v === "es") setLangState(v); } catch { /* blocked */ }
    };
    read();
    const on = (e: StorageEvent) => { if (e.key === KEY) read(); };
    window.addEventListener("storage", on);
    return () => window.removeEventListener("storage", on);
  }, []);
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);
  const setLang = (l: Lang) => {
    setLangState(l);
    try { localStorage.setItem(KEY, l); } catch { /* keep in memory */ }
  };
  return <Ctx.Provider value={{ lang, setLang }}>{children}</Ctx.Provider>;
}

export function useLang() {
  const { lang, setLang } = useContext(Ctx);
  // t(english, spanish): the screen's words in the chosen language.
  const t = (en: string, es?: string) => (lang === "es" && es ? es : en);
  return { lang, setLang, t };
}
