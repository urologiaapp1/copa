"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { DICTIONARIES } from "./dictionary";
import { DEFAULT_LOCALE, LOCALE_COOKIE, type Locale } from "./locales";

type Vars = Record<string, string | number>;

interface I18nContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, vars?: Vars) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function interpolate(template: string, vars?: Vars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (m, key) => (key in vars ? String(vars[key]) : m));
}

export function LocaleProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: React.ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    document.cookie = `${LOCALE_COOKIE}=${l}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
  }, []);

  const t = useCallback(
    (key: string, vars?: Vars) => {
      const dict = DICTIONARIES[locale] ?? DICTIONARIES[DEFAULT_LOCALE];
      const raw = dict[key] ?? DICTIONARIES[DEFAULT_LOCALE][key] ?? key;
      return interpolate(raw, vars);
    },
    [locale],
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n debe usarse dentro de LocaleProvider");
  return ctx;
}
