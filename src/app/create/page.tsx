import Link from "next/link";
import { createEvent } from "@/lib/actions";
import { MODALITIES } from "@/lib/modalities";
import { Button, Card } from "@/components/ui";

export const metadata = { title: "Crear cata · Copa Ciega" };

export default function CreatePage() {
  return (
    <main className="bg-wine min-h-dvh px-5 py-8">
      <div className="mx-auto w-full max-w-lg">
        <Link href="/" className="text-sm text-marfil/60 hover:text-marfil">
          ← Volver
        </Link>
        <h1 className="mb-1 mt-4 text-2xl font-bold text-marfil">Crear una cata</h1>
        <p className="mb-6 text-sm text-marfil/60">
          Configura las muestras. Los nombres quedan ocultos hasta la revelación.
        </p>

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

            <div>
              <label className="mb-1 block text-sm font-medium text-negro/80">
                Muestras <span className="font-normal text-muted">(una por línea)</span>
              </label>
              <textarea
                name="items"
                required
                rows={6}
                defaultValue={
                  "Muestra 1 | Viña Ejemplo | Cabernet | 8990\nMuestra 2 | Otra Viña | Merlot | 12990\nMuestra 3"
                }
                className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-white px-4 py-3 font-mono text-sm text-negro outline-none focus:border-dorado focus:ring-2 focus:ring-[var(--ring)]"
              />
              <p className="mt-1.5 text-xs text-muted">
                Formato opcional: <code>Nombre | Productor | Cepa | Precio</code>. Sólo el
                nombre es obligatorio; el resto ayuda a calcular precisión y sorpresas.
              </p>
            </div>

            <Button type="submit" variant="gold" size="lg" className="w-full">
              Crear y generar QR
            </Button>
          </form>
        </Card>
      </div>
    </main>
  );
}
