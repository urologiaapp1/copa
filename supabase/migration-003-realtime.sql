-- Copa Ciega — migración 003: habilitar Realtime
-- Agrega las tablas del evento a la publicación de Realtime para que el puente
-- SSE reciba los cambios al instante. El servidor se suscribe con service role
-- (salta RLS), así que no se requieren políticas para esto.
-- Ejecutar en el SQL Editor de Supabase.

alter publication supabase_realtime add table events, participants, evaluations, items;

-- Si alguna tabla ya estuviera en la publicación y da error "is already member",
-- quítala de la lista de arriba y vuelve a ejecutar con las restantes.
