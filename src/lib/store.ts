import type {
  Evaluation,
  Participant,
  TastingEvent,
  TastingItem,
} from "./types";

/**
 * Almacenamiento en memoria para desarrollo. Persiste dentro del proceso de
 * Node (sobrevive a HMR gracias al guard en globalThis). Cuando existan
 * credenciales de Supabase, este módulo se puede reemplazar por un adaptador
 * con la misma API (ver schema.sql).
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
export function insertEvent(e: TastingEvent) {
  db.events.set(e.id, e);
}
export function getEventByCode(code: string): TastingEvent | undefined {
  const up = code.toUpperCase();
  for (const e of db.events.values()) if (e.code === up) return e;
  return undefined;
}
export function getEventById(id: string): TastingEvent | undefined {
  return db.events.get(id);
}
export function updateEvent(id: string, patch: Partial<TastingEvent>) {
  const e = db.events.get(id);
  if (!e) return;
  db.events.set(id, { ...e, ...patch });
}

// ---- Items ----
export function insertItem(it: TastingItem) {
  db.items.set(it.id, it);
}
export function getItemsForEvent(eventId: string): TastingItem[] {
  return [...db.items.values()]
    .filter((i) => i.eventId === eventId)
    .sort((a, b) => a.position - b.position);
}

// ---- Participants ----
export function insertParticipant(p: Participant) {
  db.participants.set(p.id, p);
}
export function getParticipant(id: string): Participant | undefined {
  return db.participants.get(id);
}
export function getParticipantsForEvent(eventId: string): Participant[] {
  return [...db.participants.values()]
    .filter((p) => p.eventId === eventId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}
export function nameTaken(eventId: string, name: string): boolean {
  const n = name.trim().toLowerCase();
  return getParticipantsForEvent(eventId).some(
    (p) => p.name.trim().toLowerCase() === n,
  );
}

// ---- Evaluations ----
export function upsertEvaluation(ev: Evaluation) {
  // clave lógica: (itemId, participantId)
  const existing = [...db.evaluations.values()].find(
    (e) => e.itemId === ev.itemId && e.participantId === ev.participantId,
  );
  if (existing) {
    db.evaluations.set(existing.id, { ...ev, id: existing.id });
  } else {
    db.evaluations.set(ev.id, ev);
  }
}
export function getEvaluation(
  itemId: string,
  participantId: string,
): Evaluation | undefined {
  return [...db.evaluations.values()].find(
    (e) => e.itemId === itemId && e.participantId === participantId,
  );
}
export function getEvaluationsForEvent(eventId: string): Evaluation[] {
  return [...db.evaluations.values()].filter((e) => e.eventId === eventId);
}
export function getEvaluationsForParticipant(
  eventId: string,
  participantId: string,
): Evaluation[] {
  return [...db.evaluations.values()].filter(
    (e) => e.eventId === eventId && e.participantId === participantId,
  );
}
