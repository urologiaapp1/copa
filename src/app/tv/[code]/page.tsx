import { headers } from "next/headers";
import { notFound } from "next/navigation";
import * as store from "@/lib/store";
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

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  const joinUrl = `${proto}://${host}/join/${event.code}`;

  return <TVView code={event.code} joinUrl={joinUrl} />;
}
