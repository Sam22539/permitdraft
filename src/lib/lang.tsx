import { createContext, useContext, useState, type ReactNode } from "react";

export type Lang = "en" | "es";
const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({ lang: "en", setLang: () => {} });

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");
  return <Ctx.Provider value={{ lang, setLang }}>{children}</Ctx.Provider>;
}

export function useLang() {
  const { lang, setLang } = useContext(Ctx);
  // t(english, spanish): the screen's words in the chosen language.
  const t = (en: string, es?: string) => (lang === "es" && es ? es : en);
  return { lang, setLang, t };
}
