import { useEffect } from "react";
import { backend } from "../lib/backend";
import { useLang } from "../lib/lang";

/** Applies the language saved on a signed-in person's profile where this browser has none chosen yet. */
export function LangSync() {
  const { setLang } = useLang();
  useEffect(() => {
    const apply = async (uid?: string) => {
      if (!uid) return;
      try { if (localStorage.getItem("pd-lang")) return; } catch { return; }
      const { data } = await backend.from("profiles").select("language").eq("user_id", uid).maybeSingle();
      if (data?.language === "en" || data?.language === "es") setLang(data.language);
    };
    backend.auth.getSession().then(({ data }) => apply(data.session?.user.id)).catch(() => undefined);
    const { data } = backend.auth.onAuthStateChange((_e, s) => { void apply(s?.user.id); });
    return () => data.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
