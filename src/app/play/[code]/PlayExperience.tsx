"use client";

import { useState } from "react";
import Link from "next/link";
import { useLive } from "@/lib/useLive";
import { getModality } from "@/lib/modalities";
import { Button, Card } from "@/components/ui";
import { EvaluationForm } from "./EvaluationForm";
import { LiveStatsPanel } from "@/components/LiveStats";
import { TipBanner } from "@/components/TipBanner";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useI18n } from "@/lib/i18n/context";
import type { EvalInput } from "@/lib/actions";
import type { EventStatus } from "@/lib/types";

type EvalData = Omit<EvalInput, "itemId">;

interface StateData {
  event: {
    code: string;
    title: string;
    modality: string;
    status: EventStatus;
    currentIndex: number;
    itemCount: number;
    doubleBlind: boolean;
    freePace: boolean;
  };
  items: { id: string; position: number }[];
  currentItemId: string | null;
  currentItemPosition: number | null;
  responsesForCurrent: number;
  participants: { name: string }[];
  stillHere: boolean;
  myCurrentEval: EvalData | null;
  myEvalsById: Record<string, EvalData>;
  myEvaluatedCount: number;
}

export function PlayExperience({
  code,
  modality,
  name,
}: {
  code: string;
  modality: string;
  name: string;
}) {
  const { t } = useI18n();
  const { data } = useLive<StateData>(
    `/api/event/${code}/state`,
    `/api/event/${code}/stream`,
  );
  const [openItem, setOpenItem] = useState<string | null>(null);

  if (!data) return <Center>{t("common.loading")}</Center>;

  const { event } = data;
  const mod = getModality(modality);

  // El anfitrión eliminó a este catador (había sesión pero ya no existe)
  if (!data.stillHere) {
    return (
      <main className="bg-wine flex min-h-dvh items-center justify-center px-5">
        <Card className="max-w-sm p-8 text-center">
          <div className="text-4xl">👋</div>
          <p className="mt-2 text-lg font-bold text-negro">{t("play.removedTitle")}</p>
          <p className="mt-1 text-sm text-muted">{t("play.removedDesc")}</p>
          <Link href={`/join/${code}`} className="mt-4 block">
            <Button variant="gold" className="w-full">
              {t("play.rejoin")}
            </Button>
          </Link>
        </Card>
      </main>
    );
  }

  return (
    <main className="bg-wine min-h-dvh px-5 py-6">
      <div className="mx-auto w-full max-w-md">
        <header className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-marfil/50">{event.title}</p>
            <p className="text-sm font-semibold text-marfil">
              {mod.emoji} {t("play.hello", { name })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {event.status === "tasting" && (
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-marfil/80">
                {t("play.readyOf", { done: data.myEvaluatedCount, total: event.itemCount })}
              </span>
            )}
            <LanguageSwitcher dark />
          </div>
        </header>

        {event.status === "lobby" && (
          <div className="space-y-4">
            <Waiting
              title={t("play.waitingHostTitle")}
              subtitle={t("play.waitingHostSubtitle")}
              extra={t("play.peopleConnected", { count: data.participants.length })}
            />
            <TipBanner />
          </div>
        )}

        {/* TASTING — ritmo libre: lista de todos los vinos */}
        {event.status === "tasting" && event.freePace && (
          openItem ? (
            <div className="space-y-4">
              <BackToListButton
                label={t("play.backToList")}
                onClick={() => {
                  setOpenItem(null);
                  window.scrollTo({ top: 0 });
                }}
              />
              <EvaluationForm
                code={code}
                itemId={openItem}
                position={data.items.find((i) => i.id === openItem)?.position ?? 0}
                modalityKey={modality}
                initial={data.myEvalsById[openItem] ?? null}
              />
              <BackToListButton
                label={t("play.backToList")}
                onClick={() => {
                  setOpenItem(null);
                  window.scrollTo({ top: 0 });
                }}
              />
            </div>
          ) : (
            <div className="space-y-3">
              <LiveStatsPanel code={code} dark />
              <p className="text-sm text-marfil/70">{t("play.freePaceHint")}</p>
              <div className="space-y-2">
                {data.items.map((it) => {
                  const done = data.myEvalsById[it.id];
                  return (
                    <button
                      key={it.id}
                      onClick={() => {
                        setOpenItem(it.id);
                        window.scrollTo({ top: 0 });
                      }}
                      className="flex w-full items-center justify-between rounded-[var(--radius)] border border-[var(--border)] bg-card px-4 py-3 text-left transition-colors hover:border-dorado"
                    >
                      <span className="font-semibold text-negro">
                        {t("host.wineLabel", { n: it.position })}
                      </span>
                      {done ? (
                        <span className="flex items-center gap-2 text-sm font-medium text-green-700">
                          {done.overall} pts
                          <span className="rounded-full bg-green-600 px-2 py-0.5 text-xs text-white">
                            {t("play.edit")}
                          </span>
                        </span>
                      ) : (
                        <span className="rounded-full bg-burdeo px-2.5 py-0.5 text-xs font-medium text-marfil">
                          {t("play.evaluate")}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )
        )}

        {/* TASTING — modo guiado: solo el vino activo */}
        {event.status === "tasting" && !event.freePace && data.currentItemId && (
          <div className="space-y-4">
            <LiveStatsPanel code={code} dark />
            <EvaluationForm
              code={code}
              itemId={data.currentItemId}
              position={data.currentItemPosition ?? event.currentIndex + 1}
              modalityKey={modality}
              initial={data.myCurrentEval}
            />
          </div>
        )}

        {event.status === "closed" && (
          <div className="space-y-4">
            <Waiting
              title={t("play.votingClosedTitle")}
              subtitle={t("play.votingClosedSubtitle")}
              extra={t("play.completedOf", { done: data.myEvaluatedCount, total: event.itemCount })}
            />
            <LiveStatsPanel code={code} />
            <TipBanner />
          </div>
        )}

        {event.status === "revealed" && (
          <Card className="p-6 text-center">
            <div className="text-4xl">🎉</div>
            <p className="mt-2 text-lg font-bold text-negro">{t("play.resultsReadyTitle")}</p>
            <p className="mt-1 text-sm text-muted">{t("play.resultsReadyDesc")}</p>
            <Link href={`/results/${code}`} className="mt-4 block">
              <Button variant="gold" size="lg" className="w-full">
                {t("play.viewResults")}
              </Button>
            </Link>
          </Card>
        )}
      </div>
    </main>
  );
}

/** Botón formal para volver a la lista de vinos (estilo ticket, ancho completo). */
function BackToListButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-center gap-2 rounded-[var(--radius)] border-[1.5px] border-dashed border-dorado/50 bg-white/5 px-4 py-3 text-[13px] font-bold uppercase tracking-widest text-marfil transition-all hover:border-dorado hover:bg-white/10 active:scale-[0.99]"
    >
      {label}
    </button>
  );
}

function Waiting({
  title,
  subtitle,
  extra,
}: {
  title: string;
  subtitle: string;
  extra?: string;
}) {
  return (
    <Card className="bg-card p-8 text-center">
      <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-dorado/30 border-t-dorado" />
      <p className="text-lg font-bold text-negro">{title}</p>
      <p className="mt-1 text-sm text-muted">{subtitle}</p>
      {extra && <p className="mt-3 text-xs text-burdeo">{extra}</p>}
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
