export const LOCALES = ["es", "en", "pt", "fr", "it"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "es";

export const LOCALE_META: Record<Locale, { flag: string; name: string }> = {
  es: { flag: "🇨🇱", name: "Español" },
  en: { flag: "🇬🇧", name: "English" },
  pt: { flag: "🇧🇷", name: "Português" },
  fr: { flag: "🇫🇷", name: "Français" },
  it: { flag: "🇮🇹", name: "Italiano" },
};

export function isLocale(v: string | undefined | null): v is Locale {
  return !!v && (LOCALES as readonly string[]).includes(v);
}

export const LOCALE_COOKIE = "cc_locale";
