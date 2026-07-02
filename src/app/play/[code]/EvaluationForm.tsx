"use client";

import { useEffect, useRef, useState } from "react";
import { saveEvaluation, type EvalInput } from "@/lib/actions";
import { getModality, getModalityGuessLabel, getModalityAromas, guessOptions } from "@/lib/modalities";
import { Card, ScoreStamp, StampLabel } from "@/components/ui";
import { TipBanner } from "@/components/TipBanner";
import { useI18n } from "@/lib/i18n/context";

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
  confidence: 3, // ya no se pregunta; queda fijo
};

const TAG_ROTATIONS = [-2, 1, -1, 2, -1, 1, -2, 1, -1, 2];

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
  const { t, locale } = useI18n();
  const modality = getModality(modalityKey);
  const aromaOptions = getModalityAromas(modalityKey, locale);
  const [v, setV] = useState<Omit<EvalInput, "itemId">>({ ...DEFAULT, ...initial });
  const [save, setSave] = useState<SaveState>(initial ? "saved" : "idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstRender = useRef(true);

  // Reinicia el formulario al cambiar de vino
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

  const guesses = guessOptions(modalityKey, locale);

  return (
    <div className="space-y-4">
      <Card className="bg-card-dark relative border-white/10 p-5 pt-6 text-marfil">
        <StampLabel rotate={-4} className="absolute -left-1.5 -top-3 z-10 shadow-sm">
          {modality.emoji} {t("eval.wineInTasting")}
        </StampLabel>
        <div className="flex items-center justify-between">
          <p className="font-serif text-[2.5rem] font-semibold leading-none text-dorado">
            {t("host.wineLabel", { n: position })}
          </p>
          <SaveIndicator state={save} t={t} />
        </div>

        {/* Nota general */}
        <div className="mt-6 flex items-center gap-4">
          <ScoreStamp value={v.overall} size={76} rotate={-6} />
          <div className="flex-1">
            <label className="mb-1 block text-sm font-semibold text-marfil/80">
              {t("eval.overallScore")}
            </label>
            <input
              type="range"
              min={1}
              max={100}
              value={v.overall}
              onChange={(e) => set("overall", Number(e.target.value))}
              className="tasting-slider w-full"
            />
          </div>
        </div>
      </Card>

      <TipBanner />

      <Card className="space-y-4 p-5">
        <Slider label={t("eval.aroma")} value={v.aroma} onChange={(n) => set("aroma", n)} />
        <Slider label={t("eval.flavor")} value={v.flavor} onChange={(n) => set("flavor", n)} />
        <Slider label={t("eval.balance")} value={v.balance} onChange={(n) => set("balance", n)} />
      </Card>

      <Card className="p-5">
        <label className="text-sm font-semibold text-negro">{t("eval.perceivedAromas")}</label>
        <div className="mt-3 flex flex-wrap gap-2">
          {aromaOptions.map((a, i) => {
            const on = v.aromas.includes(a);
            const rotate = on ? 0 : TAG_ROTATIONS[i % TAG_ROTATIONS.length];
            return (
              <button
                key={a}
                type="button"
                onClick={() => toggleAroma(a)}
                style={{ transform: `rotate(${rotate}deg)` }}
                className={
                  "rounded-md border-[1.5px] px-3 py-1.5 text-sm transition-all " +
                  (on
                    ? "border-burdeo bg-burdeo text-marfil"
                    : "border-dashed border-burdeo/35 bg-white text-negro/70 hover:border-burdeo/60")
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
            {getModalityGuessLabel(modalityKey, locale)}
          </label>
          {guesses ? (
            <select
              value={v.estimatedGrape}
              onChange={(e) => set("estimatedGrape", e.target.value)}
              className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-white px-3 py-2.5 text-negro outline-none focus:border-dorado focus:ring-2 focus:ring-[var(--ring)]"
            >
              <option value="">{t("eval.guessSelectDefault")}</option>
              {guesses.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          ) : (
            <input
              value={v.estimatedGrape}
              onChange={(e) => set("estimatedGrape", e.target.value)}
              maxLength={60}
              placeholder={t("eval.guessPlaceholder")}
              className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-white px-3 py-2.5 text-negro outline-none focus:border-dorado focus:ring-2 focus:ring-[var(--ring)]"
            />
          )}
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-negro">
            {t("eval.estimatedPriceLabel")}
          </label>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={v.estimatedPrice ?? ""}
            onChange={(e) =>
              set("estimatedPrice", e.target.value === "" ? null : Number(e.target.value))
            }
            placeholder={t("eval.pricePlaceholder")}
            className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-white px-3 py-2.5 text-negro outline-none focus:border-dorado focus:ring-2 focus:ring-[var(--ring)]"
          />
        </div>
      </Card>

      <Card className="space-y-4 p-5">
        <div>
          <label className="mb-2 block text-sm font-semibold text-negro">{t("eval.wouldBuy")}</label>
          <div className="flex gap-2">
            {[
              { v: true, l: t("eval.buyYes") },
              { v: false, l: t("eval.buyNo") },
            ].map((o) => (
              <button
                key={String(o.v)}
                type="button"
                onClick={() => set("wouldBuy", v.wouldBuy === o.v ? null : o.v)}
                className={
                  "flex-1 rounded-[var(--radius)] border-[1.5px] px-3 py-2.5 text-sm font-medium transition-colors " +
                  (v.wouldBuy === o.v
                    ? "border-burdeo bg-burdeo text-marfil"
                    : "border-dashed border-burdeo/30 bg-white text-negro/70 hover:border-burdeo/50")
                }
              >
                {o.l}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-negro">{t("eval.notes")}</label>
          <textarea
            value={v.notes}
            onChange={(e) => set("notes", e.target.value)}
            rows={2}
            maxLength={500}
            placeholder={t("eval.notesPlaceholder")}
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
        <span className="font-serif text-lg font-bold text-burdeo">{value}<span className="text-xs text-muted">/10</span></span>
      </div>
      <input
        type="range"
        min={1}
        max={10}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="tasting-slider w-full"
      />
    </div>
  );
}

function SaveIndicator({
  state,
  t,
}: {
  state: SaveState;
  t: (key: string) => string;
}) {
  const map: Record<SaveState, { key: string; c: string }> = {
    idle: { key: "common.saveIdle", c: "text-marfil/50" },
    saving: { key: "common.saving", c: "text-marfil/50" },
    saved: { key: "common.saved", c: "text-dorado" },
    error: { key: "common.saveError", c: "text-red-400" },
  };
  const s = map[state];
  return <span className={`text-xs font-medium ${s.c}`}>{t(s.key)}</span>;
}
