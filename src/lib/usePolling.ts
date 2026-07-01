"use client";

import { useEffect, useRef, useState } from "react";

/** Sondea un endpoint JSON en un intervalo. Base para la "sincronía en vivo". */
export function usePolling<T>(url: string | null, intervalMs = 2000) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const active = useRef(true);

  useEffect(() => {
    active.current = true;
    if (!url) return;

    async function tick() {
      try {
        const res = await fetch(url!, { cache: "no-store" });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          if (active.current) setError(body.error ?? String(res.status));
        } else {
          const json = (await res.json()) as T;
          if (active.current) {
            setData(json);
            setError(null);
          }
        }
      } catch {
        if (active.current) setError("network");
      } finally {
        if (active.current) setLoading(false);
      }
    }

    tick();
    const id = setInterval(tick, intervalMs);
    return () => {
      active.current = false;
      clearInterval(id);
    };
  }, [url, intervalMs]);

  return { data, error, loading };
}
