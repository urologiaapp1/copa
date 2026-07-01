import { NextResponse } from "next/server";
import * as store from "@/lib/store";
import { getHostToken } from "@/lib/session";
import { computeResults } from "@/lib/results";

/** Panel del anfitrión: requiere cookie de host. Incluye nombres reales. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const event = await store.getEventByCode(code);
  if (!event) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const token = await getHostToken(code);
  if (token !== event.hostToken)
    return NextResponse.json({ error: "unauthorized" }, { status: 403 });

  const [items, participants, evals] = await Promise.all([
    store.getItemsForEvent(event.id),
    store.getParticipantsForEvent(event.id),
    store.getEvaluationsForEvent(event.id),
  ]);

  const perItemResponses = items.map((it) => ({
    itemId: it.id,
    position: it.position,
    name: it.name,
    responses: evals.filter((e) => e.itemId === it.id).length,
  }));

  return NextResponse.json({
    event: {
      code: event.code,
      title: event.title,
      modality: event.modality,
      status: event.status,
      currentIndex: event.currentIndex,
      itemCount: items.length,
      doubleBlind: event.doubleBlind,
      freePace: event.freePace,
      recoveryCode: event.recoveryCode,
    },
    items: items.map((i) => ({
      id: i.id,
      position: i.position,
      name: i.name,
      producer: i.producer,
      grape: i.grape,
      price: i.price,
    })),
    participants: participants.map((p) => ({ id: p.id, name: p.name })),
    perItemResponses,
    results: await computeResults(event.id),
  });
}
