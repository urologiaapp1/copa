import { admin } from "../supabase";
import type {
  Evaluation,
  Participant,
  TastingEvent,
  TastingItem,
} from "../types";

/** Backend Supabase. Usa la service role key (solo servidor). */

// ---- mapeadores fila (snake_case) -> tipo (camelCase) ----
type Row = Record<string, unknown>;
const num = (v: unknown): number | null =>
  v == null || v === "" ? null : Number(v);

function toEvent(r: Row): TastingEvent {
  return {
    id: r.id as string,
    code: r.code as string,
    title: r.title as string,
    modality: r.modality as string,
    status: r.status as TastingEvent["status"],
    currentIndex: Number(r.current_index ?? 0),
    hostToken: r.host_token as string,
    doubleBlind: Boolean(r.double_blind),
    freePace: Boolean(r.free_pace),
    recoveryCode: (r.recovery_code as string) ?? "",
    createdAt: r.created_at as string,
  };
}
function toItem(r: Row): TastingItem {
  return {
    id: r.id as string,
    eventId: r.event_id as string,
    position: Number(r.position),
    name: r.name as string,
    producer: (r.producer as string) ?? null,
    grape: (r.grape as string) ?? null,
    region: (r.region as string) ?? null,
    price: num(r.price),
    imageUrl: (r.image_url as string) ?? null,
  };
}
function toParticipant(r: Row): Participant {
  return {
    id: r.id as string,
    eventId: r.event_id as string,
    name: r.name as string,
    token: r.token as string,
    createdAt: r.created_at as string,
  };
}
function toEval(r: Row): Evaluation {
  return {
    id: r.id as string,
    eventId: r.event_id as string,
    itemId: r.item_id as string,
    participantId: r.participant_id as string,
    aroma: Number(r.aroma),
    flavor: Number(r.flavor),
    balance: Number(r.balance),
    wouldBuy: (r.would_buy as boolean) ?? null,
    overall: Number(r.overall),
    notes: (r.notes as string) ?? null,
    aromas: (r.aromas as string[]) ?? [],
    estimatedGrape: (r.estimated_grape as string) ?? null,
    estimatedPrice: num(r.estimated_price),
    confidence: Number(r.confidence ?? 3),
    updatedAt: r.updated_at as string,
  };
}

// ---- Events ----
export async function insertEvent(e: TastingEvent) {
  const { error } = await admin().from("events").insert({
    id: e.id,
    code: e.code,
    title: e.title,
    modality: e.modality,
    status: e.status,
    current_index: e.currentIndex,
    host_token: e.hostToken,
    double_blind: e.doubleBlind,
    free_pace: e.freePace,
    recovery_code: e.recoveryCode,
    created_at: e.createdAt,
  });
  if (error) throw error;
}
export async function getEventByCode(code: string): Promise<TastingEvent | undefined> {
  const { data } = await admin()
    .from("events")
    .select("*")
    .eq("code", code.toUpperCase())
    .maybeSingle();
  return data ? toEvent(data) : undefined;
}
export async function getEventById(id: string): Promise<TastingEvent | undefined> {
  const { data } = await admin().from("events").select("*").eq("id", id).maybeSingle();
  return data ? toEvent(data) : undefined;
}
export async function updateEvent(id: string, patch: Partial<TastingEvent>) {
  const row: Row = {};
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.currentIndex !== undefined) row.current_index = patch.currentIndex;
  if (patch.title !== undefined) row.title = patch.title;
  if (Object.keys(row).length === 0) return;
  const { error } = await admin().from("events").update(row).eq("id", id);
  if (error) throw error;
}

// ---- Items ----
export async function insertItem(it: TastingItem) {
  const { error } = await admin().from("items").insert({
    id: it.id,
    event_id: it.eventId,
    position: it.position,
    name: it.name,
    producer: it.producer,
    grape: it.grape,
    region: it.region,
    price: it.price,
    image_url: it.imageUrl,
  });
  if (error) throw error;
}
export async function getItemsForEvent(eventId: string): Promise<TastingItem[]> {
  const { data } = await admin()
    .from("items")
    .select("*")
    .eq("event_id", eventId)
    .order("position", { ascending: true });
  return (data ?? []).map(toItem);
}
export async function updateItem(
  id: string,
  patch: Partial<Pick<TastingItem, "name" | "producer" | "grape" | "region" | "price" | "imageUrl">>,
) {
  const row: Row = {};
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.producer !== undefined) row.producer = patch.producer;
  if (patch.grape !== undefined) row.grape = patch.grape;
  if (patch.region !== undefined) row.region = patch.region;
  if (patch.price !== undefined) row.price = patch.price;
  if (patch.imageUrl !== undefined) row.image_url = patch.imageUrl;
  if (Object.keys(row).length === 0) return;
  const { error } = await admin().from("items").update(row).eq("id", id);
  if (error) throw error;
}

// ---- Participants ----
export async function insertParticipant(p: Participant) {
  const { error } = await admin().from("participants").insert({
    id: p.id,
    event_id: p.eventId,
    name: p.name,
    token: p.token,
    created_at: p.createdAt,
  });
  if (error) throw error;
}
export async function getParticipant(id: string): Promise<Participant | undefined> {
  const { data } = await admin().from("participants").select("*").eq("id", id).maybeSingle();
  return data ? toParticipant(data) : undefined;
}
export async function removeParticipant(id: string) {
  // las evaluaciones se borran en cascada (FK on delete cascade)
  const { error } = await admin().from("participants").delete().eq("id", id);
  if (error) throw error;
}
export async function getParticipantsForEvent(eventId: string): Promise<Participant[]> {
  const { data } = await admin()
    .from("participants")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });
  return (data ?? []).map(toParticipant);
}
export async function nameTaken(eventId: string, name: string): Promise<boolean> {
  const { data } = await admin()
    .from("participants")
    .select("id")
    .eq("event_id", eventId)
    .ilike("name", name.trim())
    .limit(1);
  return (data?.length ?? 0) > 0;
}

// ---- Evaluations ----
export async function upsertEvaluation(ev: Evaluation) {
  const { error } = await admin()
    .from("evaluations")
    .upsert(
      {
        event_id: ev.eventId,
        item_id: ev.itemId,
        participant_id: ev.participantId,
        aroma: ev.aroma,
        flavor: ev.flavor,
        balance: ev.balance,
        would_buy: ev.wouldBuy,
        overall: ev.overall,
        notes: ev.notes,
        aromas: ev.aromas,
        estimated_grape: ev.estimatedGrape,
        estimated_price: ev.estimatedPrice,
        confidence: ev.confidence,
        updated_at: ev.updatedAt,
      },
      { onConflict: "item_id,participant_id" },
    );
  if (error) throw error;
}
export async function getEvaluation(
  itemId: string,
  participantId: string,
): Promise<Evaluation | undefined> {
  const { data } = await admin()
    .from("evaluations")
    .select("*")
    .eq("item_id", itemId)
    .eq("participant_id", participantId)
    .maybeSingle();
  return data ? toEval(data) : undefined;
}
export async function getEvaluationsForEvent(eventId: string): Promise<Evaluation[]> {
  const { data } = await admin().from("evaluations").select("*").eq("event_id", eventId);
  return (data ?? []).map(toEval);
}
export async function getEvaluationsForParticipant(
  eventId: string,
  participantId: string,
): Promise<Evaluation[]> {
  const { data } = await admin()
    .from("evaluations")
    .select("*")
    .eq("event_id", eventId)
    .eq("participant_id", participantId);
  return (data ?? []).map(toEval);
}
