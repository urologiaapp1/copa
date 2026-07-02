"use client";

import Link from "next/link";
import { recoverHost } from "@/lib/actions";
import { Button, Card } from "@/components/ui";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useI18n } from "@/lib/i18n/context";

export function RecoverForm() {
  const { t } = useI18n();
  return (
    <main className="bg-wine flex min-h-dvh flex-col items-center justify-center px-5 py-10">
      <div className="w-full max-w-md">
        <div className="mb-2 flex justify-end">
          <LanguageSwitcher dark />
        </div>
        <div className="mb-6 text-center">
          <div className="mb-2 text-4xl">🆘</div>
          <h1 className="text-2xl font-bold text-marfil">{t("recover.title")}</h1>
          <p className="mt-2 text-sm text-marfil/60">{t("recover.subtitle")}</p>
        </div>

        <Card className="p-6">
          <form action={recoverHost} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-negro/70">
                {t("home.eventCode")}
              </label>
              <input
                name="code"
                required
                autoCapitalize="characters"
                maxLength={6}
                placeholder="ABC123"
                className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-white px-4 py-3 text-center font-mono text-xl uppercase tracking-[0.3em] text-negro outline-none focus:border-dorado focus:ring-2 focus:ring-[var(--ring)]"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-negro/70">
                {t("recover.sosCode")}
              </label>
              <input
                name="recovery"
                required
                autoCapitalize="characters"
                maxLength={8}
                placeholder="XXXXXXXX"
                className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-white px-4 py-3 text-center font-mono text-lg uppercase tracking-[0.2em] text-negro outline-none focus:border-dorado focus:ring-2 focus:ring-[var(--ring)]"
              />
            </div>
            <Button type="submit" variant="gold" size="lg" className="w-full">
              {t("recover.submit")}
            </Button>
          </form>
        </Card>

        <p className="mt-6 text-center text-xs text-marfil/40">
          <Link href="/" className="hover:text-marfil">
            {t("recover.backHome")}
          </Link>
        </p>
      </div>
    </main>
  );
}
