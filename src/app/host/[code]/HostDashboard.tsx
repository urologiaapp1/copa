"use client";

import { useState } from "react";
import Link from "next/link";
import { QRShare } from "@/components/QRShare";
import { Confetti } from "@/components/Confetti";
import { Button, Card, Badge } from "@/components/ui";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useLive } from "@/lib/useLive";
import {
  hostAddItem,
  hostRemoveParticipant,
  hostSetIndex,
  hostSetStatus,
  hostUpdateItem,
} from "@/lib/actions";
import { getModality, getModalityLabel, CHILEAN_RED_GRAPES } from "@/lib/modalities";
import { formatCLP } from "@/lib/utils";
import { LiveStatsPanel } from "@/components/LiveStats";
import { useI18n } from "@/lib/i18n/context";
import type { EventResults } from "@/lib/results";
import type { EventStatus } from "@/lib/types";

interface HostItem {
  id: string;
  position: number;
  name: string;
  producer: string | null;
  grape: string | null;
  price: number | null;
}
interface HostData {
  event: {
    code: string;
    title: string;
    modality: string;
    status: EventStatus;
    currentIndex: number;
    itemCount: number;
    doubleBlind: boolean;
    freePace: boolean;
    recoveryCode: string;
  };
  items: HostItem[];
  participants: { id: string; name: string }[];
  perItemResponses: { itemId: string; position: number; name: string; responses: number }[];
  results: EventResults;
}

