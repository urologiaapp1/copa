"use client";

import { useLive } from "@/lib/useLive";
import { formatCLP } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/context";
import type { LiveStats as LiveStatsData } from "@/lib/results";

interface Payload {
  status: string;
  stats: LiveStatsData;
}

/** Pulso de la sala en vivo: quién puntea, quién apuesta más caro, el aroma del momento. */
export function LiveStatsPanel({ code, dark = false }: { code: string; dark?: boolean }) {
  const { t } = useI18n();
  const { data } = useLive<Payload>(`/api/event/${code}/live`, `/api/event/${code}/stream`, 6000);
  const stats = data?.stats;

  if (!stats || stats.totalEvaluations === 0) return null;

  const items: { icon: string; label: string; value: string }[] = [];
  if (stats.mostActive)
    items.push({
      icon: "🏃",
      label: t("live.goesFaster"),
      value: `${stats.mostActive.name} (${stats.mostActive.count})`,
    });
  if (stats.mostGenerous)
    items.push({ icon: "🥰", label: t("live.mostGenerous"), value: stats.mostGenerous.name });
  if (stats.toughestCritic && stats.toughestCritic.name !== stats.mostGenerous?.name)
    items.push({ icon: "🧐", label: t("live.toughestCritic"), value: stats.toughestCritic.name });
  if (stats.highestPricer)
    items.push({
      icon: "💸",
      label: t("live.higherPrices"),
      value: `${stats.highestPricer.name} (~${formatCLP(stats.highestPricer.avgPrice)})`,
    });
  if (stats.topAroma)
    items.push({
      icon: "👃",
      label: t("live.aromaOfMoment"),
      value: t("live.aromaValue", { aroma: stats.topAroma.aroma, name: stats.topAroma.topName ?? "?" }),
    });

  if (items.length === 0) return null;

  return (
    <div
      className={
        "rounded-[var(--radius)] border p-4 " +
        (dark ? "border-white/10 bg-white/5" : "border-[var(--border)] bg-card")
      }
    >
      <p
        className={
          "mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide " +
          (dark ? "text-dorado" : "text-burdeo")
        }
      >
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-dorado opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-dorado" />
        </span>
        {t("live.pulseTitle")}
      </p>
      <div className="space-y-1.5">
        {items.map((it, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span>{it.icon}</span>
            <span className={dark ? "text-marfil/60" : "text-muted"}>{it.label}:</span>
            <span className={"font-medium " + (dark ? "text-marfil" : "text-negro")}>{it.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
