import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import * as store from "@/lib/store";
import { getHostToken } from "@/lib/session";
import { Button, Card } from "@/components/ui";
import { HostDashboard } from "./HostDashboard";

export default async function HostPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const event = store.getEventByCode(code);
  if (!event) notFound();

  const token = await getHostToken(code);
  if (token !== event.hostToken) {
    return (
      <main className="bg-wine flex min-h-dvh flex-col items-center justify-center px-5">
        <Card className="max-w-sm p-8 text-center">
          <h1 className="text-lg font-bold text-negro">Panel del anfitrión</h1>
          <p className="mt-2 text-sm text-muted">
            No tienes permiso para administrar este evento desde este dispositivo.
          </p>
          <Link href="/" className="mt-4 inline-block">
            <Button variant="outline">Ir al inicio</Button>
          </Link>
        </Card>
      </main>
    );
  }

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  const joinUrl = `${proto}://${host}/join/${event.code}`;

  return <HostDashboard code={event.code} joinUrl={joinUrl} />;
}