export function HostDashboard({ code, joinUrl }: { code: string; joinUrl: string }) {
  const { t, locale } = useI18n();
  const { data, error } = useLive<HostData>(
    `/api/event/${code}/host`,
    `/api/event/${code}/stream`,
  );
  const [busy, setBusy] = useState(false);

  if (error === "unauthorized")
    return <Center>{t("common.unauthorized")}</Center>;
  if (!data) return <Center>{t("common.loadingPanel")}</Center>;

  const { event, participants, perItemResponses, results } = data;
  const modality = getModality(event.modality);

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  }

  async function removeParticipant(id: string, name: string) {
    if (!confirm(t("host.removeConfirm", { name }))) return;
    await run(async () => {
      await hostRemoveParticipant(code, id);
    });
  }

  return (
    <main className="bg-wine min-h-dvh px-5 py-8">
      {event.status === "revealed" && <Confetti />}
      <div className="mx-auto w-full max-w-2xl">
        <header className="mb-6 flex items-start justify-between gap-4">
          <div>
            <Link href="/" className="text-xs text-marfil/50 hover:text-marfil">
              Copa Ciega
            </Link>
            <h1 className="text-2xl font-bold text-marfil">{event.title}</h1>
            <p className="text-sm text-marfil/60">
              {modality.emoji} {getModalityLabel(event.modality, locale)} ·{" "}
              {t("host.wineCount", { count: event.itemCount })}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <StatusPill status={event.status} t={t} />
            <LanguageSwitcher dark />
            <a
              href={`/tv/${code}`}
              target="_blank"
              rel="noopener"
              className="rounded-full border border-white/15 px-3 py-1 text-xs text-marfil/70 hover:bg-white/10"
            >
              {t("host.tvMode")}
            </a>
          </div>
        </header>

        {/* LOBBY */}
        {event.status === "lobby" && (
          <div className="space-y-6">
            <Card className="bg-wine border-white/10 p-6">
              <QRShare url={joinUrl} code={event.code} />
            </Card>

            <SosCard recoveryCode={event.recoveryCode} t={t} />

            <div className="ticket-perforation" />

            <ModeBadges doubleBlind={event.doubleBlind} freePace={event.freePace} t={t} />

            <ParticipantsCard participants={participants} onRemove={removeParticipant} busy={busy} t={t} />

            <Button
              variant="gold"
              size="lg"
              className="w-full"
              disabled={busy || participants.length === 0}
              onClick={() => run(() => hostSetStatus(code, "tasting"))}
            >
              {participants.length === 0 ? t("host.waitingParticipants") : t("host.startTasting")}
            </Button>
          </div>
        )}

        {/* TASTING */}
        {event.status === "tasting" && (
          <div className="space-y-5">
            {event.freePace ? (
              <Card className="p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-negro">{t("host.freePaceTitle")}</p>
                  <Badge>{t("host.winesOpen", { count: event.itemCount })}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted">{t("host.freePaceHostDesc")}</p>
              </Card>
            ) : (
              <Card className="p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted">{t("host.activeWine")}</p>
                  <Badge>
                    {event.currentIndex + 1} / {event.itemCount}
                  </Badge>
                </div>
                <p className="mt-1 text-3xl font-bold text-burdeo">
                  {t("host.wineLabel", { n: event.currentIndex + 1 })}
                </p>
                <p className="mt-1 text-xs text-muted">{t("host.blindVoting")}</p>
                <div className="mt-4 flex items-center gap-3">
                  <Button
                    variant="outline"
                    disabled={busy || event.currentIndex === 0}
                    onClick={() => run(() => hostSetIndex(code, event.currentIndex - 1))}
                  >
                    {t("host.prev")}
                  </Button>
                  <Button
                    variant="primary"
                    className="flex-1"
                    disabled={busy || event.currentIndex >= event.itemCount - 1}
                    onClick={() => run(() => hostSetIndex(code, event.currentIndex + 1))}
                  >
                    {t("host.nextWine")}
                  </Button>
                </div>
              </Card>
            )}

            <LiveStatsPanel code={code} />

            <ItemEditor code={code} items={data.items} modalityKey={event.modality} t={t} />

            <Button
              variant="outline"
              className="w-full border-dorado/50 text-marfil hover:bg-white/10"
              disabled={busy}
              onClick={() => run(async () => { await hostAddItem(code); })}
            >
              {t("host.addWine")}
            </Button>

            <Card className="p-5">
              <p className="mb-3 text-sm font-semibold text-negro">{t("host.responsesPerWine")}</p>
              <div className="space-y-2">
                {perItemResponses.map((r) => (
                  <div key={r.itemId} className="flex items-center gap-3">
                    <span className="w-6 text-xs text-muted">#{r.position}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-black/5">
                      <div
                        className="h-full rounded-full bg-dorado transition-all"
                        style={{
                          width: `${participants.length ? (r.responses / participants.length) * 100 : 0}%`,
                        }}
                      />
                    </div>
                    <span className="w-12 text-right text-xs text-muted">
                      {r.responses}/{participants.length}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            <ParticipantsCard
              participants={participants}
              onRemove={removeParticipant}
              busy={busy}
              canJoin
              t={t}
            />

            <Button
              variant="gold"
              size="lg"
              className="w-full"
              disabled={busy}
              onClick={() => run(() => hostSetStatus(code, "closed"))}
            >
              {t("host.closeVoting")}
            </Button>
          </div>
        )}

        {/* CLOSED */}
        {event.status === "closed" && (
          <div className="space-y-5">
            <Card className="p-6 text-center">
              <p className="text-lg font-semibold text-negro">{t("host.votingClosedTitle")}</p>
              <p className="mt-1 text-sm text-muted">
                {t("host.participatedOf", {
                  responded: results.responded,
                  total: participants.length,
                  evals: results.totalEvaluations,
                })}
              </p>
              <p className="mt-4 text-sm text-muted">
                {event.doubleBlind ? t("host.doubleBlindCloseHint") : t("host.readyToReveal")}
              </p>
              <Button
                variant="gold"
                size="lg"
                className="mt-4 w-full animate-pulse-ring"
                disabled={busy}
                onClick={() => run(() => hostSetStatus(code, "revealed"))}
              >
                {t("host.revealButton")}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 text-muted"
                disabled={busy}
                onClick={() => run(() => hostSetStatus(code, "tasting"))}
              >
                {t("host.reopenVoting")}
              </Button>
            </Card>

            <ItemEditor code={code} items={data.items} modalityKey={event.modality} t={t} />
          </div>
        )}

        {/* REVEALED */}
        {event.status === "revealed" && (
          <div className="space-y-5">
            <RankingCard results={results} showNames t={t} />
            <div className="grid gap-3 sm:grid-cols-3">
              <HighlightCard title={t("host.winner")} stat={results.ranking[0]} metric="nota" />
              <HighlightCard title={t("host.bestValue")} stat={results.bestValue} metric="valor" />
              <HighlightCard title={t("host.mostDivisive")} stat={results.mostDivisive} metric="dispersión" />
            </div>
            <Link href={`/results/${code}`}>
              <Button variant="outline" className="w-full">
                {t("host.viewFullResults")}
              </Button>
            </Link>

            <Card className="p-5">
              <p className="mb-3 text-sm font-semibold text-negro">{t("host.export")}</p>
              <div className="grid gap-2 sm:grid-cols-3">
                <a href={`/api/event/${code}/export?format=summary`} download>
                  <Button variant="outline" size="sm" className="w-full">
                    {t("host.exportSummary")}
                  </Button>
                </a>
                <a href={`/api/event/${code}/export?format=raw`} download>
                  <Button variant="outline" size="sm" className="w-full">
                    {t("host.exportRaw")}
                  </Button>
                </a>
                <a href={`/results/${code}?print=1`} target="_blank" rel="noopener">
                  <Button variant="outline" size="sm" className="w-full">
                    {t("host.exportPdf")}
                  </Button>
                </a>
              </div>
            </Card>
          </div>
        )}
      </div>
    </main>
  );
}

type T = (key: string, vars?: Record<string, string | number>) => string;

function StatusPill({ status, t }: { status: EventStatus; t: T }) {
  const map: Record<EventStatus, string> = {
    lobby: t("host.statusLobby"),
    tasting: t("host.statusTasting"),
    closed: t("host.statusClosed"),
    revealed: t("host.statusRevealed"),
  };
  return (
    <span className="rounded-full border border-dorado/40 bg-dorado/10 px-3 py-1 text-xs font-medium text-dorado">
      {map[status]}
    </span>
  );
}

function ParticipantsCard({
  participants,
  onRemove,
  busy,
  canJoin,
  t,
}: {
  participants: { id: string; name: string }[];
  onRemove?: (id: string, name: string) => void;
  busy?: boolean;
  canJoin?: boolean;
  t: T;
}) {
  return (
    <Card className="p-5">
      <p className="mb-1 text-sm font-semibold text-negro">
        {t("host.tasters")} <span className="text-muted">({participants.length})</span>
      </p>
      {canJoin && <p className="mb-3 text-xs text-muted">{t("host.lateJoinHint")}</p>}
      {participants.length === 0 ? (
        <p className="text-sm text-muted">{t("host.noOneYet")}</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {participants.map((p) => (
            <span
              key={p.id}
              className="animate-pop inline-flex items-center gap-1.5 rounded-full bg-burdeo/10 py-1 pl-3 pr-1 text-sm font-medium text-burdeo"
            >
              {p.name}
              {onRemove && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onRemove(p.id, p.name)}
                  aria-label={t("host.removeAria", { name: p.name })}
                  className="flex h-5 w-5 items-center justify-center rounded-full text-burdeo/60 hover:bg-burdeo hover:text-marfil disabled:opacity-40"
                >
                  ×
                </button>
              )}
            </span>
          ))}
        </div>
      )}
    </Card>
  );
}

