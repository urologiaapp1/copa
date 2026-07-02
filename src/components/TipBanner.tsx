"use client";

import { useEffect, useState } from "react";
import { randomTip } from "@/lib/tips";
import { useI18n } from "@/lib/i18n/context";

/** Frase rotativa con humor, para acompañar mientras se evalúa o se espera. */
export function TipBanner({ intervalMs = 9000 }: { intervalMs?: number }) {
  const { locale } = useI18n();
  const [tip, setTip] = useState(() => randomTip(locale));
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    setTip(randomTip(locale));
  }, [locale]);

  useEffect(() => {
    const id = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setTip((prev) => randomTip(locale, prev));
        setVisible(true);
      }, 300);
    }, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs, locale]);

  return (
    <div className="rounded-[var(--radius)] border border-dorado/30 bg-gradient-to-r from-burdeo/5 to-dorado/10 px-4 py-3">
      <p
        className={
          "text-sm italic leading-snug text-burdeo transition-opacity duration-300 " +
          (visible ? "opacity-100" : "opacity-0")
        }
      >
        <span className="mr-1 not-italic text-dorado">”</span>
        {tip}
      </p>
    </div>
  );
}
