-- Copa Ciega — esquema Supabase (PRD §12)
-- Ejecutar en el SQL editor de tu proyecto Supabase.
-- El almacenamiento actual (src/lib/store.ts) es en memoria para desarrollo;
-- este esquema es el destino de producción. Un adaptador debe implementar la
-- misma API que store.ts usando estas tablas.

create extension if not exists "pgcrypto";

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  title text not null,
  modality text not null default 'tinto',
  status text not null default 'lobby' check (status in ('lobby','tasting','closed','revealed')),
  current_index int not null default 0,
  host_token text not null,          -- secreto, nunca se expone a participantes
  created_at timestamptz not null default now()
);

create table if not exists items (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  position int not null,
  name text not null,                -- oculto hasta la revelación
  producer text,
  grape text,
  region text,
  price numeric,
  image_url text
);
create index if not exists items_event_idx on items(event_id);

create table if not exists participants (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  name text not null,
  token text not null,               -- secreto por participante
  created_at timestamptz not null default now()
);
create index if not exists participants_event_idx on participants(event_id);
-- nombre único por evento (case-insensitive); expresión => índice aparte
create unique index if not exists participants_event_name_idx
  on participants (event_id, lower(name));

create table if not exists evaluations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  item_id uuid not null references items(id) on delete cascade,
  participant_id uuid not null references participants(id) on delete cascade,
  -- características de sabor: ejes bipolares 1-10
  acidity int not null default 5,   -- 1 = débil, 10 = ácido
  sweetness int not null default 5, -- 1 = seco, 10 = dulce
  tannin int not null default 5,    -- 1 = suave, 10 = tánico
  body int not null default 5,      -- 1 = ligero, 10 = poderoso
  overall int not null,
  notes text,
  estimated_grape text,
  estimated_price numeric,
  updated_at timestamptz not null default now(),
  unique (item_id, participant_id)
);
create index if not exists evaluations_event_idx on evaluations(event_id);

-- Realtime (reemplaza al polling):
-- alter publication supabase_realtime add table events, participants, evaluations;

-- RLS: todas las escrituras van por Server Actions con la service role key.
-- Lecturas públicas (nombres reales de items sólo se filtran en la capa de app
-- hasta la revelación). Ajustar políticas según necesidad.
