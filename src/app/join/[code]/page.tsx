import Link from "next/link";
import { notFound } from "next/navigation";
import { joinEvent } from "@/lib/actions";
import { getModality } from "@/lib/modalities";
import * as store from "@/lib/store";
import { Button, Card } from "@/components/ui";

export default async function JoinPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const event = store.getEventByCode(code);
  if (!event) notFound();

  const closed = event.status === "closed" || event.status === "revealed";
  const modality = getModality(event.modality);

  return (
    <main className="bg-wine flex min-h-dvh flex-col items-center justify-center px-5 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mb-2 text-4xl">{modality.emoji}</div>
          <p className="text-xs uppercase tracking-widest text-dorado">Te invitaron a</p>
          <h1 className="mt-1 text-2xl font-bold text-marfil">{event.title}</h1>
          <p className="mt-1 text-sm text-marfil/60">{modality.label}</p>
        </div>

        <Card className="p-6">
          {closed ? (
            <div className="text-center text-sm text-muted">
              Este evento ya finalizó.
              <div className="mt-4">
                <Link href="/">
                  <Button variant="outline">Ir al inicio</Button>
                </Link>
              </div>
            </div>
          ) : (
            <form action={joinEvent} className="space-y-4">
              <input type="hidden" name="code" value={event.code} />
              <div>
                <label className="mb-1 block text-sm font-medium text-negro/80">
                  ¿Cómo te llamas?
                </label>
                <input
                  name="name"
                  required
                  autoFocus
                  maxLength={30}
                  placeholder="Tu nombre"
                  className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-white px-4 py-3 text-negro outline-none focus:border-dorado focus:ring-2 focus:ring-[var(--ring)]"
                />
              </div>
              <Button type="submit" variant="gold" size="lg" className="w-full">
                Entrar a la cata
              </Button>
              <p className="text-center text-xs text-muted">
                Sin registro. Tu progreso se guarda solo.
              </p>
            </form>
          )}
        </Card>
      </div>
    </main>
  );
}
