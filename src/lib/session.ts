import "server-only";
import { cookies } from "next/headers";

/**
 * Sesiones sin cuentas (PRD §11): cookies HttpOnly con tokens UUID temporales.
 * - host_<code>  -> hostToken del evento
 * - part_<code>  -> participantId:token
 */
const MAX_AGE = 60 * 60 * 24 * 7; // 7 días

export async function setHostCookie(code: string, hostToken: string) {
  const c = await cookies();
  c.set(`host_${code}`, hostToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function getHostToken(code: string): Promise<string | null> {
  const c = await cookies();
  return c.get(`host_${code}`)?.value ?? null;
}

export async function setParticipantCookie(
  code: string,
  participantId: string,
  token: string,
) {
  const c = await cookies();
  c.set(`part_${code}`, `${participantId}:${token}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function getParticipantSession(
  code: string,
): Promise<{ participantId: string; token: string } | null> {
  const c = await cookies();
  const raw = c.get(`part_${code}`)?.value;
  if (!raw) return null;
  const [participantId, token] = raw.split(":");
  if (!participantId || !token) return null;
  return { participantId, token };
}
