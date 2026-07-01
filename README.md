# 🍷 Copa Ciega

PWA para organizar **catas ciegas** de vino y otras bebidas en grupo. El
anfitrión crea un evento, comparte un QR, y los participantes puntúan cada
muestra a ciegas. Al cerrar, se revelan ranking, sorpresas y el perfil de cada
catador.

## Stack

- **Next.js 16** (App Router) + React 19 + TypeScript
- **Tailwind CSS 4** — paleta burdeo / negro / marfil / dorado, tipografía Inter
- **Sesiones sin cuentas** — cookies HttpOnly con tokens UUID temporales (PRD §11)
- **Autosave** de cada respuesta con debounce
- **Tiempo real** mediante polling ligero (`usePolling`), listo para migrar a
  Supabase Realtime
- **PWA** instalable (manifest + tema oscuro)

## Cómo funciona

| Flujo | Ruta |
|-------|------|
| Inicio / unirse | `/` |
| Crear cata | `/create` |
| Panel anfitrión (QR, controles, resultados en vivo) | `/host/[code]` |
| Unirse desde QR | `/join/[code]` |
| Evaluar muestras | `/play/[code]` |
| Resultados + perfil del catador | `/results/[code]` |

Estados del evento: `lobby → tasting → closed → revealed`.

## Desarrollo

```bash
npm run dev
```

Por defecto usa un **almacenamiento en memoria** (`src/lib/store.ts`) — el app
funciona de inmediato sin base de datos, ideal para probar el flujo completo
abriendo `/host/...` en un dispositivo y `/join/...` en otro.

## Producción con Supabase

1. Crea un proyecto en Supabase y ejecuta [`supabase/schema.sql`](supabase/schema.sql).
2. Copia `.env.example` a `.env.local` y completa las claves.
3. Implementa un adaptador con la misma API que `src/lib/store.ts` usando las
   tablas del esquema; opcionalmente reemplaza el polling por Supabase Realtime.

## Modalidades soportadas

Vino tinto, blanco, rosado, espumante, whisky, gin, ron, cerveza, café, té,
chocolate, aceite de oliva, agua mineral, quesos, embutidos y maridajes — cada
una con sus propios descriptores de aroma.
