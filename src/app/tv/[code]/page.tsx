import { notFound } from "next/navigation";
import * as store from "@/lib/store";
import { getSiteOrigin } from "@/lib/site";
import { TVView } from "./TVView";

export const metadata = { title: "Pantalla TV · Copa Ciega" };

export default async function TVPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const event = await store.getEventByCode(code);
  if (!event) notFound();

  const origin = await getSiteOrigin();
  const joinUrl = `${origin}/join/${event.code}`;

  return <TVView code={event.code} joinUrl={joinUrl} />;
}
