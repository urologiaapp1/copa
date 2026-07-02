import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import * as store from "@/lib/store";
import { getHostToken } from "@/lib/session";
import { Button, Card } from "@/components/ui";
import { getInitialLocale } from "@/lib/i18n/server";
import { DICTIONARIES } from "@/lib/i18n/dictionary";
import { HostDashboard } from "./HostDashboard";

export default async function HostPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const event = await store.getEventByCode(code);
  if (!event) notFound();

  const token = await getHostToken(code);
  if (token !== event.hostToken) {
    const locale = await getInitialLocale();
    const t = (k: string) => DICTIONARIES[locale][k];
    return (
      <main className="bg-wine flex min-h-dvh flex-col items-center justify-center px-5">
        <Card className="max-w-sm p-8 text-center">
          <h1 className="text-lg font-bold text-negro">{t("host.unauthorizedTitle")}</h1>
          <p className="mt-2 text-sm text-muted">{t("host.unauthorizedDesc")}</p>
          <Link href="/" className="mt-4 inline-block">
            <Button variant="outline">{t("common.goHome")}</Button>
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
