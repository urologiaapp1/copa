"use client";

import { useState } from "react";
import Link from "next/link";
import { usePolling } from "@/lib/usePolling";
import { getModality } from "@/lib/modalities";
import { Button, Card } from "@/components/ui";
import { EvaluationForm } from "./EvaluationForm";
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
  const { data } = usePolling<StateData>(`/api/event/${code}/state`, 2000);
  const [openItem, setOpenItem] = useState<string | null>(null);

  if (!data) return <Center>Cargando…</Center>;

  const { event } = data;
  const mod = getModality(modality);

  // El anfitrión eliminó a este catador (había sesión pero ya no existe)
  if (!data.stillHere) {
    return (
      <main className="bg-wine flex min-h-dvh items-center justify-center px-5">
        <Card className="max-w-sm p-8 text-center">
          <div className="text-4xl">👋</div>
          <p className="mt-2 text-lg font-bold text-negro">Ya no estás en esta cata</p>
          <p className="mt-1 text-sm text-muted">
            El anfitrión te quitó de la lista. Si es un error, vuelve a unirte.
          </p>
          <Link href={`/join/${code}`} className="mt-4 block">
            <Button variant="gold" className="w-full">
              Volver a unirme
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
              {mod.emoji} Hola, {name}
            </p>
          </div>
          {event.status === "tasting" && (
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-marfil/80">
              {data.myEvaluatedCount}/{event.itemCount} listos
            </span>
          )}
        </header>

        {event.status === "lobby" && (
          <Waiting
            title="Esperando al anfitrión"
            subtitle="La cata comenzará en breve. No cierres esta pantalla."
            extra={`${data.participants.length} personas conectadas`}
          />
        )}

        {/* TASTING — ritmo libre: lista de todos los vinos */}
        {event.status === "tasting" && event.freePace && (
          openItem ? (
            <div>
              <button
                onClick={() => setOpenItem(null)}
                className="mb-3 text-sm text-marfil/70 hover:text-marfil"
              >
                ← Volver a la lista
              </button>
              <EvaluationForm
                code={code}
                itemId={openItem}
                position={data.items.find((i) => i.id === openItem)?.position ?? 0}
                modalityKey={modality}
                initial={data.myEvalsById[openItem] ?? null}
              />
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-marfil/70">
                Evalúa los vinos en el orden que quieras. Puedes volver y cambiar tu nota cuando
                quieras.
              </p>
              <div className="space-y-2">
                {data.items.map((it) => {
                  const done = data.myEvalsById[it.id];
                  return (
                    <button
                      key={it.id}
                      onClick={() => setOpenItem(it.id)}
                      className="flex w-full items-center justify-between rounded-[var(--radius)] border border-[var(--border)] bg-card px-4 py-3 text-left transition-colors hover:border-dorado"
                    >
                      <span className="font-semibold text-negro">Vino {it.position}</span>
                      {done ? (
                        <span className="flex items-center gap-2 text-sm font-medium text-green-700">
                          {done.overall} pts
                          <span className="rounded-full bg-green-600 px-2 py-0.5 text-xs text-white">
                            ✓ editar
                          </span>
                        </span>
                      ) : (
                        <span className="rounded-full bg-burdeo px-2.5 py-0.5 text-xs font-medium text-marfil">
                          evaluar
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
          <EvaluationForm
            code={code}
            itemId={data.currentItemId}
            position={data.currentItemPosition ?? event.currentIndex + 1}
            modalityKey={modality}
            initial={data.myCurrentEval}
          />
        )}

        {event.status === "closed" && (
          <Waiting
            title="Votación cerrada"
            subtitle="Gracias por participar. Espera la gran revelación del anfitrión."
            extra={`Completaste ${data.myEvaluatedCount} de ${event.itemCount} vinos`}
          />
        )}

        {event.status === "revealed" && (
          <Card className="p-6 text-center">
            <div className="text-4xl">🎉</div>
            <p className="mt-2 text-lg font-bold text-negro">¡Resultados listos!</p>
            <p className="mt-1 text-sm text-muted">
              Descubre el ranking y tu informe de aciertos.
            </p>
            <Link href={`/results/${code}`} className="mt-4 block">
              <Button variant="gold" size="lg" className="w-full">
                Ver resultados
              </Button>
            </Link>
          </Card>
        )}
      </div>
    </main>
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
