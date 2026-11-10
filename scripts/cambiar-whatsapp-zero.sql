-- Cambia el WhatsApp de ZÉRO de 3146032055 a 3009703038 en la base (2026-11-10).
-- El código ya usa el número nuevo (src/config/negocio.config.js → whatsappContacto: los
-- pedidos del checkout y el botón de WhatsApp de Inicio). Aquí se actualizan los dos datos
-- que viven en Supabase:
--   - negocios.whatsapp_contacto: la fila del negocio (la administra el panel maestro).
--   - negocio_config.redes_sociales.whatsapp: el enlace de "Sobre nosotros" (también se puede
--     cambiar en Admin → Negocio → Redes sociales → WhatsApp).
-- Filtrado por el negocio_id de ZÉRO: la base es compartida con otros negocios.

update negocios
set whatsapp_contacto = '573009703038'
where id = '0c09f773-82c6-47c8-85e8-2fc909c7db1f';

update negocio_config
set redes_sociales = jsonb_set(coalesce(redes_sociales, '{}'::jsonb), '{whatsapp}', '"https://wa.me/573009703038"')
where negocio_id = '0c09f773-82c6-47c8-85e8-2fc909c7db1f';

-- Verificación (solo lectura): las dos columnas deben mostrar 573009703038.
select n.whatsapp_contacto, c.redes_sociales ->> 'whatsapp' as whatsapp_redes
from negocios n
join negocio_config c on c.negocio_id = n.id
where n.id = '0c09f773-82c6-47c8-85e8-2fc909c7db1f';
