"use client";

import { useEffect, useRef, useState } from "react";
import { saveEvaluation, type EvalInput } from "@/lib/actions";
import { getModality } from "@/lib/modalities";
import { Card } from "@/components/ui";

type SaveState = "idle" | "saving" | "saved" | "error";

const DEFAULT: Omit<EvalInput, "itemId"> = {
  aroma: 5,
  flavor: 5,
  balance: 5,
  wouldBuy: null,
  overall: 70,
  notes: "",
  aromas: [],
  estimatedGrape: "",
  estimatedPrice: null,
  confidence: 3,
};

export function EvaluationForm({
  code,
  itemId,
  position,
  modalityKey,
  initial,
}: {
  code: string;
  itemId: string;
  position: number;
  modalityKey: string;
  initial: Partial<Omit<EvalInput, "itemId">> | null;
}) {
  const modality = getModality(modalityKey);
  const [v, setV] = useState<Omit<EvalInput, "itemId">>({ ...DEFAULT, ...initial });
  const [save, setSave] = useState<SaveState>(initial ? "saved" : "idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstRender = useRef(true);

  // Reinicia el formulario al cambiar de muestra
  useEffect(() => {
    setV({ ...DEFAULT, ...initial });
    setSave(initial ? "saved" : "idle");
    firstRender.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemId]);

  // Autosave con debounce
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    setSave("saving");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const res = await saveEvaluation(code, { itemId, ...v });
      setSave(res.ok ? "saved" : "error");
    }, 650);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [v]);

  function set<K extends keyof typeof v>(key: K, val: (typeof v)[K]) {
    setV((prev) => ({ ...prev, [key]: val }));
  }
  function toggleAroma(a: string) {
    setV((prev) => ({
      ...prev,
      aromas: prev.aromas.includes(a)
        ? prev.aromas.filter((x) => x !== a)
        : [...prev.aromas, a],
    }));
  }

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-widest text-muted">
            Muestra en cata
          </span>
          <SaveIndicator state={save} />
        </div>
        <p className="mt-1 text-3xl font-bold text-burdeo">Muestra {position}</p>

        {/* Nota general */}
        <div className="mt-5">
          <div className="mb-1 flex items-baseline justify-between">
            <label className="text-sm font-semibold text-negro">Nota general</label>
            <span className="text-2xl font-bold text-dorado">{v.overall}</span>
          </div>
          <input
            type="range"
            min={1}
            max={100}
            value={v.overall}
            onChange={(e) => set("overall", Number(e.target.value))}
            className="w-full accent-[var(--burdeo)]"
          />
        </div>
      </Card>

      <Card className="space-y-4 p-5">
        <Slider label="Aroma" value={v.aroma} onChange={(n) => set("aroma", n)} />
        <Slider label="Sabor" value={v.flavor} onChange={(n) => set("flavor", n)} />
        <Slider label="Equilibrio" value={v.balance} onChange={(n) => set("balance", n)} />
      </Card>

      <Card className="p-5">
        <label className="text-sm font-semibold text-negro">
          Aromas percibidos
        </label>
        <div className="mt-3 flex flex-wrap gap-2">
          {modality.aromas.map((a) => {
            const on = v.aromas.includes(a);
            return (
              <button
                key={a}
                type="button"
                onClick={() => toggleAroma(a)}
                className={
                  "rounded-full border px-3 py-1.5 text-sm transition-colors " +
                  (on
                    ? "border-burdeo bg-burdeo text-marfil"
                    : "border-[var(--border)] bg-white text-negro/70 hover:border-dorado")
                }
              >
                {a}
              </button>
            );
          })}
        </div>
      </Card>

      <Card className="space-y-4 p-5">
        <div>
          <label className="mb-1 block text-sm font-semibold text-negro">
            {modality.guessLabel}
          </label>
          <input
            value={v.estimatedGrape}
            onChange={(e) => set("estimatedGrape", e.target.value)}
            maxLength={60}
            placeholder="Tu apuesta…"
            className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-white px-3 py-2.5 text-negro outline-none focus:border-dorado focus:ring-2 focus:ring-[var(--ring)]"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-negro">
            Precio estimado (CLP)
          </label>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={v.estimatedPrice ?? ""}
            onChange={(e) =>
              set("estimatedPrice", e.target.value === "" ? null : Number(e.target.value))
            }
            placeholder="Ej. 9990"
            className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-white px-3 py-2.5 text-negro outline-none focus:border-dorado focus:ring-2 focus:ring-[var(--ring)]"
          />
        </div>
      </Card>

      <Card className="space-y-4 p-5">
        <div>
          <label className="mb-2 block text-sm font-semibold text-negro">¿La comprarías?</label>
          <div className="flex gap-2">
            {[
              { v: true, l: "Sí 👍" },
              { v: false, l: "No 👎" },
            ].map((o) => (
              <button
                key={String(o.v)}
                type="button"
                onClick={() => set("wouldBuy", v.wouldBuy === o.v ? null : o.v)}
                className={
                  "flex-1 rounded-[var(--radius)] border px-3 py-2.5 text-sm font-medium transition-colors " +
                  (v.wouldBuy === o.v
                    ? "border-burdeo bg-burdeo text-marfil"
                    : "border-[var(--border)] bg-white text-negro/70")
                }
              >
                {o.l}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-negro">
            Confianza en tu respuesta
          </label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => set("confidence", n)}
                className="text-2xl transition-transform hover:scale-110"
                aria-label={`Confianza ${n}`}
              >
                {n <= v.confidence ? "★" : "☆"}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-negro">Notas</label>
          <textarea
            value={v.notes}
            onChange={(e) => set("notes", e.target.value)}
            rows={2}
            maxLength={500}
            placeholder="Comentario libre…"
            className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-white px-3 py-2.5 text-sm text-negro outline-none focus:border-dorado focus:ring-2 focus:ring-[var(--ring)]"
          />
        </div>
      </Card>
    </div>
  );
}

function Slider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <label className="text-sm font-medium text-negro/80">{label}</label>
        <span className="text-sm font-semibold text-burdeo">{value}/10</span>
      </div>
      <input
        type="range"
        min={1}
        max={10}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[var(--burdeo)]"
      />
    </div>
  );
}

function SaveIndicator({ state }: { state: SaveState }) {
  const map: Record<SaveState, { t: string; c: string }> = {
    idle: { t: "Sin guardar", c: "text-muted" },
    saving: { t: "Guardando…", c: "text-muted" },
    saved: { t: "Guardado ✓", c: "text-green-700" },
    error: { t: "Error al guardar", c: "text-red-600" },
  };
  const s = map[state];
  return <span className={`text-xs font-medium ${s.c}`}>{s.t}</span>;
}
