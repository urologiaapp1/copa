import { notFound, redirect } from "next/navigation";
import * as store from "@/lib/store";
import { getParticipantSession } from "@/lib/session";
import { PlayExperience } from "./PlayExperience";

export default async function PlayPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const event = store.getEventByCode(code);
  if (!event) notFound();

  const session = await getParticipantSession(code);
  if (!session) redirect(`/join/${code}`);
  const p = store.getParticipant(session!.participantId);
  if (!p || p.token !== session!.token || p.eventId !== event.id)
    redirect(`/join/${code}`);

  return <PlayExperience code={event.code} modality={event.modality} name={p!.name} />;
}
