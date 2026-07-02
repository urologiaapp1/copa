"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { useLive } from "@/lib/useLive";
import { getModality, getModalityLabel } from "@/lib/modalities";
import { Confetti } from "@/components/Confetti";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { formatCLP } from "@/lib/utils";
import { randomTip } from "@/lib/tips";
import { useI18n } from "@/lib/i18n/context";
import type { EventResults, LiveStats } from "@/lib/results";
import type { EventStatus } from "@/lib/types";
import type { Locale } from "@/lib/i18n/locales";

type T = (key: string, vars?: Record<string, string | number>) => string;

interface StateData {
  event: {
    code: string;
    title: string;
    modality: string;
    status: EventStatus;
    currentIndex: number;
    itemCount: number;
  };
  currentItemPosition: number | null;
  responsesForCurrent: number;
  participants: { name: string }[];
}
interface ResultsData {
  results: EventResults;
}
interface LivePayload {
  stats: LiveStats;
}

export function TVView({ code, joinUrl }: { code: string; joinUrl: string }) {
  const { t, locale } = useI18n();
  const streamUrl = `/api/event/${code}/stream`;
  const { data } = useLive<StateData>(`/api/event/${code}/state`, streamUrl);
  const status = data?.event.status;
  // Sólo pedimos resultados cuando ya están revelados (endpoint público entonces)
  const { data: res } = useLive<ResultsData>(
    status === "revealed" ? `/api/event/${code}/results` : null,
    status === "revealed" ? streamUrl : null,
  );
  const { data: live } = useLive<LivePayload>(
    status === "tasting" ? `/api/event/${code}/live` : null,
    status === "tasting" ? streamUrl : null,
    8000,
  );

  if (!data)
    return (
      <Screen>
        <p className="text-3xl text-marfil/60">{t("common.loading")}</p>
      </Screen>
    );

  const { event, participants } = data;
  const mod = getModality(event.modality);

  return (
    <Screen>
      {event.status === "revealed" && <Confetti count={80} />}

      {/* Encabezado */}
      <div className="absolute left-0 right-0 top-0 flex items-center justify-between px-10 py-6">
        <span className="text-2xl font-bold tracking-tight text-marfil">
          🍷 Copa <span className="text-dorado">Ciega</span>
        </span>
        <div className="flex items-center gap-4">
          <span className="text-xl text-marfil/60">
            {mod.emoji} {getModalityLabel(event.modality, locale)}
          </span>
          <LanguageSwitcher dark />
        </div>
      </div>

      {event.status === "lobby" && (
        <Lobby title={event.title} code={event.code} joinUrl={joinUrl} participants={participants} t={t} />
      )}

      {event.status === "tasting" && (
        <Tasting
          position={data.currentItemPosition ?? event.currentIndex + 1}
          total={event.itemCount}
          responses={data.responsesForCurrent}
          people={participants.length}
          stats={live?.stats ?? null}
          t={t}
          locale={locale}
        />
      )}

      {event.status === "closed" && (
        <div className="flex flex-col items-center gap-6">
          <div className="h-20 w-20 animate-spin rounded-full border-8 border-dorado/30 border-t-dorado" />
          <p className="text-5xl font-bold text-marfil">{t("tv.votingClosed")}</p>
          <p className="text-2xl text-marfil/60">{t("tv.preparingReveal")}</p>
        </div>
      )}

      {event.status === "revealed" && res && <Podium results={res.results} t={t} />}
    </Screen>
  );
}

function Lobby({
  title,
  code,
  joinUrl,
  participants,
  t,
}: {
  title: string;
  code: string;
  joinUrl: string;
  participants: { name: string }[];
  t: T;
}) {
  const [qr, setQr] = useState("");
  useEffect(() => {
    QRCode.toDataURL(joinUrl, { margin: 1, width: 640, color: { dark: "#14100f", light: "#fffdf8" } }).then(setQr);
  }, [joinUrl]);

  return (
    <div className="flex w-full max-w-6xl flex-col items-center gap-10 lg:flex-row lg:justify-between">
      <div className="text-center lg:text-left">
        <p className="text-2xl uppercase tracking-widest text-dorado">{t("tv.scanToJoin")}</p>
        <h1 className="mt-2 max-w-xl text-6xl font-extrabold leading-tight text-marfil">{title}</h1>
        <p className="mt-6 text-3xl text-marfil/70">{t("tv.code")}</p>
        <p className="font-mono text-8xl font-bold tracking-[0.2em] text-dorado">{code}</p>
        <p className="mt-8 text-2xl text-marfil/60">
          {participants.length}{" "}
          {participants.length === 1 ? t("tv.personConnected") : t("tv.peopleConnected")}
        </p>
      </div>

      <div className="rounded-3xl bg-[#fffdf8] p-6 shadow-2xl">
        {qr ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qr} alt="QR" className="h-80 w-80" />
        ) : (
          <div className="h-80 w-80 animate-pulse rounded-2xl bg-black/10" />
        )}
      </div>

      <div className="absolute bottom-10 left-0 right-0 flex flex-wrap justify-center gap-3 px-10">
        {participants.slice(-14).map((p, i) => (
          <span
            key={`${p.name}-${i}`}
            className="animate-pop rounded-full bg-burdeo/40 px-5 py-2 text-2xl font-semibold text-marfil"
          >
            {p.name}
          </span>
        ))}
      </div>
    </div>
  );
}

