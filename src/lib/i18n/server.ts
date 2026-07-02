import "server-only";
import { cookies, headers } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from "./locales";

/** Determina el locale inicial: cookie de preferencia > Accept-Language > por defecto. */
export async function getInitialLocale(): Promise<Locale> {
  const c = await cookies();
  const fromCookie = c.get(LOCALE_COOKIE)?.value;
  if (isLocale(fromCookie)) return fromCookie;

  const h = await headers();
  const accept = h.get("accept-language") ?? "";
  const first = accept.split(",")[0]?.split("-")[0]?.trim().toLowerCase();
  if (isLocale(first)) return first;

  return DEFAULT_LOCALE;
}
