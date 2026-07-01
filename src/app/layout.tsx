import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Copa Ciega — Catas ciegas en grupo",
  description:
    "Organiza catas ciegas de vino y otras bebidas. Crea un evento, comparte el QR y descubre quién tiene el mejor paladar.",
  applicationName: "Copa Ciega",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Copa Ciega" },
};

export const viewport: Viewport = {
  themeColor: "#14100f",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