function Tasting({
  position,
  total,
  responses,
  people,
  stats,
  t,
  locale,
}: {
  position: number;
  total: number;
  responses: number;
  people: number;
  stats: LiveStats | null;
  t: T;
  locale: Locale;
}) {
  const pct = people ? Math.round((responses / people) * 100) : 0;
  const R = 130;
  const C = 2 * Math.PI * R;

  const rows: { icon: string; text: string }[] = [];
  if (stats?.mostActive) rows.push({ icon: "🏃", text: t("tv.goesFaster", { name: stats.mostActive.name }) });
  if (stats?.mostGenerous)
    rows.push({ icon: "🥰", text: t("tv.mostGenerous", { name: stats.mostGenerous.name }) });
  if (stats?.highestPricer)
    rows.push({ icon: "💸", text: t("tv.higherPrices", { name: stats.highestPricer.name }) });
  if (stats?.mostAcidFinder)
    rows.push({ icon: "🍋", text: t("tv.mostAcid", { name: stats.mostAcidFinder.name }) });
  if (stats?.mostSweetFinder)
    rows.push({ icon: "🍬", text: t("tv.mostSweet", { name: stats.mostSweetFinder.name }) });
  if (stats?.mostPowerfulFinder)
    rows.push({ icon: "💪", text: t("tv.mostPowerful", { name: stats.mostPowerfulFinder.name }) });
  if (stats?.secretKeeper)
    rows.push({ icon: "🤫", text: t("tv.secretKeeper", { name: stats.secretKeeper.name }) });

  return (
    <div className="flex w-full max-w-5xl flex-col items-center gap-8">
      <p className="text-3xl uppercase tracking-widest text-dorado">{t("tv.tastingNow")}</p>
      <p className="text-9xl font-extrabold text-marfil">
        {t("host.wineLabel", { n: position })}
        <span className="text-5xl text-marfil/40"> / {total}</span>
      </p>
      <div className="relative flex items-center justify-center">
        <svg width={300} height={300} className="-rotate-90">
          <circle cx={150} cy={150} r={R} fill="none" stroke="rgba(246,241,231,0.12)" strokeWidth={22} />
          <circle
            cx={150}
            cy={150}
            r={R}
            fill="none"
            stroke="#c9a227"
            strokeWidth={22}
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={C - (C * pct) / 100}
            style={{ transition: "stroke-dashoffset 0.6s ease" }}
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-7xl font-bold text-marfil">{responses}</span>
          <span className="text-2xl text-marfil/50">{t("tv.votesOf", { n: people })}</span>
        </div>
      </div>

      {rows.length > 0 && (
        <div className="flex flex-wrap justify-center gap-x-10 gap-y-2">
          {rows.map((r, i) => (
            <span key={i} className="animate-fade-in-up text-xl text-marfil/70">
              {r.icon} {r.text}
            </span>
          ))}
        </div>
      )}

      <TVTipBanner locale={locale} />
    </div>
  );
}

function TVTipBanner({ locale }: { locale: Locale }) {
  const [tip, setTip] = useState(() => randomTip(locale));
  useEffect(() => {
    setTip(randomTip(locale));
    const id = setInterval(() => setTip((prev) => randomTip(locale, prev)), 12000);
    return () => clearInterval(id);
  }, [locale]);
  return (
    <p className="max-w-3xl text-center text-lg italic text-marfil/40">“{tip}”</p>
  );
}

function Podium({ results, t }: { results: EventResults; t: T }) {
  const top = results.ranking.slice(0, 3);
  const rest = results.ranking.slice(3);
  const order = [top[1], top[0], top[2]].filter(Boolean); // 2º, 1º, 3º
  const heights = ["h-48", "h-64", "h-36"];
  const medals = ["🥈", "🥇", "🥉"];
  const idxMap = [1, 0, 2];

  return (
    <div className="flex w-full max-w-6xl flex-col items-center gap-8">
      <h1 className="text-6xl font-extrabold text-marfil">{t("tv.results")}</h1>
      <div className="flex items-end justify-center gap-6">
        {order.map((s, i) => (
          <div key={s.item.id} className="flex flex-col items-center">
            <span className="text-5xl">{medals[i]}</span>
            <p className="mt-2 max-w-[16rem] truncate text-3xl font-bold text-marfil">{s.item.name}</p>
            <p className="text-xl text-dorado">{s.avgOverall.toFixed(0)} pts</p>
            {s.item.price != null && (
              <p className="text-lg text-marfil/50">{formatCLP(s.item.price)}</p>
            )}
            <div
              className={`mt-3 w-40 rounded-t-2xl bg-gradient-to-t from-burdeo to-burdeo-400 ${heights[i]} animate-pop`}
            >
              <div className="pt-4 text-center text-6xl font-black text-marfil/90">#{idxMap[i] + 1}</div>
            </div>
          </div>
        ))}
      </div>

      {rest.length > 0 && (
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-2xl text-marfil/60">
          {rest.map((s, i) => (
            <span key={s.item.id}>
              <span className="text-marfil/40">#{i + 4}</span> {s.item.name} · {s.avgOverall.toFixed(0)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function Screen({ children }: { children: React.ReactNode }) {
  return (
    <main className="bg-wine relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-10 py-20">
      {children}
    </main>
  );
}
