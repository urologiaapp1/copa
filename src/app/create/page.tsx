"use client";

import Link from "next/link";
import { CreateForm } from "./CreateForm";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useI18n } from "@/lib/i18n/context";

export default function CreatePage() {
  const { t } = useI18n();
  return (
    <main className="bg-wine min-h-dvh px-5 py-8">
      <div className="mx-auto w-full max-w-lg">
        <div className="mb-2 flex items-center justify-between">
          <Link href="/" className="text-sm text-marfil/60 hover:text-marfil">
            {t("common.back")}
          </Link>
          <LanguageSwitcher dark />
        </div>
        <h1 className="mb-1 mt-2 text-2xl font-bold text-marfil">{t("create.title")}</h1>
        <p className="mb-6 text-sm text-marfil/60">{t("create.subtitle")}</p>

        <CreateForm />

        <p className="mt-4 text-center text-xs text-marfil/40">
          {t("create.lostAccess")}{" "}
          <Link href="/recover" className="text-dorado hover:underline">
            {t("create.recoverLink")}
          </Link>
        </p>
      </div>
    </main>
  );
}
