import * as store from "./store";
import type { TastingItem } from "./types";

export interface ItemStat {
  item: TastingItem;
  count: number; // nº de evaluaciones
  avgOverall: number; // 0-100
  avgAroma: number;
  avgFlavor: number;
  avgBalance: number;
  stdDev: number; // dispersión de la nota general (divisividad)
  wouldBuyPct: number; // % que compraría
  valueScore: number | null; // calidad / precio
}

export interface EventResults {
  ranking: ItemStat[]; // ordenado por avgOverall desc
  mostDivisive: ItemStat | null;
  bestValue: ItemStat | null;
  surprise: ItemStat | null; // buena nota + precio bajo real
  totalEvaluations: number;
  participantCount: number;
  responded: number; // participantes con al menos una evaluación
}

function mean(xs: number[]): number {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
}
function std(xs: number[]): number {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  return Math.sqrt(mean(xs.map((x) => (x - m) ** 2)));
}

export async function computeResults(eventId: string): Promise<EventResults> {
  const [items, evals, participants] = await Promise.all([
    store.getItemsForEvent(eventId),
    store.getEvaluationsForEvent(eventId),
    store.getParticipantsForEvent(eventId),
  ]);

  const stats: ItemStat[] = items.map((item) => {
    const es = evals.filter((e) => e.itemId === item.id);
    const overalls = es.map((e) => e.overall);
    const avgOverall = mean(overalls);
    const wouldBuyVotes = es.filter((e) => e.wouldBuy !== null);
    const wouldBuyPct = wouldBuyVotes.length
      ? (wouldBuyVotes.filter((e) => e.wouldBuy).length / wouldBuyVotes.length) * 100
      : 0;
    const valueScore = item.price && item.price > 0 ? avgOverall / (item.price / 1000) : null;
    return {
      item,
      count: es.length,
      avgOverall,
      avgAroma: mean(es.map((e) => e.aroma)),
      avgFlavor: mean(es.map((e) => e.flavor)),
      avgBalance: mean(es.map((e) => e.balance)),
      stdDev: std(overalls),
      wouldBuyPct,
      valueScore,
    };
  });

  const rated = stats.filter((s) => s.count > 0);
  const ranking = [...stats].sort((a, b) => b.avgOverall - a.avgOverall);

  const mostDivisive = rated.length
    ? [...rated].sort((a, b) => b.stdDev - a.stdDev)[0]
    : null;

  const withValue = rated.filter((s) => s.valueScore !== null);
  const bestValue = withValue.length
    ? [...withValue].sort((a, b) => (b.valueScore ?? 0) - (a.valueScore ?? 0))[0]
    : null;

  // Sorpresa: mejor nota entre las de precio más bajo (mitad inferior de precios)
  const priced = rated.filter((s) => s.item.price != null);
  let surprise: ItemStat | null = null;
  if (priced.length >= 2) {
    const sortedByPrice = [...priced].sort((a, b) => (a.item.price ?? 0) - (b.item.price ?? 0));
    const cheaperHalf = sortedByPrice.slice(0, Math.ceil(sortedByPrice.length / 2));
    surprise = [...cheaperHalf].sort((a, b) => b.avgOverall - a.avgOverall)[0];
  }

  const responded = new Set(evals.map((e) => e.participantId)).size;

  return {
    ranking,
    mostDivisive,
    bestValue,
    surprise,
    totalEvaluations: evals.length,
    participantCount: participants.length,
    responded,
  };
}

export interface WineReportRow {
  position: number;
  name: string; // nombre revelado
  myGuess: string | null; // cepa/estimación que apostó
  realGrape: string | null;
  grapeHit: boolean | null; // null = sin cepa real o sin apuesta
  myPrice: number | null;
  realPrice: number | null;
}

export interface TasterProfile {
  participantId: string;
  name: string;
  evaluated: number;
  avgGiven: number; // qué tan generoso es
  generosityVsGroup: number; // + = puntúa más alto que el grupo
  priceAccuracy: number | null; // 0-100, precisión de precio estimado
  grapeHits: number; // aciertos de cepa/estimación (texto contiene)
  grapeGuesses: number; // cuántas veces intentó adivinar la cepa (con cepa real)
  radar: { aroma: number; flavor: number; balance: number };
  report: WineReportRow[]; // detalle por vino (informe de aciertos)
}

export async function computeTasterProfile(
  eventId: string,
  participantId: string,
): Promise<TasterProfile | null> {
  const p = await store.getParticipant(participantId);
  if (!p) return null;
  const [items, mine, all] = await Promise.all([
    store.getItemsForEvent(eventId),
    store.getEvaluationsForParticipant(eventId, participantId),
    store.getEvaluationsForEvent(eventId),
  ]);

  const avgGiven = mean(mine.map((e) => e.overall));
  const groupAvg = mean(all.map((e) => e.overall));

  // precisión de precio + aciertos de cepa + detalle por vino
  const priceErrors: number[] = [];
  let grapeHits = 0;
  let grapeGuesses = 0;
  const report: WineReportRow[] = [];
  for (const item of items) {
    const e = mine.find((x) => x.itemId === item.id);
    if (!e) continue;
    if (item.price && e.estimatedPrice) {
      const err = Math.abs(item.price - e.estimatedPrice) / item.price;
      priceErrors.push(Math.min(1, err));
    }
    let grapeHit: boolean | null = null;
    if (item.grape && e.estimatedGrape) {
      grapeGuesses++;
      const g = e.estimatedGrape.toLowerCase();
      const real = item.grape.toLowerCase();
      grapeHit = real.includes(g) || g.includes(real);
      if (grapeHit) grapeHits++;
    }
    report.push({
      position: item.position,
      name: item.name,
      myGuess: e.estimatedGrape || null,
      realGrape: item.grape,
      grapeHit,
      myPrice: e.estimatedPrice,
      realPrice: item.price,
    });
  }
  const priceAccuracy = priceErrors.length
    ? Math.round((1 - mean(priceErrors)) * 100)
    : null;

  return {
    participantId,
    name: p.name,
    evaluated: mine.length,
    avgGiven,
    generosityVsGroup: avgGiven - groupAvg,
    priceAccuracy,
    grapeHits,
    grapeGuesses,
    radar: {
      aroma: mean(mine.map((e) => e.aroma)),
      flavor: mean(mine.map((e) => e.flavor)),
      balance: mean(mine.map((e) => e.balance)),
    },
    report,
  };
}
