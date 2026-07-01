-- Copa Ciega — migración 002: cata avanzada (doble ciego, ritmo libre, SOS)
-- Ejecutar en el SQL Editor de Supabase.

alter table events add column if not exists double_blind boolean not null default false;
alter table events add column if not exists free_pace   boolean not null default false;
alter table events add column if not exists recovery_code text;

-- Búsqueda del código SOS al recuperar acceso admin
create index if not exists events_recovery_idx on events (recovery_code);
