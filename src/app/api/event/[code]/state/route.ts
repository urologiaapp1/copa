import { NextResponse } from "next/server";
import * as store from "@/lib/store";
import { getParticipantSession } from "@/lib/session";

/** Estado público del evento (sin secretos). Sondeado por participantes. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const event = store.getEventByCode(code);
  if (!event) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const items = store.getItemsForEvent(event.id);
  const current = items[event.currentIndex];
  const responsesForCurrent = current
    ? store.getEvaluationsForEvent(event.id).filter((e) => e.itemId === current.id).length
    : 0;

  // ¿Este visitante ya está inscrito?
  const session = await getParticipantSession(code);
  let me: { id: string; name: string } | null = null;
  let myCurrentEval = null;
  let myEvaluatedCount = 0;
  if (session) {
    const p = store.getParticipant(session.participantId);
    if (p && p.token === session.token) {
      me = { id: p.id, name: p.name };
      myEvaluatedCount = store.getEvaluationsForParticipant(event.id, p.id).length;
      if (current) {
        const ev = store.getEvaluation(current.id, p.id);
        if (ev) {
          const { id: _id, eventId: _e, participantId: _p, updatedAt: _u, ...rest } = ev;
          void _id; void _e; void _p; void _u;
          myCurrentEval = rest;
        }
      }
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
    },
    currentItemId: current?.id ?? null,
    currentItemPosition: current?.position ?? null,
    responsesForCurrent,
    participants: store.getParticipantsForEvent(event.id).map((p) => ({ name: p.name })),
    me,
    myCurrentEval,
    myEvaluatedCount,
  });
}
