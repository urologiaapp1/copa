"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePolling } from "@/lib/usePolling";
import { Button, Card } from "@/components/ui";
import { Confetti } from "@/components/Confetti";
import { formatCLP } from "@/lib/utils";
import type { EventResults, TasterProfile } from "@/lib/results";

interface Payload {
  event: { code: string; title: string; modality: string; status: string };
  results: EventResults;
  profile: TasterProfile | null;
}

export function ResultsView({ code, print = false }: { code: string; print?: boolean }) {
  const { data, error } = usePolling<Payload>(`/api/event/${code}/results`, 4000);
  const printed = useRef(false);

  useEffect(() => {
    if (print && data && !printed.current) {
      printed.current = true;
      const t = setTimeout(() => window.print(), 500);
      return () => clearTimeout(t);
    }
  }, [print, data]);

  if (error === "not_revealed")
    return (
      <Center>
        <Card className="max-w-sm p-8 text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-dorado/30 border-t-dorado" />
          <p className="font-semibold text-negro">Aún no se revelan los resultados</p>
          <p className="mt-1 text-sm text-muted">El anfitrión los revelará pronto.</p>
        </Card>
      </Center>
    );
  if (!data) return <Center>Cargando resultados…</Center>;

  const { results, profile } = data;

  return (
    <main className="bg-wine min-h-dvh px-5 py-8 print:bg-white print:py-2">
      {!print && <Confetti />}
      <div className="mx-auto w-full max-w-2xl space-y-5">
        <header className="text-center">
          <p className="text-xs uppercase tracking-widest text-dorado">Resultados</p>
          <h1 className="text-2xl font-bold text-marfil print:text-negro">{data.event.title}</h1>
          <p className="mt-1 text-sm text-marfil/60 print:text-negro/60">
            {results.responded} participaron · {results.totalEvaluations} evaluaciones
          </p>
        </header>

        {/* Podio */}
        <div className="grid gap-3 sm:grid-cols-3">
          <Highlight title="🏆 Ganador" name={results.ranking[0]?.item.name} sub={
            results.ranking[0] ? `${results.ranking[0].avgOverall.toFixed(0)} pts` : undefined
          } />
          <Highlight
            title="💎 Precio/calidad"
            name={results.bestValue?.item.name}
            sub={results.bestValue?.item.price ? formatCLP(results.bestValue.item.price) : undefined}
          />
          <Highlight
            title="⚡ Más divisivo"
            name={results.mostDivisive?.item.name}
            sub={results.mostDivisive ? `±${results.mostDivisive.stdDev.toFixed(1)}` : undefined}
          />
        </div>

        {results.surprise && (
          <Card className="border-dorado/40 bg-dorado/10 p-4">
            <p className="text-sm">
              <span className="font-semibold text-burdeo">🎈 Sorpresa de la noche:</span>{" "}
              <span className="text-negro">{results.surprise.item.name}</span> obtuvo{" "}
              {results.surprise.avgOverall.toFixed(0)} pts siendo de las más económicas
              {results.surprise.item.price ? ` (${formatCLP(results.surprise.item.price)})` : ""}.
            </p>
          </Card>
        )}

        {/* Ranking completo */}
        <Card className="p-5">
          <p className="mb-3 text-sm font-semibold text-negro">Ranking completo</p>
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
                      {s.wouldBuyPct > 0 ? ` · ${s.wouldBuyPct.toFixed(0)}% compraría` : ""}
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

        {/* Perfil del catador */}
        {profile && profile.evaluated > 0 && <ProfileCard profile={profile} />}

        <Link href="/" className="block print:hidden">
          <Button variant="outline" className="w-full">
            Crear otra cata
          </Button>
        </Link>
      </div>
    </main>
  );
}

function ProfileCard({ profile }: { profile: TasterProfile }) {
  const gen = profile.generosityVsGroup;
  return (
    <Card className="p-5">
      <p className="mb-1 text-sm font-semibold text-negro">Tu perfil de catador</p>
      <p className="mb-4 text-xs text-muted">{profile.name}</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Muestras" value={String(profile.evaluated)} />
        <Stat label="Nota media" value={profile.avgGiven.toFixed(0)} />
        <Stat
          label="Vs. grupo"
          value={`${gen >= 0 ? "+" : ""}${gen.toFixed(0)}`}
          hint={gen >= 3 ? "Generoso" : gen <= -3 ? "Exigente" : "Equilibrado"}
        />
        <Stat
          label="Precisión precio"
          value={profile.priceAccuracy != null ? `${profile.priceAccuracy}%` : "—"}
        />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3">
        <RadarBar label="Aroma" value={profile.radar.aroma} />
        <RadarBar label="Sabor" value={profile.radar.flavor} />
        <RadarBar label="Equilibrio" value={profile.radar.balance} />
      </div>
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

function Highlight({ title, name, sub }: { title: string; name?: string; sub?: string }) {
  return (
    <Card className="p-4">
      <p className="text-xs text-muted">{title}</p>
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
