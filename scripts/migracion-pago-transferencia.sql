-- Método de pago en el checkout: efectivo o transferencia (Nequi, Bancolombia, Bre-B).
-- Con transferencia el cliente debe subir el comprobante antes de poder enviar el pedido.
-- Ver sección 24 de explicacion-script-bd.txt.
--
-- Se ejecuta UNA vez, completo, en Supabase > SQL Editor. Es seguro para los pedidos que ya
-- existen: las columnas nuevas quedan en null / false para ellos.

-- ─────────────────────────── 1. pedidos: método y comprobante ───────────────────────────
alter table pedidos
  add column metodo_pago text,
  add column comprobante_path text,
  add column pago_verificado boolean not null default false;

-- Solo dos valores; null queda permitido para los pedidos anteriores a este cambio.
alter table pedidos add constraint pedidos_metodo_pago_check
  check (metodo_pago in ('efectivo', 'transferencia'));

-- La regla de negocio también la aplica la base, no solo el formulario: un pedido por
-- transferencia no se puede crear sin comprobante, y el comprobante tiene que estar en la
-- carpeta del mismo negocio (nadie puede apuntar al archivo de otro negocio).
alter table pedidos add constraint pedidos_comprobante_transferencia_check
  check (
    metodo_pago is distinct from 'transferencia'
    or (comprobante_path is not null and comprobante_path like negocio_id::text || '/%')
  );

-- ─────────────────────────── 2. negocio_config: datos para transferir ───────────────────────────
-- JSON con un objeto por medio (nequi, bancolombia, breb). Lo edita el panel en
-- Admin → Negocio y lo lee el checkout público (negocio_config ya tiene lectura pública).
alter table negocio_config add column datos_pago jsonb;

-- ─────────────────────────── 3. Bucket privado de comprobantes ───────────────────────────
-- PRIVADO: un comprobante muestra nombre, banco y a veces número de cuenta del cliente.
-- Límite de 5 MB y solo imágenes (el checkout las comprime a WebP antes de subir).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('comprobantes-pago', 'comprobantes-pago', false, 5242880,
        array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;

-- El cliente (sin login) solo puede SUBIR, y solo dentro de una carpeta de un negocio
-- activo. No tiene política de select, update ni delete: no puede ver, listar, cambiar ni
-- borrar ningún comprobante, ni siquiera el suyo.
create policy "Clientes suben comprobantes de pago"
on storage.objects for insert to anon, authenticated
with check (
  bucket_id = 'comprobantes-pago'
  and exists (
    select 1 from negocios n
    where n.id::text = (storage.foldername(name))[1]
      and n.activo = true
  )
);

-- Ver los comprobantes (el panel genera un enlace firmado temporal): el dueño del negocio
-- o los empleados activos con permiso de Pedidos, siempre por app_metadata.
create policy "Dueño o empleados con permiso ven comprobantes"
on storage.objects for select to authenticated
using (
  bucket_id = 'comprobantes-pago'
  and (storage.foldername(name))[1] = (auth.jwt() -> 'app_metadata' ->> 'negocio_id')
  and (
    (auth.jwt() -> 'app_metadata' ->> 'rol') = 'dueño'
    or exists (
      select 1 from usuarios_admin ua
      where ua.negocio_id::text = (storage.foldername(name))[1]
        and ua.numero = split_part(auth.jwt() ->> 'email', '.', 1)
        and ua.activo = true and ua.puede_pedidos = true
    )
  )
);

-- ─────────────────────────── 4. Verificación (solo lectura) ───────────────────────────
select column_name, data_type
from information_schema.columns
where (table_name = 'pedidos' and column_name in ('metodo_pago', 'comprobante_path', 'pago_verificado'))
   or (table_name = 'negocio_config' and column_name = 'datos_pago');
