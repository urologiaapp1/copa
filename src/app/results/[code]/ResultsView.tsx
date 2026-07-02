"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useLive } from "@/lib/useLive";
import { Button, Card, ScoreStamp, StampLabel } from "@/components/ui";
import { Confetti } from "@/components/Confetti";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { formatCLP } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/context";
import type { EventResults, TasterProfile, TasterLeaderboard } from "@/lib/results";

type T = (key: string, vars?: Record<string, string | number>) => string;

interface Payload {
  event: { code: string; title: string; modality: string; status: string };
  results: EventResults;
  profile: TasterProfile | null;
  leaderboard: TasterLeaderboard;
}

export function ResultsView({ code, print = false }: { code: string; print?: boolean }) {
  const { t } = useI18n();
  const { data, error } = useLive<Payload>(
    `/api/event/${code}/results`,
    `/api/event/${code}/stream`,
  );
  const printed = useRef(false);

  useEffect(() => {
    if (print && data && !printed.current) {
      printed.current = true;
      const timeout = setTimeout(() => window.print(), 500);
      return () => clearTimeout(timeout);
    }
  }, [print, data]);

  if (error === "not_revealed")
    return (
      <Center>
        <Card className="max-w-sm p-8 text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-dorado/30 border-t-dorado" />
          <p className="font-semibold text-negro">{t("results.notRevealedTitle")}</p>
          <p className="mt-1 text-sm text-muted">{t("results.notRevealedDesc")}</p>
        </Card>
      </Center>
    );
  if (!data) return <Center>{t("common.loadingResults")}</Center>;

  const { results, profile, leaderboard } = data;

  return (
    <main className="bg-wine min-h-dvh px-5 py-8 print:bg-white print:py-2">
      {!print && <Confetti />}
      <div className="mx-auto w-full max-w-2xl space-y-5">
        {!print && (
          <div className="flex justify-end print:hidden">
            <LanguageSwitcher dark />
          </div>
        )}
        <header className="text-center">
          <StampLabel rotate={-3} className="mb-2 inline-block">
            {t("results.title")}
          </StampLabel>
          <h1 className="text-2xl font-bold text-marfil print:text-negro">{data.event.title}</h1>
          <p className="mt-1 text-sm text-marfil/60 print:text-negro/60">
            {t("results.participatedEvals", {
              responded: results.responded,
              evals: results.totalEvaluations,
            })}
          </p>
        </header>

        {/* Podio */}
        <div className="grid gap-3 sm:grid-cols-3">
          <Highlight
            title={t("results.winner")}
            name={results.ranking[0]?.item.name}
            stamp={results.ranking[0] ? results.ranking[0].avgOverall.toFixed(0) : undefined}
          />
          <Highlight
            title={t("results.priceQuality")}
            name={results.bestValue?.item.name}
            sub={results.bestValue?.item.price ? formatCLP(results.bestValue.item.price) : undefined}
          />
          <Highlight
            title={t("results.mostDivisive")}
            name={results.mostDivisive?.item.name}
            sub={results.mostDivisive ? `±${results.mostDivisive.stdDev.toFixed(1)}` : undefined}
          />
        </div>

        {results.surprise && (
          <Card className="border-dorado/40 bg-dorado/10 p-4">
            <p className="text-sm">
              <span className="font-semibold text-burdeo">{t("results.surpriseLabel")}</span>{" "}
              <span className="text-negro">{results.surprise.item.name}</span>{" "}
              {t("results.surpriseObtained", {
                score: results.surprise.avgOverall.toFixed(0),
                price: results.surprise.item.price ? ` (${formatCLP(results.surprise.item.price)})` : "",
              })}
            </p>
          </Card>
        )}

        {/* Ranking completo */}
        <Card className="p-5">
          <p className="mb-3 text-sm font-semibold text-negro">{t("results.fullRanking")}</p>
          <div className="space-y-3">
            {results.ranking.map((s, i) => (
              <div key={s.item.id}>
                <div className="flex items-center gap-3">
                  <span className="w-7 text-center text-lg">
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-negro">{s.item.name}</p>
                    <p className="text-xs text-muted">
                      {s.item.grape ? s.item.grape : ""}
                      {s.item.grape && s.item.price ? " · " : ""}
                      {s.item.price ? formatCLP(s.item.price) : ""}
                      {s.wouldBuyPct > 0
                        ? ` · ${t("results.wouldBuyPct", { pct: s.wouldBuyPct.toFixed(0) })}`
                        : ""}
                    </p>
                  </div>
                  <span className="font-bold text-burdeo">{s.avgOverall.toFixed(0)}</span>
                </div>
                <div className="mt-1.5 ml-10 h-1.5 overflow-hidden rounded-full bg-black/5">
                  <div
                    className="h-full rounded-full bg-burdeo"
                    style={{ width: `${s.avgOverall}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Ranking de catadores */}
        {leaderboard.rows.length > 0 && <TasterLeaderboardCard leaderboard={leaderboard} t={t} />}

        {/* Perfil del catador */}
        {profile && profile.evaluated > 0 && <ProfileCard profile={profile} t={t} />}

        <Link href="/" className="block print:hidden">
          <Button variant="outline" className="w-full">
            {t("results.createAnother")}
          </Button>
        </Link>
      </div>
    </main>
  );
}

function ProfileCard({ profile, t }: { profile: TasterProfile; t: T }) {
  const gen = profile.generosityVsGroup;
  return (
    <Card className="p-5">
      <p className="mb-1 text-sm font-semibold text-negro">{t("results.yourProfile")}</p>
      <p className="mb-4 text-xs text-muted">{profile.name}</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label={t("results.winesStat")} value={String(profile.evaluated)} />
        <Stat label={t("results.avgScore")} value={profile.avgGiven.toFixed(0)} />
        <Stat
          label={t("results.vsGroup")}
          value={`${gen >= 0 ? "+" : ""}${gen.toFixed(0)}`}
          hint={gen >= 3 ? t("results.generous") : gen <= -3 ? t("results.demanding") : t("results.balanced")}
        />
        <Stat
          label={t("results.priceAccuracyStat")}
          value={profile.priceAccuracy != null ? `${profile.priceAccuracy}%` : "—"}
        />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3">
        <RadarBar label={t("eval.aroma")} value={profile.radar.aroma} />
        <RadarBar label={t("eval.flavor")} value={profile.radar.flavor} />
        <RadarBar label={t("eval.balance")} value={profile.radar.balance} />
      </div>

      {profile.grapeGuesses > 0 && (
        <p className="mt-4 rounded-lg bg-burdeo/10 px-3 py-2 text-center text-sm font-medium text-burdeo">
          {t("results.grapeHitsInline", { hits: profile.grapeHits, total: profile.grapeGuesses })}
        </p>
      )}

      {profile.report.some((r) => r.myGuess || r.myPrice != null) && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
            {t("results.yourReport")}
          </p>
          <div className="space-y-1.5">
            {profile.report.map((r) => (
              <div
                key={r.position}
                className="flex items-center justify-between gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-xs"
              >
                <span className="min-w-0 flex-1 truncate text-negro">
                  <b>{r.name}</b>
                </span>
                <span className="text-muted">
                  {r.myGuess ? (
                    <>
                      {t("results.youSaid")} <b className="text-negro">{r.myGuess}</b>
                      {r.realGrape ? ` · ${t("results.itWas")} ${r.realGrape}` : ""}
                    </>
                  ) : (
                    t("results.noGrapeGuess")
                  )}
                </span>
                {r.grapeHit === true && <span className="text-green-700">✓</span>}
                {r.grapeHit === false && <span className="text-red-500">✗</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

function TasterLeaderboardCard({ leaderboard, t }: { leaderboard: TasterLeaderboard; t: T }) {
  const { rows, bestPriceGuesser, bestGrapeGuesser } = leaderboard;
  const byPrice = [...rows]
    .filter((r) => r.priceAccuracy !== null)
    .sort((a, b) => (b.priceAccuracy ?? 0) - (a.priceAccuracy ?? 0));
  const byGrape = [...rows]
    .filter((r) => r.grapeGuesses > 0)
    .sort((a, b) => b.grapeHits - a.grapeHits);

  return (
    <Card className="p-5">
      <p className="mb-3 text-sm font-semibold text-negro">{t("results.tasterLeaderboardTitle")}</p>

      {(bestPriceGuesser || bestGrapeGuesser) && (
        <div className="mb-4 grid gap-3 sm:grid-cols-2">
          {bestPriceGuesser && (
            <div className="rounded-xl bg-dorado/10 p-3 text-center">
              <p className="text-xs text-muted">{t("results.bestPriceGuesser")}</p>
              <p className="mt-1 text-lg font-bold text-burdeo">{bestPriceGuesser.name}</p>
              <p className="text-xs text-muted">
                {t("results.accuracyPct", { pct: bestPriceGuesser.priceAccuracy ?? 0 })}
              </p>
            </div>
          )}
          {bestGrapeGuesser && (
            <div className="rounded-xl bg-burdeo/10 p-3 text-center">
              <p className="text-xs text-muted">{t("results.bestGrapeGuesser")}</p>
              <p className="mt-1 text-lg font-bold text-burdeo">{bestGrapeGuesser.name}</p>
              <p className="text-xs text-muted">
                {t("results.hitsOf", { hits: bestGrapeGuesser.grapeHits, total: bestGrapeGuesser.grapeGuesses })}
              </p>
            </div>
          )}
        </div>
      )}

      {byPrice.length > 0 && (
        <div className="mb-3">
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
            {t("results.priceAccuracySection")}
          </p>
          <div className="space-y-1">
            {byPrice.map((r, i) => (
              <div key={r.participantId} className="flex items-center justify-between text-sm">
                <span className="text-negro">
                  {i + 1}. {r.name}
                </span>
                <span className="font-medium text-burdeo">{r.priceAccuracy}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {byGrape.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
            {t("results.grapeHitsSection")}
          </p>
          <div className="space-y-1">
            {byGrape.map((r, i) => (
              <div key={r.participantId} className="flex items-center justify-between text-sm">
                <span className="text-negro">
                  {i + 1}. {r.name}
                </span>
                <span className="font-medium text-burdeo">
                  {r.grapeHits}/{r.grapeGuesses}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl bg-black/[0.03] p-3 text-center">
      <p className="text-lg font-bold text-burdeo">{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-muted">{label}</p>
      {hint && <p className="text-[10px] text-dorado">{hint}</p>}
    </div>
  );
}

function RadarBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-muted">
        <span>{label}</span>
        <span>{value.toFixed(1)}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-black/5">
        <div className="h-full rounded-full bg-dorado" style={{ width: `${(value / 10) * 100}%` }} />
      </div>
    </div>
  );
}

function Highlight({
  title,
  name,
  sub,
  stamp,
}: {
  title: string;
  name?: string;
  sub?: string;
  stamp?: string;
}) {
  return (
    <Card className="p-4 text-center">
      <p className="text-xs text-muted">{title}</p>
      {stamp && <ScoreStamp value={stamp} size={56} rotate={-5} className="my-1.5" />}
      <p className="mt-1 truncate text-sm font-semibold text-negro">{name ?? "—"}</p>
      {sub && <p className="text-xs text-burdeo">{sub}</p>}
    </Card>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return (
    <main className="bg-wine flex min-h-dvh items-center justify-center text-marfil/70">
      {children}
    </main>
  );
}
