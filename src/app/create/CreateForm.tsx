"use client";

import { useState } from "react";
import { createEvent } from "@/lib/actions";
import { MODALITIES } from "@/lib/modalities";
import { Button, Card } from "@/components/ui";

export function CreateForm() {
  const [doubleBlind, setDoubleBlind] = useState(false);
  const [freePace, setFreePace] = useState(true);

  return (
    <Card className="p-6">
      <form action={createEvent} className="space-y-5">
        <div>
          <label className="mb-1 block text-sm font-medium text-negro/80">
            Nombre del evento
          </label>
          <input
            name="title"
            required
            maxLength={60}
            placeholder="Cata de tintos del viernes"
            className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-white px-4 py-3 text-negro outline-none focus:border-dorado focus:ring-2 focus:ring-[var(--ring)]"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-negro/80">Modalidad</label>
          <select
            name="modality"
            defaultValue="tinto"
            className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-white px-4 py-3 text-negro outline-none focus:border-dorado focus:ring-2 focus:ring-[var(--ring)]"
          >
            {MODALITIES.map((m) => (
              <option key={m.key} value={m.key}>
                {m.emoji} {m.label}
              </option>
            ))}
          </select>
        </div>

        {/* Toggles */}
        <Toggle
          name="doubleBlind"
          checked={doubleBlind}
          onChange={setDoubleBlind}
          title="Doble ciego"
          desc="Los vinos van solo numerados. Agregas la info (nombre, cepa, precio) al final, y cada catador recibe su informe de aciertos."
        />
        <Toggle
          name="freePace"
          checked={freePace}
          onChange={setFreePace}
          title="Ritmo libre"
          desc="Varias botellas a la vez: cada quien evalúa y puede editar cualquier vino cuando quiera. Si lo apagas, tú controlas el vino activo."
        />

        {/* Campos según doble ciego */}
        {doubleBlind ? (
          <div>
            <label className="mb-1 block text-sm font-medium text-negro/80">
              ¿Cuántos vinos?
            </label>
            <input
              name="wineCount"
              type="number"
              min={2}
              max={50}
              defaultValue={6}
              required
              className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-white px-4 py-3 text-negro outline-none focus:border-dorado focus:ring-2 focus:ring-[var(--ring)]"
            />
            <p className="mt-1.5 text-xs text-muted">
              Se crearán como <b>Vino 1</b> … <b>Vino N</b>. Nadie ve la info hasta que la
              agregues y reveles.
            </p>
          </div>
        ) : (
          <div>
            <label className="mb-1 block text-sm font-medium text-negro/80">
              Muestras <span className="font-normal text-muted">(una por línea)</span>
            </label>
            <textarea
              name="items"
              required={!doubleBlind}
              rows={6}
              defaultValue={
                "Muestra 1 | Viña Ejemplo | Cabernet | 8990\nMuestra 2 | Otra Viña | Merlot | 12990\nMuestra 3"
              }
              className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-white px-4 py-3 font-mono text-sm text-negro outline-none focus:border-dorado focus:ring-2 focus:ring-[var(--ring)]"
            />
            <p className="mt-1.5 text-xs text-muted">
              Formato opcional: <code>Nombre | Productor | Cepa | Precio</code>. La info queda
              oculta hasta la revelación.
            </p>
          </div>
        )}

        <Button type="submit" variant="gold" size="lg" className="w-full">
          Crear y generar QR
        </Button>
      </form>
    </Card>
  );
}

function Toggle({
  name,
  checked,
  onChange,
  title,
  desc,
}: {
  name: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  title: string;
  desc: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-[var(--radius)] border border-[var(--border)] bg-white p-3">
      {/* checkbox real (oculto) para enviar en el form */}
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
      <span
        className={
          "mt-0.5 flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors " +
          (checked ? "bg-burdeo" : "bg-black/15")
        }
      >
        <span
          className={
            "h-5 w-5 rounded-full bg-white shadow transition-transform " +
            (checked ? "translate-x-5" : "translate-x-0")
          }
        />
      </span>
      <span>
        <span className="block text-sm font-semibold text-negro">{title}</span>
        <span className="block text-xs text-muted">{desc}</span>
      </span>
    </label>
  );
}
