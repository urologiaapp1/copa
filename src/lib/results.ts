import * as store from "./store";
import type { TastingItem } from "./types";

export interface ItemStat {
  item: TastingItem;
  count: number; // nº de evaluaciones
  avgOverall: number; // 0-100
  avgAcidity: number; // 1 débil ↔ 10 ácido
  avgSweetness: number; // 1 seco ↔ 10 dulce
  avgTannin: number; // 1 suave ↔ 10 tánico
  avgBody: number; // 1 ligero ↔ 10 poderoso
  stdDev: number; // dispersión de la nota (divisividad)
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
    const valueScore = item.price && item.price > 0 ? avgOverall / (item.price / 1000) : null;
    return {
      item,
      count: es.length,
      avgOverall,
      avgAcidity: mean(es.map((e) => e.acidity)),
      avgSweetness: mean(es.map((e) => e.sweetness)),
      avgTannin: mean(es.map((e) => e.tannin)),
      avgBody: mean(es.map((e) => e.body)),
      stdDev: std(overalls),
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

// ---------- Estadísticas en vivo (mientras ocurre la cata) ----------
export interface LiveStats {
  totalEvaluations: number;
  mostActive: { name: string; count: number } | null; // más ha punteado
  highestPricer: { name: string; avgPrice: number } | null; // precios más altos
  mostGenerous: { name: string; avgOverall: number } | null; // mejor valora los vinos
  toughestCritic: { name: string; avgOverall: number } | null; // el más exigente
  mostAcidFinder: { name: string; avg: number } | null; // más ácidos los encuentra
  mostSweetFinder: { name: string; avg: number } | null; // más dulces los encuentra
  mostPowerfulFinder: { name: string; avg: number } | null; // más vinos poderosos
  secretKeeper: { name: string } | null; // al azar (estable por evento), puro humor
}

export async function computeLiveStats(eventId: string): Promise<LiveStats> {
  const [evals, participants] = await Promise.all([
    store.getEvaluationsForEvent(eventId),
    store.getParticipantsForEvent(eventId),
  ]);

  const empty: LiveStats = {
    totalEvaluations: 0,
    mostActive: null,
    highestPricer: null,
    mostGenerous: null,
    toughestCritic: null,
    mostAcidFinder: null,
    mostSweetFinder: null,
    mostPowerfulFinder: null,
    secretKeeper: null,
  };
  if (evals.length === 0) return empty;

  const nameOf = (id: string) => participants.find((p) => p.id === id)?.name ?? "Alguien";
  const byParticipant = new Map<string, typeof evals>();
  for (const e of evals) {
    const list = byParticipant.get(e.participantId) ?? [];
    list.push(e);
    byParticipant.set(e.participantId, list);
  }

  let mostActive: LiveStats["mostActive"] = null;
  let highestPricer: LiveStats["highestPricer"] = null;
  let mostGenerous: LiveStats["mostGenerous"] = null;
  let toughestCritic: LiveStats["toughestCritic"] = null;
  let mostAcidFinder: LiveStats["mostAcidFinder"] = null;
  let mostSweetFinder: LiveStats["mostSweetFinder"] = null;
  let mostPowerfulFinder: LiveStats["mostPowerfulFinder"] = null;

  for (const [pid, list] of byParticipant) {
    const name = nameOf(pid);
    if (!mostActive || list.length > mostActive.count) mostActive = { name, count: list.length };

    const prices = list.map((e) => e.estimatedPrice).filter((p): p is number => p != null);
    if (prices.length) {
      const avgPrice = mean(prices);
      if (!highestPricer || avgPrice > highestPricer.avgPrice) highestPricer = { name, avgPrice };
    }

    const avgOverall = mean(list.map((e) => e.overall));
    if (!mostGenerous || avgOverall > mostGenerous.avgOverall) mostGenerous = { name, avgOverall };
    if (!toughestCritic || avgOverall < toughestCritic.avgOverall) toughestCritic = { name, avgOverall };

    const avgAcidity = mean(list.map((e) => e.acidity));
    if (!mostAcidFinder || avgAcidity > mostAcidFinder.avg) mostAcidFinder = { name, avg: avgAcidity };
    const avgSweetness = mean(list.map((e) => e.sweetness));
    if (!mostSweetFinder || avgSweetness > mostSweetFinder.avg)
      mostSweetFinder = { name, avg: avgSweetness };
    const avgBody = mean(list.map((e) => e.body));
    if (!mostPowerfulFinder || avgBody > mostPowerfulFinder.avg)
      mostPowerfulFinder = { name, avg: avgBody };
  }

  // "El que esconde un secreto": participante al azar pero estable durante el
  // evento (semilla = id del evento), así el chiste apunta a la misma persona
  // toda la noche.
  let secretKeeper: LiveStats["secretKeeper"] = null;
  if (participants.length > 0) {
    let seed = 0;
    for (const ch of eventId) seed = (seed * 31 + ch.charCodeAt(0)) % 100003;
    secretKeeper = { name: participants[seed % participants.length].name };
  }

  return {
    totalEvaluations: evals.length,
    mostActive,
    highestPricer,
    mostGenerous,
    toughestCritic,
    mostAcidFinder,
    mostSweetFinder,
    mostPowerfulFinder,
    secretKeeper,
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
  radar: { acidity: number; sweetness: number; tannin: number; body: number };
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
      acidity: mean(mine.map((e) => e.acidity)),
      sweetness: mean(mine.map((e) => e.sweetness)),
      tannin: mean(mine.map((e) => e.tannin)),
      body: mean(mine.map((e) => e.body)),
    },
    report,
  };
}

// ---------- Ranking de catadores (resultados finales) ----------
export interface TasterLeaderboardRow {
  participantId: string;
  name: string;
  evaluated: number;
  priceAccuracy: number | null;
  grapeHits: number;
  grapeGuesses: number;
}

export interface TasterLeaderboard {
  rows: TasterLeaderboardRow[];
  bestPriceGuesser: TasterLeaderboardRow | null; // se acercó más al valor real
  bestGrapeGuesser: TasterLeaderboardRow | null; // acertó más cepas
}

export async function computeTasterLeaderboard(eventId: string): Promise<TasterLeaderboard> {
  const participants = await store.getParticipantsForEvent(eventId);
  const rows = (
    await Promise.all(
      participants.map(async (p): Promise<TasterLeaderboardRow | null> => {
        const profile = await computeTasterProfile(eventId, p.id);
        if (!profile || profile.evaluated === 0) return null;
        return {
          participantId: p.id,
          name: p.name,
          evaluated: profile.evaluated,
          priceAccuracy: profile.priceAccuracy,
          grapeHits: profile.grapeHits,
          grapeGuesses: profile.grapeGuesses,
        };
      }),
    )
  ).filter((r): r is TasterLeaderboardRow => r !== null);

  const withPrice = rows.filter((r) => r.priceAccuracy !== null);
  const bestPriceGuesser = withPrice.length
    ? [...withPrice].sort((a, b) => (b.priceAccuracy ?? 0) - (a.priceAccuracy ?? 0))[0]
    : null;

  const withGrapes = rows.filter((r) => r.grapeGuesses > 0);
  const bestGrapeGuesser = withGrapes.length
    ? [...withGrapes].sort(
        (a, b) => b.grapeHits - a.grapeHits || b.grapeHits / b.grapeGuesses - a.grapeHits / a.grapeGuesses,
      )[0]
    : null;

  return { rows, bestPriceGuesser, bestGrapeGuesser };
}
