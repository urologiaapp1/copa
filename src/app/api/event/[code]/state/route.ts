import { NextResponse } from "next/server";
import * as store from "@/lib/store";
import { getParticipantSession } from "@/lib/session";

/** Estado público del evento (sin secretos). Sondeado por participantes. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const event = await store.getEventByCode(code);
  if (!event) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const items = await store.getItemsForEvent(event.id);
  const current = items[event.currentIndex];
  const responsesForCurrent = current
    ? (await store.getEvaluationsForEvent(event.id)).filter((e) => e.itemId === current.id).length
    : 0;

  // ¿Este visitante ya está inscrito?
  const session = await getParticipantSession(code);
  let me: { id: string; name: string } | null = null;
  let myCurrentEval = null;
  let myEvaluatedCount = 0;
  // mapa itemId -> datos de MI evaluación (para ritmo libre: editar cualquiera)
  const myEvalsById: Record<string, unknown> = {};
  let stillHere = true;
  if (session) {
    const p = await store.getParticipant(session.participantId);
    if (p && p.token === session.token) {
      me = { id: p.id, name: p.name };
      const mine = await store.getEvaluationsForParticipant(event.id, p.id);
      myEvaluatedCount = mine.length;
      for (const ev of mine) {
        const { id: _id, eventId: _e, participantId: _p, updatedAt: _u, ...rest } = ev;
        void _id; void _e; void _p; void _u;
        myEvalsById[ev.itemId] = rest;
      }
      if (current) myCurrentEval = myEvalsById[current.id] ?? null;
    } else {
      // sesión existe pero el catador fue eliminado por el anfitrión
      stillHere = false;
    }
  }

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
    },
    // en ciego/doble ciego los nombres van ocultos: solo posición e id
    items: items.map((i) => ({ id: i.id, position: i.position })),
    currentItemId: current?.id ?? null,
    currentItemPosition: current?.position ?? null,
    responsesForCurrent,
    participants: (await store.getParticipantsForEvent(event.id)).map((p) => ({ name: p.name })),
    me,
    stillHere,
    myCurrentEval,
    myEvalsById,
    myEvaluatedCount,
  });
}
