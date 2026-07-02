"use client";

import { useEffect, useRef, useState } from "react";
import { saveEvaluation, type EvalInput } from "@/lib/actions";
import { getModality, getModalityGuessLabel, guessOptions } from "@/lib/modalities";
import { Card, ScoreStamp, StampLabel } from "@/components/ui";
import { TipBanner } from "@/components/TipBanner";
import { useI18n } from "@/lib/i18n/context";

type SaveState = "idle" | "saving" | "saved" | "error";

const DEFAULT: Omit<EvalInput, "itemId"> = {
  acidity: 5,
  sweetness: 5,
  tannin: 5,
  body: 5,
  overall: 70,
  notes: "",
  estimatedGrape: "",
  estimatedPrice: null,
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
  const { t, locale } = useI18n();
  const modality = getModality(modalityKey);
  // el servidor puede devolver null en los campos de texto; el form usa strings
  const merge = (init: typeof initial): Omit<EvalInput, "itemId"> => ({
    ...DEFAULT,
    ...init,
    notes: init?.notes ?? "",
    estimatedGrape: init?.estimatedGrape ?? "",
  });
  const [v, setV] = useState<Omit<EvalInput, "itemId">>(() => merge(initial));
  const [save, setSave] = useState<SaveState>(initial ? "saved" : "idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstRender = useRef(true);

  // Reinicia el formulario al cambiar de vino
  useEffect(() => {
    setV(merge(initial));
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

        {/* Nota */}
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

      {/* Características de sabor: ejes bipolares */}
      <Card className="space-y-5 p-5">
        <label className="block text-sm font-semibold text-negro">
          {t("eval.flavorTraits")}
        </label>
        <BipolarSlider
          left={t("eval.axisWeak")}
          right={t("eval.axisAcidic")}
          value={v.acidity}
          onChange={(n) => set("acidity", n)}
        />
        <BipolarSlider
          left={t("eval.axisDry")}
          right={t("eval.axisSweet")}
          value={v.sweetness}
          onChange={(n) => set("sweetness", n)}
        />
        <BipolarSlider
          left={t("eval.axisSmooth")}
          right={t("eval.axisTannic")}
          value={v.tannin}
          onChange={(n) => set("tannin", n)}
        />
        <BipolarSlider
          left={t("eval.axisLight")}
          right={t("eval.axisPowerful")}
          value={v.body}
          onChange={(n) => set("body", n)}
        />
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

      <Card className="p-5">
        <label className="mb-1 block text-sm font-semibold text-negro">{t("eval.notes")}</label>
        <textarea
          value={v.notes}
          onChange={(e) => set("notes", e.target.value)}
          rows={2}
          maxLength={500}
          placeholder={t("eval.notesPlaceholder")}
          className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-white px-3 py-2.5 text-sm text-negro outline-none focus:border-dorado focus:ring-2 focus:ring-[var(--ring)]"
        />
      </Card>
    </div>
  );
}

/** Eje bipolar: dos extremos y qué tan cerca de cada uno está el vino. */
function BipolarSlider({
  left,
  right,
  value,
  onChange,
}: {
  left: string;
  right: string;
  value: number;
  onChange: (n: number) => void;
}) {
  // resalta el extremo hacia el que se inclina la respuesta
  const leansLeft = value <= 4;
  const leansRight = value >= 7;
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <span
          className={
            "text-[11px] font-bold uppercase tracking-widest transition-colors " +
            (leansLeft ? "text-burdeo" : "text-muted")
          }
        >
          {left}
        </span>
        <span
          className={
            "text-[11px] font-bold uppercase tracking-widest transition-colors " +
            (leansRight ? "text-burdeo" : "text-muted")
          }
        >
          {right}
        </span>
      </div>
      <input
        type="range"
        min={1}
        max={10}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="tasting-slider w-full"
        aria-label={`${left} – ${right}`}
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
