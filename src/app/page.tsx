"use client";

import Link from "next/link";
import { joinEvent } from "@/lib/actions";
import { Button, Card } from "@/components/ui";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useI18n } from "@/lib/i18n/context";

export default function Home() {
  const { t } = useI18n();
  return (
    <main className="bg-wine flex min-h-dvh flex-col items-center px-5 py-10">
      <div className="w-full max-w-md">
        <div className="mb-2 flex justify-end">
          <LanguageSwitcher dark />
        </div>
        <header className="mb-10 mt-4 text-center">
          <div className="mb-3 text-5xl">🍷</div>
          <div className="ticket-perforation-gold mx-auto mb-3 w-28" />
          <h1 className="font-serif text-5xl font-semibold tracking-tight text-marfil">
            Copa <em className="italic text-dorado">Ciega</em>
          </h1>
          <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-marfil/70">
            {t("home.tagline")}
          </p>
        </header>

        <Card className="bg-card p-6">
          <Link href="/create" className="block">
            <Button variant="gold" size="lg" className="w-full">
              {t("home.createButton")}
            </Button>
          </Link>
          <p className="mt-2 text-center text-xs text-muted">{t("home.readyIn")}</p>

          <div className="relative -mx-6 my-6 flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-muted">
            <span className="ticket-notch -left-[9px]" />
            <span className="ticket-perforation flex-1" />
            {t("home.or")}
            <span className="ticket-perforation flex-1" />
            <span className="ticket-notch -right-[9px]" />
          </div>

          <form action={joinEvent} className="space-y-3">
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-burdeo">
                {t("home.eventCode")}
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
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-burdeo">
                {t("home.yourName")}
              </label>
              <input
                name="name"
                required
                maxLength={30}
                placeholder={t("home.namePlaceholder")}
                className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-white px-4 py-3 text-negro outline-none focus:border-dorado focus:ring-2 focus:ring-[var(--ring)]"
              />
            </div>
            <Button type="submit" size="lg" className="w-full">
              {t("home.join")}
            </Button>
          </form>
        </Card>

        <p className="mt-8 text-center text-xs text-marfil/40">{t("home.footerCategories")}</p>

        <p className="mt-4 text-center text-xs text-marfil/50">
          {t("create.lostAccess")}{" "}
          <Link href="/recover" className="text-dorado hover:underline">
            {t("create.recoverLink")}
          </Link>
        </p>
      </div>
    </main>
  );
}
