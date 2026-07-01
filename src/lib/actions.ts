"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { EventStatus } from "./types";
import { clamp, generateCode, generateToken } from "./utils";
import { getModality } from "./modalities";
import * as store from "./store";
import {
  getHostToken,
  getParticipantSession,
  setHostCookie,
  setParticipantCookie,
} from "./session";

// ---------- Anfitrión: crear evento ----------
export async function createEvent(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const modality = String(formData.get("modality") ?? "tinto");
  const itemsRaw = String(formData.get("items") ?? "");

  const names = itemsRaw
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  if (!title) throw new Error("Falta el nombre del evento");
  if (names.length < 2) throw new Error("Agrega al menos 2 muestras");

  const code = uniqueCode();
  const hostToken = generateToken();
  const eventId = generateToken();

  store.insertEvent({
    id: eventId,
    code,
    title,
    modality: getModality(modality).key,
    status: "lobby",
    currentIndex: 0,
    hostToken,
    createdAt: new Date().toISOString(),
  });

  names.forEach((line, i) => {
    // formato opcional "Nombre | Productor | Cepa | Precio"
    const [name, producer, grape, price] = line.split("|").map((s) => s?.trim());
    store.insertItem({
      id: generateToken(),
      eventId,
      position: i + 1,
      name: name || `Muestra ${i + 1}`,
      producer: producer || null,
      grape: grape || null,
      region: null,
      price: price ? Number(price.replace(/[^\d]/g, "")) || null : null,
      imageUrl: null,
    });
  });

  await setHostCookie(code, hostToken);
  redirect(`/host/${code}`);
}

function uniqueCode(): string {
  for (let i = 0; i < 20; i++) {
    const c = generateCode();
    if (!store.getEventByCode(c)) return c;
  }
  return generateCode();
}

// ---------- Participante: unirse ----------
export async function joinEvent(formData: FormData) {
  const code = String(formData.get("code") ?? "").toUpperCase().trim();
  const name = String(formData.get("name") ?? "").trim();

  const event = store.getEventByCode(code);
  if (!event) throw new Error("Evento no encontrado");
  if (event.status === "closed" || event.status === "revealed")
    throw new Error("Este evento ya finalizó");
  if (!name) throw new Error("Ingresa tu nombre");
  if (name.length > 30) throw new Error("Nombre demasiado largo");

  // reconectar si ya hay sesión válida
  const existing = await getParticipantSession(code);
  if (existing) {
    const p = store.getParticipant(existing.participantId);
    if (p && p.token === existing.token) redirect(`/play/${code}`);
  }

  if (store.nameTaken(event.id, name))
    throw new Error("Ese nombre ya está en uso en este evento");

  const participantId = generateToken();
  const token = generateToken();
  store.insertParticipant({
    id: participantId,
    eventId: event.id,
    name,
    token,
    createdAt: new Date().toISOString(),
  });

  await setParticipantCookie(code, participantId, token);
  redirect(`/play/${code}`);
}

// ---------- Participante: guardar evaluación (autosave) ----------
export interface EvalInput {
  itemId: string;
  aroma: number;
  flavor: number;
  balance: number;
  wouldBuy: boolean | null;
  overall: number;
  notes: string;
  aromas: string[];
  estimatedGrape: string;
  estimatedPrice: number | null;
  confidence: number;
}

export async function saveEvaluation(code: string, input: EvalInput) {
  const event = store.getEventByCode(code);
  if (!event) return { ok: false, error: "Evento no encontrado" };

  const session = await getParticipantSession(code);
  if (!session) return { ok: false, error: "Sesión no válida" };
  const p = store.getParticipant(session.participantId);
  if (!p || p.token !== session.token || p.eventId !== event.id)
    return { ok: false, error: "Sesión no válida" };

  const item = store.getItemsForEvent(event.id).find((i) => i.id === input.itemId);
  if (!item) return { ok: false, error: "Muestra no encontrada" };

  const existing = store.getEvaluation(input.itemId, p.id);
  store.upsertEvaluation({
    id: existing?.id ?? generateToken(),
    eventId: event.id,
    itemId: input.itemId,
    participantId: p.id,
    aroma: clamp(input.aroma, 1, 10),
    flavor: clamp(input.flavor, 1, 10),
    balance: clamp(input.balance, 1, 10),
    wouldBuy: input.wouldBuy,
    overall: clamp(input.overall, 1, 100),
    notes: input.notes.slice(0, 500),
    aromas: input.aromas.slice(0, 12),
    estimatedGrape: input.estimatedGrape.slice(0, 60) || null,
    estimatedPrice: input.estimatedPrice,
    confidence: clamp(input.confidence, 1, 5),
    updatedAt: new Date().toISOString(),
  });
  return { ok: true };
}

// ---------- Anfitrión: controles ----------
async function requireHost(code: string) {
  const event = store.getEventByCode(code);
  if (!event) throw new Error("Evento no encontrado");
  const token = await getHostToken(code);
  if (token !== event.hostToken) throw new Error("No autorizado");
  return event;
}

export async function hostSetStatus(code: string, status: EventStatus) {
  const event = await requireHost(code);
  store.updateEvent(event.id, { status });
  revalidatePath(`/host/${code}`);
}

export async function hostSetIndex(code: string, index: number) {
  const event = await requireHost(code);
  const count = store.getItemsForEvent(event.id).length;
  store.updateEvent(event.id, {
    status: "tasting",
    currentIndex: clamp(index, 0, Math.max(0, count - 1)),
  });
  revalidatePath(`/host/${code}`);
}