function SosCard({ recoveryCode, t }: { recoveryCode: string; t: T }) {
  return (
    <Card className="border-dorado/40 bg-dorado/10 p-5">
      <p className="text-sm font-semibold text-burdeo">{t("host.sosTitle")}</p>
      <p className="mt-1 text-xs text-negro/70">{t("host.sosDesc")}</p>
      <p className="mt-3 select-all rounded-lg bg-white px-4 py-2 text-center font-mono text-2xl font-bold tracking-[0.25em] text-burdeo">
        {recoveryCode || "—"}
      </p>
    </Card>
  );
}

function ModeBadges({ doubleBlind, freePace, t }: { doubleBlind: boolean; freePace: boolean; t: T }) {
  if (!doubleBlind && !freePace) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {doubleBlind && <Badge>{t("host.doubleBlindBadge")}</Badge>}
      {freePace && <Badge>{t("host.freePaceBadge")}</Badge>}
    </div>
  );
}

function ItemEditor({
  code,
  items,
  modalityKey,
  t,
}: {
  code: string;
  items: HostItem[];
  modalityKey: string;
  t: T;
}) {
  return (
    <Card className="p-5">
      <p className="mb-1 text-sm font-semibold text-negro">{t("host.itemEditorTitle")}</p>
      <p className="mb-3 text-xs text-muted">{t("host.itemEditorDesc")}</p>
      <div className="space-y-3">
        {items.map((it) => (
          <ItemRow key={it.id} code={code} item={it} modalityKey={modalityKey} t={t} />
        ))}
      </div>
    </Card>
  );
}

