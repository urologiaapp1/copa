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
  const doubleBlind = formData.get("doubleBlind") === "on";
  const freePace = formData.get("freePace") === "on";

  if (!title) throw new Error("Falta el nombre del evento");

  // En doble ciego solo se pide el número de vinos; van numerados y sin info.
  // En ciego simple se listan las muestras (con info opcional oculta hasta revelar).
  let items: {
    name: string;
    producer: string | null;
    grape: string | null;
    price: number | null;
  }[];

  if (doubleBlind) {
    const count = Math.floor(Number(formData.get("wineCount") ?? 0));
    if (!count || count < 2) throw new Error("Indica al menos 2 vinos");
    if (count > 50) throw new Error("Máximo 50 vinos");
    items = Array.from({ length: count }, () => ({
      name: "",
      producer: null,
      grape: null,
      price: null,
    }));
  } else {
    const names = String(formData.get("items") ?? "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    if (names.length < 2) throw new Error("Agrega al menos 2 muestras");
    items = names.map((line) => {
      const [name, producer, grape, price] = line.split("|").map((s) => s?.trim());
      return {
        name: name || "",
        producer: producer || null,
        grape: grape || null,
        price: price ? Number(price.replace(/[^\d]/g, "")) || null : null,
      };
    });
  }

  const code = await uniqueCode();
  const hostToken = generateToken();
  const recoveryCode = generateCode(8);
  const eventId = generateToken();

  await store.insertEvent({
    id: eventId,
    code,
    title,
    modality: getModality(modality).key,
    status: "lobby",
    currentIndex: 0,
    hostToken,
    doubleBlind,
    freePace,
    recoveryCode,
    createdAt: new Date().toISOString(),
  });

  await Promise.all(
    items.map((it, i) =>
      store.insertItem({
        id: generateToken(),
        eventId,
        position: i + 1,
        name: it.name || `Vino ${i + 1}`,
        producer: it.producer,
        grape: it.grape,
        region: null,
        price: it.price,
        imageUrl: null,
      }),
    ),
  );

  await setHostCookie(code, hostToken);
  redirect(`/host/${code}`);
}

async function uniqueCode(): Promise<string> {
  for (let i = 0; i < 20; i++) {
    const c = generateCode();
    if (!(await store.getEventByCode(c))) return c;
  }
  return generateCode();
}

// ---------- Participante: unirse ----------
export async function joinEvent(formData: FormData) {
  const code = String(formData.get("code") ?? "").toUpperCase().trim();
  const name = String(formData.get("name") ?? "").trim();

  const event = await store.getEventByCode(code);
  if (!event) throw new Error("Evento no encontrado");
  if (event.status === "closed" || event.status === "revealed")
    throw new Error("Este evento ya finalizó");
  if (!name) throw new Error("Ingresa tu nombre");
  if (name.length > 30) throw new Error("Nombre demasiado largo");

  // reconectar si ya hay sesión válida
  const existing = await getParticipantSession(code);
  if (existing) {
    const p = await store.getParticipant(existing.participantId);
    if (p && p.token === existing.token) redirect(`/play/${code}`);
  }

  if (await store.nameTaken(event.id, name))
    throw new Error("Ese nombre ya está en uso en este evento");

  const participantId = generateToken();
  const token = generateToken();
  await store.insertParticipant({
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
  acidity: number; // 1 = débil, 10 = ácido
  sweetness: number; // 1 = seco, 10 = dulce
  tannin: number; // 1 = suave, 10 = tánico
  body: number; // 1 = ligero, 10 = poderoso
  overall: number;
  notes: string;
  estimatedGrape: string;
  estimatedPrice: number | null;
}

export async function saveEvaluation(code: string, input: EvalInput) {
  const event = await store.getEventByCode(code);
  if (!event) return { ok: false, error: "Evento no encontrado" };

  const session = await getParticipantSession(code);
  if (!session) return { ok: false, error: "Sesión no válida" };
  const p = await store.getParticipant(session.participantId);
  if (!p || p.token !== session.token || p.eventId !== event.id)
    return { ok: false, error: "Sesión no válida" };

  const item = (await store.getItemsForEvent(event.id)).find((i) => i.id === input.itemId);
  if (!item) return { ok: false, error: "Muestra no encontrada" };

  const existing = await store.getEvaluation(input.itemId, p.id);
  await store.upsertEvaluation({
    id: existing?.id ?? generateToken(),
    eventId: event.id,
    itemId: input.itemId,
    participantId: p.id,
    acidity: clamp(input.acidity, 1, 10),
    sweetness: clamp(input.sweetness, 1, 10),
    tannin: clamp(input.tannin, 1, 10),
    body: clamp(input.body, 1, 10),
    overall: clamp(input.overall, 1, 100),
    notes: input.notes.slice(0, 500),
    estimatedGrape: input.estimatedGrape.slice(0, 60) || null,
    estimatedPrice: input.estimatedPrice,
    updatedAt: new Date().toISOString(),
  });
  return { ok: true };
}

// ---------- Anfitrión: controles ----------
async function requireHost(code: string) {
  const event = await store.getEventByCode(code);
  if (!event) throw new Error("Evento no encontrado");
  const token = await getHostToken(code);
  if (token !== event.hostToken) throw new Error("No autorizado");
  return event;
}

export async function hostSetStatus(code: string, status: EventStatus) {
  const event = await requireHost(code);
  await store.updateEvent(event.id, { status });
  revalidatePath(`/host/${code}`);
}

export async function hostSetIndex(code: string, index: number) {
  const event = await requireHost(code);
  const count = (await store.getItemsForEvent(event.id)).length;
  await store.updateEvent(event.id, {
    status: "tasting",
    currentIndex: clamp(index, 0, Math.max(0, count - 1)),
  });
  revalidatePath(`/host/${code}`);
}

// ---------- Anfitrión: agregar/editar la info de un vino (doble ciego) ----------
export interface ItemInfoInput {
  name: string;
  producer: string;
  grape: string;
  price: number | null;
}
export async function hostUpdateItem(code: string, itemId: string, info: ItemInfoInput) {
  const event = await requireHost(code);
  const item = (await store.getItemsForEvent(event.id)).find((i) => i.id === itemId);
  if (!item) return { ok: false, error: "Vino no encontrado" };
  await store.updateItem(itemId, {
    name: info.name.trim().slice(0, 80) || item.name,
    producer: info.producer.trim().slice(0, 80) || null,
    grape: info.grape.trim().slice(0, 60) || null,
    price: info.price,
  });
  revalidatePath(`/host/${code}`);
  return { ok: true };
}

// ---------- Anfitrión: eliminar un catador ----------
export async function hostRemoveParticipant(code: string, participantId: string) {
  const event = await requireHost(code);
  const p = await store.getParticipant(participantId);
  if (p && p.eventId === event.id) await store.removeParticipant(participantId);
  revalidatePath(`/host/${code}`);
  return { ok: true };
}

// ---------- Recuperar acceso admin con código SOS ----------
export async function recoverHost(formData: FormData) {
  const code = String(formData.get("code") ?? "").toUpperCase().trim();
  const recovery = String(formData.get("recovery") ?? "").toUpperCase().trim();
  const event = await store.getEventByCode(code);
  if (!event || !event.recoveryCode || event.recoveryCode !== recovery)
    throw new Error("Código de evento o SOS incorrecto");
  await setHostCookie(event.code, event.hostToken);
  redirect(`/host/${event.code}`);
}
