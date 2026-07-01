"use client";

import Link from "next/link";
import { usePolling } from "@/lib/usePolling";
import { getModality } from "@/lib/modalities";
import { Button, Card } from "@/components/ui";
import { EvaluationForm } from "./EvaluationForm";
import type { EvalInput } from "@/lib/actions";
import type { EventStatus } from "@/lib/types";

interface StateData {
  event: {
    code: string;
    title: string;
    modality: string;
    status: EventStatus;
    currentIndex: number;
    itemCount: number;
  };
  currentItemId: string | null;
  currentItemPosition: number | null;
  responsesForCurrent: number;
  participants: { name: string }[];
  myCurrentEval: Omit<EvalInput, "itemId"> | null;
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

  if (!data)
    return <Center>Cargando…</Center>;

  const { event } = data;
  const mod = getModality(modality);

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
              {event.currentIndex + 1}/{event.itemCount}
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

        {event.status === "tasting" && data.currentItemId && (
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
            subtitle="Evaluaste correctamente. Espera la gran revelación del anfitrión."
            extra={`Completaste ${data.myEvaluatedCount} de ${event.itemCount} muestras`}
          />
        )}

        {event.status === "revealed" && (
          <Card className="p-6 text-center">
            <div className="text-4xl">🎉</div>
            <p className="mt-2 text-lg font-bold text-negro">¡Resultados listos!</p>
            <p className="mt-1 text-sm text-muted">
              Descubre el ranking y tu perfil de catador.
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
