import * as store from "@/lib/store";
import { getHostToken } from "@/lib/session";
import { computeResults } from "@/lib/results";
import { toCSV } from "@/lib/csv";

/**
 * Exportación (PRD §5, §13). Sólo el anfitrión.
 * ?format=raw    -> una fila por evaluación
 * ?format=summary (por defecto) -> ranking y estadísticas por muestra
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const event = await store.getEventByCode(code);
  if (!event) return new Response("not_found", { status: 404 });
  if ((await getHostToken(code)) !== event.hostToken)
    return new Response("unauthorized", { status: 403 });

  const format = new URL(req.url).searchParams.get("format") ?? "summary";
  const items = await store.getItemsForEvent(event.id);
  const participants = await store.getParticipantsForEvent(event.id);

  let csv: string;
  let filename: string;

  if (format === "raw") {
    const evals = await store.getEvaluationsForEvent(event.id);
    const rows = evals.map((e) => {
      const item = items.find((i) => i.id === e.itemId);
      const p = participants.find((x) => x.id === e.participantId);
      return [
        item?.position ?? "",
        item?.name ?? "",
        p?.name ?? "",
        e.overall,
        e.acidity,
        e.sweetness,
        e.tannin,
        e.body,
        e.estimatedGrape ?? "",
        e.estimatedPrice ?? "",
        e.notes ?? "",
      ];
    });
    csv = toCSV(
      ["Vino #", "Nombre", "Catador", "Nota", "Débil-Ácido (1-10)", "Seco-Dulce (1-10)", "Suave-Tánico (1-10)", "Ligero-Poderoso (1-10)", "Estimación", "Precio estimado", "Notas"],
      rows,
    );
    filename = `copa-ciega-${event.code}-evaluaciones.csv`;
  } else {
    const results = await computeResults(event.id);
    const rows = results.ranking.map((s, i) => [
      i + 1,
      s.item.position,
      s.item.name,
      s.item.producer ?? "",
      s.item.grape ?? "",
      s.item.price ?? "",
      s.avgOverall.toFixed(1),
      s.avgAcidity.toFixed(1),
      s.avgSweetness.toFixed(1),
      s.avgTannin.toFixed(1),
      s.avgBody.toFixed(1),
      s.stdDev.toFixed(1),
      s.count,
    ]);
    csv = toCSV(
      ["Puesto", "Vino #", "Nombre", "Productor", "Cepa", "Precio", "Nota media", "Débil-Ácido", "Seco-Dulce", "Suave-Tánico", "Ligero-Poderoso", "Dispersión", "Votos"],
      rows,
    );
    filename = `copa-ciega-${event.code}-resumen.csv`;
  }

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
