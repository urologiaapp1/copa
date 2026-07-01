import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sin caracteres ambiguos

/** Código de evento de 6 caracteres, fácil de dictar. */
export function generateCode(): string {
  let out = "";
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  for (const b of bytes) out += ALPHABET[b % ALPHABET.length];
  return out;
}

export function generateToken(): string {
  return crypto.randomUUID();
}

export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function formatCLP(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(n);
}
