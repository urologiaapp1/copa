import { admin, hasSupabase } from "@/lib/supabase";
import * as store from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Puente SSE → Supabase Realtime. El servidor (service role) se suscribe a los
 * cambios del evento y envía un "ping" al navegador, que entonces re-consulta
 * el endpoint de datos. Las keys y los secretos nunca salen del servidor.
 * Si Realtime no está disponible, el cliente igual refresca por el respaldo
 * de polling (ver useLive), así que este stream es una mejora, no un requisito.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const event = await store.getEventByCode(code);
  if (!event) return new Response("not_found", { status: 404 });
  if (!hasSupabase()) return new Response("no_realtime", { status: 501 });

  const sb = admin();
  const encoder = new TextEncoder();
  let channel: ReturnType<typeof sb.channel> | null = null;

  const stream = new ReadableStream({
    start(controller) {
      const enqueue = (s: string) => {
        try {
          controller.enqueue(encoder.encode(s));
        } catch {
          /* stream cerrado */
        }
      };
      enqueue("retry: 3000\n\n");
      enqueue("data: connected\n\n");

      const notify = () => enqueue("data: change\n\n");
      const forEvent = { schema: "public", event: "*" as const };

      channel = sb
        .channel(`copa-${event.id}-${crypto.randomUUID()}`)
        .on("postgres_changes", { ...forEvent, table: "participants", filter: `event_id=eq.${event.id}` }, notify)
        .on("postgres_changes", { ...forEvent, table: "evaluations", filter: `event_id=eq.${event.id}` }, notify)
        .on("postgres_changes", { ...forEvent, table: "events", filter: `id=eq.${event.id}` }, notify)
        .on("postgres_changes", { ...forEvent, table: "items", filter: `event_id=eq.${event.id}` }, notify)
        .subscribe();

      // Heartbeat para mantener viva la conexión / proxies
      const hb = setInterval(() => enqueue(": ping\n\n"), 25000);

      const close = () => {
        clearInterval(hb);
        if (channel) sb.removeChannel(channel);
        channel = null;
        try {
          controller.close();
        } catch {
          /* ya cerrado */
        }
      };
      req.signal.addEventListener("abort", close);
    },
    cancel() {
      if (channel) sb.removeChannel(channel);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
