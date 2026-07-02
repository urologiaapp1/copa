import "server-only";
import { headers } from "next/headers";

/**
 * URL pública y canónica del sitio. En producción se fija por env var para
 * que los enlaces/QR compartidos NUNCA apunten a un alias de Vercel protegido
 * por su SSO (los dominios con el nombre del equipo, p. ej.
 * copa-ciega-<team>.vercel.app, exigen login de Vercel y rompen el enlace
 * para cualquiera que no sea el dueño del proyecto). En local, se arma desde
 * los headers de la petición.
 */
export async function getSiteOrigin(): Promise<string> {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, "");

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}