function ItemRow({
  code,
  item,
  modalityKey,
  t,
}: {
  code: string;
  item: HostItem;
  modalityKey: string;
  t: T;
}) {
  const [name, setName] = useState(item.name);
  const [producer, setProducer] = useState(item.producer ?? "");
  const [grape, setGrape] = useState(item.grape ?? "");
  const [price, setPrice] = useState<string>(item.price != null ? String(item.price) : "");
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");
  const isTinto = modalityKey === "tinto";

  async function save() {
    setState("saving");
    await hostUpdateItem(code, item.id, {
      name,
      producer,
      grape,
      price: price === "" ? null : Number(price),
    });
    setState("saved");
    setTimeout(() => setState("idle"), 1500);
  }

  const input =
    "rounded-lg border border-[var(--border)] bg-white px-2.5 py-1.5 text-sm text-negro outline-none focus:border-dorado";

  return (
    <div className="rounded-xl border border-[var(--border)] p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold text-burdeo">{t("host.wineLabel", { n: item.position })}</span>
        <button
          type="button"
          onClick={save}
          disabled={state === "saving"}
          className="rounded-full bg-burdeo px-3 py-1 text-xs font-medium text-marfil disabled:opacity-50"
        >
          {state === "saving" ? t("common.saving") : state === "saved" ? t("common.saved") : t("common.save")}
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input
          className={input + " col-span-2"}
          placeholder={t("host.namePlaceholder")}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className={input}
          placeholder={t("host.producerPlaceholder")}
          value={producer}
          onChange={(e) => setProducer(e.target.value)}
        />
        {isTinto ? (
          <select className={input} value={grape} onChange={(e) => setGrape(e.target.value)}>
            <option value="">{t("host.grapeSelectDefault")}</option>
            {CHILEAN_RED_GRAPES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        ) : (
          <input
            className={input}
            placeholder={t("host.grapePlaceholder")}
            value={grape}
            onChange={(e) => setGrape(e.target.value)}
          />
        )}
        <input
          className={input + " col-span-2"}
          type="number"
          inputMode="numeric"
          placeholder={t("host.pricePlaceholder")}
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
      </div>
    </div>
  );
}

function RankingCard({ results, showNames, t }: { results: EventResults; showNames?: boolean; t: T }) {
  return (
    <Card className="p-5">
      <p className="mb-3 text-sm font-semibold text-negro">{t("host.ranking")}</p>
      <div className="space-y-2">
        {results.ranking.map((s, i) => (
          <div key={s.item.id} className="flex items-center gap-3">
            <span className="w-6 text-center text-lg">
              {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
            </span>
            <div className="flex-1">
              <p className="text-sm font-medium text-negro">
                {showNames ? s.item.name : t("host.wineLabel", { n: s.item.position })}
              </p>
              {showNames && (s.item.producer || s.item.price) && (
                <p className="text-xs text-muted">
                  {s.item.producer}
                  {s.item.producer && s.item.price ? " · " : ""}
                  {s.item.price ? formatCLP(s.item.price) : ""}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="font-bold text-burdeo">{s.avgOverall.toFixed(0)}</p>
              <p className="text-[10px] text-muted">{t("host.votesCount", { count: s.count })}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function HighlightCard({
  title,
  stat,
  metric,
}: {
  title: string;
  stat: EventResults["ranking"][number] | null;
  metric: string;
}) {
  return (
    <Card className="p-4">
      <p className="text-xs text-muted">{title}</p>
      {stat ? (
        <>
          <p className="mt-1 truncate text-sm font-semibold text-negro">{stat.item.name}</p>
          <p className="text-xs text-burdeo">
            {metric === "nota" && `${stat.avgOverall.toFixed(0)} pts`}
            {metric === "valor" && (stat.valueScore ? `${stat.valueScore.toFixed(1)} pts/mil` : "—")}
            {metric === "dispersión" && `±${stat.stdDev.toFixed(1)}`}
          </p>
        </>
      ) : (
        <p className="mt-1 text-sm text-muted">—</p>
      )}
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
