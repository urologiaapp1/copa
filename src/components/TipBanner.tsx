"use client";

import { useEffect, useState } from "react";
import { randomTip } from "@/lib/tips";

/** Frase rotativa con humor, para acompañar mientras se evalúa o se espera. */
export function TipBanner({ intervalMs = 9000 }: { intervalMs?: number }) {
  const [tip, setTip] = useState(() => randomTip());
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const id = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setTip((prev) => randomTip(prev));
        setVisible(true);
      }, 300);
    }, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

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
