"use client";

// ─── Lightweight i18n — Hebrew (RTL, default) + English (LTR) ─────────────────
// Locale lives in localStorage (later: synced to the user's profile). The
// provider stamps <html lang dir> so the whole document flips direction.

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import he from "./locales/he.json";
import en from "./locales/en.json";

const DICTS = { he, en };
export const LOCALES = [
  { key: "he", label: "עברית",  dir: "rtl" },
  { key: "en", label: "English", dir: "ltr" },
];

const STORAGE_KEY = "walker_locale";
const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [locale, setLocaleState] = useState("he");

  // Adopt the stored preference after mount (SSR renders the Hebrew default).
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && DICTS[saved]) setLocaleState(saved);
  }, []);

  // Keep <html lang dir> in sync so layout, scrollbars and a11y all flip.
  useEffect(() => {
    const meta = LOCALES.find(l => l.key === locale);
    document.documentElement.lang = locale;
    document.documentElement.dir = meta.dir;
  }, [locale]);

  const setLocale = useCallback((key) => {
    if (!DICTS[key]) return;
    setLocaleState(key);
    try { localStorage.setItem(STORAGE_KEY, key); } catch {}
  }, []);

  const t = useCallback((key, vars) => {
    let str = DICTS[locale][key] ?? DICTS.he[key] ?? key;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        str = str.replaceAll(`{${k}}`, String(v));
      }
    }
    return str;
  }, [locale]);

  const dir = LOCALES.find(l => l.key === locale).dir;

  return (
    <I18nContext.Provider value={{ t, locale, dir, setLocale }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <I18nProvider>");
  return ctx;
}
