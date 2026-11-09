-- Máximo de adiciones por producto y por variante (ej. Pequeño: hasta 2, Grande: hasta 3).
-- El cliente puede repetir una adición (Leche x2) o no pedir ninguna. Ver sección 26 de
-- explicacion-script-bd.txt.
--
-- Se ejecuta UNA vez, completo, en Supabase > SQL Editor, ANTES de desplegar el formulario de
-- producto nuevo (que guarda cantidad_adiciones). Es seguro para lo que ya existe: la columna
-- queda en null = sin límite, que es exactamente como funciona hoy.

begin;

-- null = sin límite (comportamiento anterior) · 0 = no admite adiciones · N = máximo N.
alter table productos
  add column cantidad_adiciones int
    check (cantidad_adiciones between 0 and 20);

alter table variantes_producto
  add column cantidad_adiciones int
    check (cantidad_adiciones between 0 and 20);

comment on column productos.cantidad_adiciones is
  'Máximo de adiciones que el cliente puede agregar a este producto si NO tiene variantes. null = sin límite (por defecto), 0 = no admite adiciones. Se pueden repetir. Con variantes manda variantes_producto.cantidad_adiciones. Ver explicacion-script-bd.txt sección 26.';
comment on column variantes_producto.cantidad_adiciones is
  'Máximo de adiciones que el cliente puede agregar con esta variante. null = sin límite (por defecto), 0 = no admite adiciones. Se pueden repetir.';

commit;

-- Verificación (solo lectura): deben salir las dos columnas.
select table_name, column_name, data_type, is_nullable
from information_schema.columns
where column_name = 'cantidad_adiciones'
  and table_name in ('productos', 'variantes_producto');
