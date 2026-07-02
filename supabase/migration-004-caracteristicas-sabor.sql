-- Migración 004 — Características de sabor (ejes bipolares)
-- La evaluación deja de usar aroma/sabor/equilibrio + aromas percibidos y pasa
-- a 4 ejes bipolares (1-10): Débil↔Ácido, Seco↔Dulce, Suave↔Tánico, Ligero↔Poderoso.
-- Se renombran las columnas existentes (conservan los datos) y se agrega la cuarta.
-- Las columnas would_buy, aromas y confidence quedan sin uso (no se escriben más).

alter table evaluations rename column aroma to acidity;
alter table evaluations rename column flavor to sweetness;
alter table evaluations rename column balance to tannin;
alter table evaluations add column if not exists body int not null default 5;
