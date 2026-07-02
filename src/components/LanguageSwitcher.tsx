"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { LOCALES, LOCALE_META } from "@/lib/i18n/locales";
import { cn } from "@/lib/utils";

/** Selector de idioma compacto (banderita + código), con menú desplegable. */
export function LanguageSwitcher({ dark = false }: { dark?: boolean }) {
  const { locale, setLocale } = useI18n();
  const [open, setOpen] = useState(false);
  const meta = LOCALE_META[locale];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
          dark
            ? "border-white/15 text-marfil/70 hover:bg-white/10"
            : "border-[var(--border)] text-negro/70 hover:bg-black/5",
        )}
        aria-label="Cambiar idioma"
      >
        <span>{meta.flag}</span>
        <span className="uppercase">{locale}</span>
      </button>
      {open && (
        <>
          <button
            aria-hidden
            tabIndex={-1}
            className="fixed inset-0 z-10 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div
            className={cn(
              "absolute right-0 z-20 mt-1 w-40 overflow-hidden rounded-xl border shadow-lg",
              dark ? "border-white/10 bg-[#1c1210]" : "border-[var(--border)] bg-white",
            )}
          >
            {LOCALES.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => {
                  setLocale(l);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors",
                  dark ? "hover:bg-white/10" : "hover:bg-black/5",
                  l === locale && (dark ? "bg-white/10" : "bg-black/5"),
                  dark ? "text-marfil" : "text-negro",
                )}
              >
                <span>{LOCALE_META[l].flag}</span>
                <span>{LOCALE_META[l].name}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
