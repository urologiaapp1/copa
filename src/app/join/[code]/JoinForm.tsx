"use client";

import Link from "next/link";
import { joinEvent } from "@/lib/actions";
import { getModality, getModalityLabel } from "@/lib/modalities";
import { Button, Card } from "@/components/ui";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useI18n } from "@/lib/i18n/context";

export function JoinForm({
  code,
  title,
  modalityKey,
  closed,
}: {
  code: string;
  title: string;
  modalityKey: string;
  closed: boolean;
}) {
  const { t, locale } = useI18n();
  const modality = getModality(modalityKey);

  return (
    <main className="bg-wine flex min-h-dvh flex-col items-center justify-center px-5 py-10">
      <div className="w-full max-w-md">
        <div className="mb-2 flex justify-end">
          <LanguageSwitcher dark />
        </div>
        <div className="mb-6 text-center">
          <div className="mb-2 text-4xl">{modality.emoji}</div>
          <p className="text-xs uppercase tracking-widest text-dorado">{t("join.invitedTo")}</p>
          <h1 className="mt-1 text-2xl font-bold text-marfil">{title}</h1>
          <p className="mt-1 text-sm text-marfil/60">{getModalityLabel(modalityKey, locale)}</p>
        </div>

        <Card className="p-6">
          {closed ? (
            <div className="text-center text-sm text-muted">
              {t("join.finished")}
              <div className="mt-4">
                <Link href="/">
                  <Button variant="outline">{t("common.goHome")}</Button>
                </Link>
              </div>
            </div>
          ) : (
            <form action={joinEvent} className="space-y-4">
              <input type="hidden" name="code" value={code} />
              <div>
                <label className="mb-1 block text-sm font-medium text-negro/80">
                  {t("join.whatsYourName")}
                </label>
                <input
                  name="name"
                  required
                  autoFocus
                  maxLength={30}
                  placeholder={t("join.namePlaceholder")}
                  className="w-full rounded-[var(--radius)] border border-[var(--border)] bg-white px-4 py-3 text-negro outline-none focus:border-dorado focus:ring-2 focus:ring-[var(--ring)]"
                />
              </div>
              <Button type="submit" variant="gold" size="lg" className="w-full">
                {t("join.enterTasting")}
              </Button>
              <p className="text-center text-xs text-muted">{t("join.noRegistration")}</p>
            </form>
          )}
        </Card>
      </div>
    </main>
  );
}
