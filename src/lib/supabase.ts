import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/** ¿Hay credenciales de Supabase? Si no, se usa el store en memoria. */
export function hasSupabase(): boolean {
  return Boolean(url && serviceKey);
}

const g = globalThis as unknown as { __sbAdmin?: SupabaseClient };

/**
 * Cliente con service role, SOLO para uso en servidor (Server Actions, route
 * handlers, Server Components). Salta RLS: todo el acceso está mediado por el
 * servidor, así que no exponemos esta clave al navegador.
 */
export function admin(): SupabaseClient {
  if (!url || !serviceKey) throw new Error("Supabase no está configurado");
  g.__sbAdmin ??= createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return g.__sbAdmin;
}
