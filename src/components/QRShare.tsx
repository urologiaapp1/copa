"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Button } from "./ui";
import { useI18n } from "@/lib/i18n/context";

export function QRShare({ url, code }: { url: string; code: string }) {
  const { t } = useI18n();
  const [dataUrl, setDataUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    QRCode.toDataURL(url, {
      margin: 1,
      width: 320,
      color: { dark: "#14100f", light: "#fffdf8" },
      errorCorrectionLevel: "M",
    }).then(setDataUrl);
  }, [url]);

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Copa Ciega", text: t("qr.shareText", { code }), url });
        return;
      } catch {
        /* cancelado */
      }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="rounded-2xl bg-[#fffdf8] p-4 shadow-lg">
        {dataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={dataUrl} alt="QR" width={256} height={256} className="h-56 w-56" />
        ) : (
          <div className="h-56 w-56 animate-pulse rounded-xl bg-black/10" />
        )}
      </div>
      <div className="text-center">
        <p className="text-sm text-marfil/70">{t("qr.eventCode")}</p>
        <p className="font-mono text-4xl font-bold tracking-[0.3em] text-dorado">{code}</p>
      </div>
      <Button variant="gold" onClick={share}>
        {copied ? t("qr.linkCopied") : t("qr.shareLink")}
      </Button>
    </div>
  );
}
