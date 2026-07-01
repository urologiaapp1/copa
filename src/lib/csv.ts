/** Escapa un valor para CSV (compatible con Excel). */
function cell(v: unknown): string {
  if (v == null) return "";
  const s = String(v);
  if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** Construye un CSV a partir de encabezados y filas. Usa `;` (Excel es-CL). */
export function toCSV(headers: string[], rows: unknown[][]): string {
  const lines = [headers.map(cell).join(";")];
  for (const r of rows) lines.push(r.map(cell).join(";"));
  // BOM para que Excel detecte UTF-8 (acentos)
  return "﻿" + lines.join("\r\n");
}
