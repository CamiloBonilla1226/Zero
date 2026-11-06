-- Borra los pedidos de prueba de ZÉRO antes de abrir al público.
-- Se ejecuta en Supabase > SQL Editor (corre como postgres, así que RLS no lo bloquea:
-- desde la app ningún usuario puede borrar pedidos, solo verlos y cambiarles el estado).
--
-- IMPORTANTE: la base de datos es compartida entre negocios. Todo va filtrado por el
-- negocio_id de ZÉRO ('0c09f773-82c6-47c8-85e8-2fc909c7db1f', ver src/config/negocio.config.js);
-- nunca quites ese filtro.
--
-- Pasos:
--   1. Ejecuta SOLO el bloque "PASO 1" y revisa la lista: deben ser todos de prueba.
--   2. Ejecuta el bloque "PASO 2" completo. Muestra cuántos borró.
-- No se puede deshacer.

-- ─────────────────────────── PASO 1: revisar (no borra nada) ───────────────────────────
select id, creado_en, cliente_nombre, cliente_telefono, total, estado
from pedidos
where negocio_id = '0c09f773-82c6-47c8-85e8-2fc909c7db1f'
order by creado_en desc;

-- ─────────────────────────── PASO 2: borrar ───────────────────────────
-- Si solo quieres borrar los anteriores a una fecha (por ejemplo, si ya entró algún
-- pedido real), agrega a la condición:   and creado_en < '2026-11-07'
with borrados as (
  delete from pedidos
  where negocio_id = '0c09f773-82c6-47c8-85e8-2fc909c7db1f'
  returning id
)
select count(*) as pedidos_borrados from borrados;
