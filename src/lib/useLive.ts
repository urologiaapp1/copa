"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Datos en vivo: consulta `dataUrl` al inicio, cada vez que el puente SSE
 * (`streamUrl`) avisa de un cambio, y además cada `fallbackMs` como respaldo
 * (por si Realtime/SSE no está disponible). Misma forma que usePolling.
 */
export function useLive<T>(
  dataUrl: string | null,
  streamUrl: string | null,
  fallbackMs = 15000,
) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!dataUrl) return;
    let active = true;
    let debounce: ReturnType<typeof setTimeout> | null = null;

    async function fetchNow() {
      try {
        const res = await fetch(dataUrl!, { cache: "no-store" });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          if (active) setError(body.error ?? String(res.status));
        } else {
          const json = (await res.json()) as T;
          if (active) {
            setData(json);
            setError(null);
          }
        }
      } catch {
        if (active) setError("network");
      }
    }

    // Coalesce ráfagas de cambios (p. ej. muchos votos a la vez)
    function scheduleFetch() {
      if (debounce) clearTimeout(debounce);
      debounce = setTimeout(fetchNow, 250);
    }

    fetchNow();

    let es: EventSource | null = null;
    if (streamUrl && typeof EventSource !== "undefined") {
      es = new EventSource(streamUrl);
      es.onmessage = (e) => {
        if (e.data === "change") scheduleFetch();
      };
      // onerror: EventSource reintenta solo; el fallback cubre el hueco
    }

    const fallback = setInterval(fetchNow, fallbackMs);

    return () => {
      active = false;
      if (debounce) clearTimeout(debounce);
      clearInterval(fallback);
      es?.close();
    };
  }, [dataUrl, streamUrl, fallbackMs]);

  return { data, error };
}
