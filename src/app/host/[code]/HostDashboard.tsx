"use client";

import { useState } from "react";
import Link from "next/link";
import { QRShare } from "@/components/QRShare";
import { Confetti } from "@/components/Confetti";
import { Button, Card, Badge } from "@/components/ui";
import { usePolling } from "@/lib/usePolling";
import { hostRemoveParticipant, hostSetIndex, hostSetStatus, hostUpdateItem } from "@/lib/actions";
import { getModality, CHILEAN_RED_GRAPES } from "@/lib/modalities";
import { formatCLP } from "@/lib/utils";
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
  const { data, error } = usePolling<HostData>(`/api/event/${code}/host`, 2000);
  const [busy, setBusy] = useState(false);

  if (error === "unauthorized")
    return <Center>No autorizado.</Center>;
  if (!data) return <Center>Cargando panel…</Center>;

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
    if (!confirm(`¿Eliminar a ${name} de la cata?`)) return;
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
              {modality.emoji} {modality.label} · {event.itemCount} muestras
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <StatusPill status={event.status} />
            <a
              href={`/tv/${code}`}
              target="_blank"
              rel="noopener"
              className="rounded-full border border-white/15 px-3 py-1 text-xs text-marfil/70 hover:bg-white/10"
            >
              📺 Modo TV
            </a>
          </div>
        </header>

        {/* LOBBY */}
        {event.status === "lobby" && (
          <div className="space-y-6">
            <Card className="bg-wine border-white/10 p-6">
              <QRShare url={joinUrl} code={event.code} />
            </Card>

            <SosCard recoveryCode={event.recoveryCode} />

            <ModeBadges doubleBlind={event.doubleBlind} freePace={event.freePace} />

            <ParticipantsCard participants={participants} onRemove={removeParticipant} busy={busy} />

            <Button
              variant="gold"
              size="lg"
              className="w-full"
              disabled={busy || participants.length === 0}
              onClick={() => run(() => hostSetStatus(code, "tasting"))}
            >
              {participants.length === 0 ? "Esperando participantes…" : "Iniciar cata"}
            </Button>
          </div>
        )}

        {/* TASTING */}
        {event.status === "tasting" && (
          <div className="space-y-5">
            {event.freePace ? (
              <Card className="p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-negro">Ritmo libre</p>
                  <Badge>{event.itemCount} vinos abiertos</Badge>
                </div>
                <p className="mt-1 text-xs text-muted">
                  Cada catador evalúa y edita los vinos que quiera, en cualquier orden. Cierra la
                  votación cuando estén listos.
                </p>
              </Card>
            ) : (
              <Card className="p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted">Muestra activa</p>
                  <Badge>
                    {event.currentIndex + 1} / {event.itemCount}
                  </Badge>
                </div>
                <p className="mt-1 text-3xl font-bold text-burdeo">
                  Muestra {event.currentIndex + 1}
                </p>
                <p className="mt-1 text-xs text-muted">
                  Los participantes puntúan sin ver el nombre real.
                </p>
                <div className="mt-4 flex items-center gap-3">
                  <Button
                    variant="outline"
                    disabled={busy || event.currentIndex === 0}
                    onClick={() => run(() => hostSetIndex(code, event.currentIndex - 1))}
                  >
                    ← Anterior
                  </Button>
                  <Button
                    variant="primary"
                    className="flex-1"
                    disabled={busy || event.currentIndex >= event.itemCount - 1}
                    onClick={() => run(() => hostSetIndex(code, event.currentIndex + 1))}
                  >
                    Siguiente muestra →
                  </Button>
                </div>
              </Card>
            )}

            {event.doubleBlind && (
              <ItemEditor code={code} items={data.items} modalityKey={event.modality} />
            )}

            <Card className="p-5">
              <p className="mb-3 text-sm font-semibold text-negro">Respuestas por vino</p>
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

            <ParticipantsCard participants={participants} onRemove={removeParticipant} busy={busy} canJoin />

            <Button
              variant="gold"
              size="lg"
              className="w-full"
              disabled={busy}
              onClick={() => run(() => hostSetStatus(code, "closed"))}
            >
              Cerrar votación
            </Button>
          </div>
        )}

        {/* CLOSED */}
        {event.status === "closed" && (
          <div className="space-y-5">
            <Card className="p-6 text-center">
              <p className="text-lg font-semibold text-negro">Votación cerrada</p>
              <p className="mt-1 text-sm text-muted">
                {results.responded} de {participants.length} participaron ·{" "}
                {results.totalEvaluations} evaluaciones
              </p>
              <p className="mt-4 text-sm text-muted">
                {event.doubleBlind
                  ? "Completa la info de cada vino y luego revela para enviar los informes de aciertos."
                  : "Cuando estén todos listos, revela los resultados."}
              </p>
              <Button
                variant="gold"
                size="lg"
                className="mt-4 w-full animate-pulse-ring"
                disabled={busy}
                onClick={() => run(() => hostSetStatus(code, "revealed"))}
              >
                🎉 Revelar resultados
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 text-muted"
                disabled={busy}
                onClick={() => run(() => hostSetStatus(code, "tasting"))}
              >
                Reabrir votación
              </Button>
            </Card>

            {event.doubleBlind && (
              <ItemEditor code={code} items={data.items} modalityKey={event.modality} />
            )}
          </div>
        )}

        {/* REVEALED */}
        {event.status === "revealed" && (
          <div className="space-y-5">
            <RankingCard results={results} showNames />
            <div className="grid gap-3 sm:grid-cols-3">
              <HighlightCard title="🏆 Ganador" stat={results.ranking[0]} metric="nota" />
              <HighlightCard title="💎 Mejor precio/calidad" stat={results.bestValue} metric="valor" />
              <HighlightCard title="⚡ Más divisivo" stat={results.mostDivisive} metric="dispersión" />
            </div>
            <Link href={`/results/${code}`}>
              <Button variant="outline" className="w-full">
                Ver resultados completos
              </Button>
            </Link>

            <Card className="p-5">
              <p className="mb-3 text-sm font-semibold text-negro">Exportar</p>
              <div className="grid gap-2 sm:grid-cols-3">
                <a href={`/api/event/${code}/export?format=summary`} download>
                  <Button variant="outline" size="sm" className="w-full">
                    📊 Resumen (Excel)
                  </Button>
                </a>
                <a href={`/api/event/${code}/export?format=raw`} download>
                  <Button variant="outline" size="sm" className="w-full">
                    📋 Datos (Excel)
                  </Button>
                </a>
                <a href={`/results/${code}?print=1`} target="_blank" rel="noopener">
                  <Button variant="outline" size="sm" className="w-full">
                    🖨️ PDF
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

function StatusPill({ status }: { status: EventStatus }) {
  const map: Record<EventStatus, string> = {
    lobby: "En sala de espera",
    tasting: "Cata en curso",
    closed: "Votación cerrada",
    revealed: "Resultados revelados",
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
}: {
  participants: { id: string; name: string }[];
  onRemove?: (id: string, name: string) => void;
  busy?: boolean;
  canJoin?: boolean;
}) {
  return (
    <Card className="p-5">
      <p className="mb-1 text-sm font-semibold text-negro">
        Catadores <span className="text-muted">({participants.length})</span>
      </p>
      {canJoin && (
        <p className="mb-3 text-xs text-muted">
          Los que lleguen tarde pueden unirse escaneando el QR mientras la cata siga abierta.
        </p>
      )}
      {participants.length === 0 ? (
        <p className="text-sm text-muted">Aún no se une nadie. Comparte el QR.</p>
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
                  aria-label={`Eliminar ${p.name}`}
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

function SosCard({ recoveryCode }: { recoveryCode: string }) {
  return (
    <Card className="border-dorado/40 bg-dorado/10 p-5">
      <p className="text-sm font-semibold text-burdeo">🆘 Tu código SOS de administrador</p>
      <p className="mt-1 text-xs text-negro/70">
        Guárdalo. Si pierdes el acceso (cambias de teléfono o se borra tu sesión), entra a{" "}
        <b>/recover</b> con el código del evento y este código para retomar el control.
      </p>
      <p className="mt-3 select-all rounded-lg bg-white px-4 py-2 text-center font-mono text-2xl font-bold tracking-[0.25em] text-burdeo">
        {recoveryCode || "—"}
      </p>
    </Card>
  );
}

function ModeBadges({ doubleBlind, freePace }: { doubleBlind: boolean; freePace: boolean }) {
  if (!doubleBlind && !freePace) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {doubleBlind && <Badge>👁️ Doble ciego</Badge>}
      {freePace && <Badge>🎯 Ritmo libre</Badge>}
    </div>
  );
}

function ItemEditor({
  code,
  items,
  modalityKey,
}: {
  code: string;
  items: HostItem[];
  modalityKey: string;
}) {
  return (
    <Card className="p-5">
      <p className="mb-1 text-sm font-semibold text-negro">Info de los vinos</p>
      <p className="mb-3 text-xs text-muted">
        Agrega o corrige la información de cada vino. Se revela junto con los resultados.
      </p>
      <div className="space-y-3">
        {items.map((it) => (
          <ItemRow key={it.id} code={code} item={it} modalityKey={modalityKey} />
        ))}
      </div>
    </Card>
  );
}

function ItemRow({
  code,
  item,
  modalityKey,
}: {
  code: string;
  item: HostItem;
  modalityKey: string;
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
        <span className="text-xs font-semibold text-burdeo">Vino {item.position}</span>
        <button
          type="button"
          onClick={save}
          disabled={state === "saving"}
          className="rounded-full bg-burdeo px-3 py-1 text-xs font-medium text-marfil disabled:opacity-50"
        >
          {state === "saving" ? "Guardando…" : state === "saved" ? "Guardado ✓" : "Guardar"}
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input className={input + " col-span-2"} placeholder="Nombre del vino" value={name} onChange={(e) => setName(e.target.value)} />
        <input className={input} placeholder="Productor / viña" value={producer} onChange={(e) => setProducer(e.target.value)} />
        {isTinto ? (
          <select className={input} value={grape} onChange={(e) => setGrape(e.target.value)}>
            <option value="">Cepa…</option>
            {CHILEAN_RED_GRAPES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        ) : (
          <input className={input} placeholder="Cepa / tipo" value={grape} onChange={(e) => setGrape(e.target.value)} />
        )}
        <input className={input + " col-span-2"} type="number" inputMode="numeric" placeholder="Precio (CLP)" value={price} onChange={(e) => setPrice(e.target.value)} />
      </div>
    </div>
  );
}

function RankingCard({ results, showNames }: { results: EventResults; showNames?: boolean }) {
  return (
    <Card className="p-5">
      <p className="mb-3 text-sm font-semibold text-negro">Ranking</p>
      <div className="space-y-2">
        {results.ranking.map((s, i) => (
          <div key={s.item.id} className="flex items-center gap-3">
            <span className="w-6 text-center text-lg">
              {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
            </span>
            <div className="flex-1">
              <p className="text-sm font-medium text-negro">
                {showNames ? s.item.name : `Muestra ${s.item.position}`}
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
              <p className="text-[10px] text-muted">{s.count} votos</p>
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
