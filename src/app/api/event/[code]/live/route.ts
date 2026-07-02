import { NextResponse } from "next/server";
import * as store from "@/lib/store";
import { computeLiveStats } from "@/lib/results";

/**
 * Pulso de la sala: quién puntea más, quién le pone precios más altos, quién
 * es más generoso puntuando, y el aroma del momento. Nada de esto revela la
 * identidad de los vinos, así que es seguro mostrarlo mientras la cata ocurre
 * (incluso en doble ciego).
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const event = await store.getEventByCode(code);
  if (!event) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const stats = await computeLiveStats(event.id);
  return NextResponse.json({ status: event.status, stats });
}
