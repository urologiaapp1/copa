import { NextResponse } from "next/server";
import * as store from "@/lib/store";
import { getHostToken, getParticipantSession } from "@/lib/session";
import { computeResults, computeTasterProfile } from "@/lib/results";

/** Resultados con nombres revelados. Sólo tras la revelación (o para el host). */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const event = store.getEventByCode(code);
  if (!event) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const isHost = (await getHostToken(code)) === event.hostToken;
  if (event.status !== "revealed" && !isHost)
    return NextResponse.json({ error: "not_revealed" }, { status: 403 });

  const results = computeResults(event.id);

  let profile = null;
  const session = await getParticipantSession(code);
  if (session) {
    const p = store.getParticipant(session.participantId);
    if (p && p.token === session.token)
      profile = computeTasterProfile(event.id, p.id);
  }

  return NextResponse.json({
    event: { code: event.code, title: event.title, modality: event.modality, status: event.status },
    results,
    profile,
  });
}
