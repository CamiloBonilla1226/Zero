-- El comprobante de transferencia ya no se sube a la plataforma: el cliente lo envía por
-- WhatsApp junto con el mensaje del pedido (decisión del dueño, 2026-11-09).
-- Ver sección 25 de explicacion-script-bd.txt.
--
-- Se ejecuta UNA vez, completo, en Supabase > SQL Editor, ANTES de desplegar el código nuevo:
-- mientras exista el check, un pedido por transferencia sin comprobante_path sería rechazado.

-- 1. Un pedido por transferencia ya no trae comprobante_path.
alter table pedidos drop constraint if exists pedidos_comprobante_transferencia_check;

-- 2. Nadie desde la carta vuelve a subir archivos al bucket: se cierra la escritura anónima.
--    El bucket y la política de lectura del panel se dejan para los comprobantes que ya se
--    subieron en las pruebas (el panel los sigue mostrando).
drop policy if exists "Clientes suben comprobantes de pago" on storage.objects;

-- 3. Verificación (solo lectura): las dos consultas deben devolver 0 filas.
select conname
from pg_constraint
where conrelid = 'pedidos'::regclass and conname = 'pedidos_comprobante_transferencia_check';

select policyname
from pg_policies
where schemaname = 'storage' and tablename = 'objects' and policyname = 'Clientes suben comprobantes de pago';
