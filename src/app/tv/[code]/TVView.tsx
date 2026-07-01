"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { usePolling } from "@/lib/usePolling";
import { getModality } from "@/lib/modalities";
import { Confetti } from "@/components/Confetti";
import { formatCLP } from "@/lib/utils";
import type { EventResults } from "@/lib/results";
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
  currentItemPosition: number | null;
  responsesForCurrent: number;
  participants: { name: string }[];
}
interface ResultsData {
  results: EventResults;
}

export function TVView({ code, joinUrl }: { code: string; joinUrl: string }) {
  const { data } = usePolling<StateData>(`/api/event/${code}/state`, 1500);
  const status = data?.event.status;
  // Sólo pedimos resultados cuando ya están revelados (endpoint público entonces)
  const { data: res } = usePolling<ResultsData>(
    status === "revealed" ? `/api/event/${code}/results` : null,
    2500,
  );

  if (!data)
    return <Screen><p className="text-3xl text-marfil/60">Cargando…</p></Screen>;

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
        <span className="text-xl text-marfil/60">
          {mod.emoji} {mod.label}
        </span>
      </div>

      {event.status === "lobby" && (
        <Lobby title={event.title} code={event.code} joinUrl={joinUrl} participants={participants} />
      )}

      {event.status === "tasting" && (
        <Tasting
          position={data.currentItemPosition ?? event.currentIndex + 1}
          total={event.itemCount}
          responses={data.responsesForCurrent}
          people={participants.length}
        />
      )}

      {event.status === "closed" && (
        <div className="flex flex-col items-center gap-6">
          <div className="h-20 w-20 animate-spin rounded-full border-8 border-dorado/30 border-t-dorado" />
          <p className="text-5xl font-bold text-marfil">Votación cerrada</p>
          <p className="text-2xl text-marfil/60">Preparando la gran revelación…</p>
        </div>
      )}

      {event.status === "revealed" && res && <Podium results={res.results} />}
    </Screen>
  );
}

function Lobby({
  title,
  code,
  joinUrl,
  participants,
}: {
  title: string;
  code: string;
  joinUrl: string;
  participants: { name: string }[];
}) {
  const [qr, setQr] = useState("");
  useEffect(() => {
    QRCode.toDataURL(joinUrl, { margin: 1, width: 640, color: { dark: "#14100f", light: "#fffdf8" } }).then(setQr);
  }, [joinUrl]);

  return (
    <div className="flex w-full max-w-6xl flex-col items-center gap-10 lg:flex-row lg:justify-between">
      <div className="text-center lg:text-left">
        <p className="text-2xl uppercase tracking-widest text-dorado">Escanea para unirte</p>
        <h1 className="mt-2 max-w-xl text-6xl font-extrabold leading-tight text-marfil">{title}</h1>
        <p className="mt-6 text-3xl text-marfil/70">Código</p>
        <p className="font-mono text-8xl font-bold tracking-[0.2em] text-dorado">{code}</p>
        <p className="mt-8 text-2xl text-marfil/60">
          {participants.length} {participants.length === 1 ? "persona conectada" : "personas conectadas"}
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
}: {
  position: number;
  total: number;
  responses: number;
  people: number;
}) {
  const pct = people ? Math.round((responses / people) * 100) : 0;
  const R = 130;
  const C = 2 * Math.PI * R;
  return (
    <div className="flex flex-col items-center gap-8">
      <p className="text-3xl uppercase tracking-widest text-dorado">Catando ahora</p>
      <p className="text-9xl font-extrabold text-marfil">
        Muestra {position}
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
          <span className="text-2xl text-marfil/50">de {people} votos</span>
        </div>
      </div>
    </div>
  );
}

function Podium({ results }: { results: EventResults }) {
  const top = results.ranking.slice(0, 3);
  const rest = results.ranking.slice(3);
  const order = [top[1], top[0], top[2]].filter(Boolean); // 2º, 1º, 3º
  const heights = ["h-48", "h-64", "h-36"];
  const medals = ["🥈", "🥇", "🥉"];
  const idxMap = [1, 0, 2];

  return (
    <div className="flex w-full max-w-6xl flex-col items-center gap-8">
      <h1 className="text-6xl font-extrabold text-marfil">🏆 Resultados</h1>
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
