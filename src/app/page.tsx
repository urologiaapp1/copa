import Link from "next/link";
import { joinEvent } from "@/lib/actions";
import { Button, Card } from "@/components/ui";

export default function Home() {
  return (
    <main className="bg-wine flex min-h-dvh flex-col items-center px-5 py-10">
      <div className="w-full max-w-md">
        <header className="mb-10 mt-6 text-center">
          <div className="mb-3 text-5xl">🍷</div>
          <h1 className="text-4xl font-extrabold tracking-tight text-marfil">
            Copa <span className="text-dorado">Ciega</span>
          </h1>
          <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-marfil/70">
            Catas ciegas en grupo. Puntúa a ciegas, descubre quién tiene el mejor
            paladar y revela los resultados juntos.
          </p>
        </header>

        <Card className="bg-card p-6">
          <Link href="/create" className="block">
            <Button variant="gold" size="lg" className="w-full">
              Crear una cata
            </Button>
          </Link>
          <p className="mt-2 text-center text-xs text-muted">
            Listo en menos de 20 segundos · sin registro
          </p>

          <div className="my-6 flex items-center gap-3 text-xs text-muted">
            <span className="h-px flex-1 bg-[var(--border)]" />
            o únete a una
            <span className="h-px flex-1 bg-[var(--border)]" />
          </div>

          <form action={joinEvent} className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-negro/70">
                Código del evento
              </label>
              <input
                name="code"
                required
                autoComplete="off"
                autoCapitalize="characters"
                maxLength={6}
                placeholder="ABC123"
                className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-white px-4 py-3 text-center font-mono text-xl uppercase tracking-[0.3em] text-negro outline-none focus:border-dorado focus:ring-2 focus:ring-[var(--ring)]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-negro/70">Tu nombre</label>
              <input
                name="name"
                required
                maxLength={30}
                placeholder="Ej. Camila"
                className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-white px-4 py-3 text-negro outline-none focus:border-dorado focus:ring-2 focus:ring-[var(--ring)]"
              />
            </div>
            <Button type="submit" size="lg" className="w-full">
              Unirme
            </Button>
          </form>
        </Card>

        <p className="mt-8 text-center text-xs text-marfil/40">
          Vinos · Espumantes · Whisky · Café · Chocolate · y más
        </p>
      </div>
    </main>
  );
}
