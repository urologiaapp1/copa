import type {
  Evaluation,
  Participant,
  TastingEvent,
  TastingItem,
} from "../types";

/**
 * Backend en memoria para desarrollo sin base de datos. Persiste dentro del
 * proceso de Node (sobrevive a HMR gracias al guard en globalThis). Cumple la
 * misma API asíncrona que el backend de Supabase.
 */
interface DB {
  events: Map<string, TastingEvent>;
  items: Map<string, TastingItem>;
  participants: Map<string, Participant>;
  evaluations: Map<string, Evaluation>;
}

const g = globalThis as unknown as { __copaCiegaDB?: DB };

const db: DB =
  g.__copaCiegaDB ??
  (g.__copaCiegaDB = {
    events: new Map(),
    items: new Map(),
    participants: new Map(),
    evaluations: new Map(),
  });

// ---- Events ----
export async function insertEvent(e: TastingEvent) {
  db.events.set(e.id, e);
}
export async function getEventByCode(code: string): Promise<TastingEvent | undefined> {
  const up = code.toUpperCase();
  for (const e of db.events.values()) if (e.code === up) return e;
  return undefined;
}
export async function getEventById(id: string): Promise<TastingEvent | undefined> {
  return db.events.get(id);
}
export async function updateEvent(id: string, patch: Partial<TastingEvent>) {
  const e = db.events.get(id);
  if (!e) return;
  db.events.set(id, { ...e, ...patch });
}

// ---- Items ----
export async function insertItem(it: TastingItem) {
  db.items.set(it.id, it);
}
export async function getItemsForEvent(eventId: string): Promise<TastingItem[]> {
  return [...db.items.values()]
    .filter((i) => i.eventId === eventId)
    .sort((a, b) => a.position - b.position);
}
export async function updateItem(
  id: string,
  patch: Partial<Pick<TastingItem, "name" | "producer" | "grape" | "region" | "price" | "imageUrl">>,
) {
  const it = db.items.get(id);
  if (!it) return;
  db.items.set(id, { ...it, ...patch });
}

// ---- Participants ----
export async function insertParticipant(p: Participant) {
  db.participants.set(p.id, p);
}
export async function getParticipant(id: string): Promise<Participant | undefined> {
  return db.participants.get(id);
}
export async function removeParticipant(id: string) {
  db.participants.delete(id);
  for (const [k, e] of db.evaluations)
    if (e.participantId === id) db.evaluations.delete(k);
}
export async function getParticipantsForEvent(eventId: string): Promise<Participant[]> {
  return [...db.participants.values()]
    .filter((p) => p.eventId === eventId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}
export async function nameTaken(eventId: string, name: string): Promise<boolean> {
  const n = name.trim().toLowerCase();
  const list = await getParticipantsForEvent(eventId);
  return list.some((p) => p.name.trim().toLowerCase() === n);
}

// ---- Evaluations ----
export async function upsertEvaluation(ev: Evaluation) {
  const existing = [...db.evaluations.values()].find(
    (e) => e.itemId === ev.itemId && e.participantId === ev.participantId,
  );
  if (existing) {
    db.evaluations.set(existing.id, { ...ev, id: existing.id });
  } else {
    db.evaluations.set(ev.id, ev);
  }
}
export async function getEvaluation(
  itemId: string,
  participantId: string,
): Promise<Evaluation | undefined> {
  return [...db.evaluations.values()].find(
    (e) => e.itemId === itemId && e.participantId === participantId,
  );
}
export async function getEvaluationsForEvent(eventId: string): Promise<Evaluation[]> {
  return [...db.evaluations.values()].filter((e) => e.eventId === eventId);
}
export async function getEvaluationsForParticipant(
  eventId: string,
  participantId: string,
): Promise<Evaluation[]> {
  return [...db.evaluations.values()].filter(
    (e) => e.eventId === eventId && e.participantId === participantId,
  );
}
