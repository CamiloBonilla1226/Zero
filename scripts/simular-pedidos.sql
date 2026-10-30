-- Simula 20 pedidos entre el 2026-05-29 y el 2026-09-29 para probar el dashboard y el
-- asistente del negocio. Se ejecuta UNA vez en Supabase > SQL Editor (corre como postgres,
-- así que no le afecta RLS).
--
-- Cómo funciona:
--   * Usa los productos REALES del negocio (con su precio de oferta o normal), así que los
--     nombres coinciden con los del catálogo y "productos sin ventas" se calcula bien.
--   * Las fechas se reparten con más peso en viernes/sábado y muy poco en martes, para que el
--     asistente tenga un día fuerte y uno flojo que detectar.
--   * Todos los pedidos simulados llevan "[SIM]" al inicio del nombre del cliente y el
--     teléfono 3000000000, para poder borrarlos con el script de limpieza de abajo.
--
-- Ojo: el panel de Pedidos solo muestra los últimos 30 días y el asistente analiza los
-- últimos 90 días; los pedidos anteriores existen en la base pero no aparecen ahí.

do $$
declare
  v_negocio   uuid := '8ea9a00c-f4aa-4360-b74a-2ccac581a8c7';
  v_inicio    date := date '2026-05-29';
  v_fin       date := date '2026-09-29';
  v_cantidad  int  := 20;
  v_nombres   text[] := array['Camilo', 'Laura', 'Andrés', 'Valentina', 'Juan', 'Sofía', 'Mateo', 'Daniela', 'Sebastián', 'Carolina'];
  v_barrios   text[] := array['Calle 10 # 5-20', 'Carrera 7 # 45-12', 'Av. 30 # 12-80', 'Calle 50 # 20-15', 'Carrera 15 # 8-33'];
  v_estados   text[] := array['entregado', 'entregado', 'entregado', 'entregado', 'aprobado', 'en_preparacion', 'rechazado'];
  i           int;
  v_dia       date;
  v_peso      numeric;
  v_detalle   jsonb;
  v_total     numeric;
  v_estado    text;
  r           record;
  v_cant      int;
  v_subtotal  numeric;
begin
  if not exists (select 1 from productos where negocio_id = v_negocio) then
    raise exception 'El negocio % no tiene productos; crea algunos antes de simular pedidos.', v_negocio;
  end if;

  for i in 1..v_cantidad loop
    -- Elige un día del rango con probabilidad según el día de la semana.
    loop
      v_dia := v_inicio + floor(random() * (v_fin - v_inicio + 1))::int;
      v_peso := case extract(dow from v_dia)::int
        when 5 then 1.0   -- viernes
        when 6 then 1.0   -- sábado
        when 0 then 0.7   -- domingo
        when 2 then 0.1   -- martes (día flojo)
        else 0.35
      end;
      exit when random() < v_peso;
    end loop;

    -- 1 a 3 productos distintos, 1 a 3 unidades de cada uno.
    v_detalle := '[]'::jsonb;
    v_total := 0;
    for r in
      select id, nombre, coalesce(precio_oferta, precio) as precio_unitario
      from productos
      where negocio_id = v_negocio
      order by random()
      limit 1 + floor(random() * 3)::int
    loop
      v_cant := 1 + floor(random() * 3)::int;
      v_subtotal := r.precio_unitario * v_cant;
      v_total := v_total + v_subtotal;
      v_detalle := v_detalle || jsonb_build_object(
        'producto_id', r.id,
        'nombre', r.nombre,
        'variante_elegida', null,
        'cantidad', v_cant,
        'precio_base', r.precio_unitario,
        'opciones_elegidas', '[]'::jsonb,
        'subtotal', v_subtotal
      );
    end loop;

    -- Los pedidos de los últimos 2 días quedan "nuevo" (aún sin atender); el resto, variados.
    v_estado := case
      when v_dia >= v_fin - 1 then 'nuevo'
      else v_estados[1 + floor(random() * array_length(v_estados, 1))::int]
    end;

    insert into pedidos (negocio_id, cliente_nombre, cliente_telefono, direccion, productos_detalle, total, estado, creado_en)
    values (
      v_negocio,
      '[SIM] ' || v_nombres[1 + floor(random() * array_length(v_nombres, 1))::int],
      '3000000000',
      v_barrios[1 + floor(random() * array_length(v_barrios, 1))::int],
      v_detalle,
      v_total,
      v_estado,
      -- Hora entre las 12:00 y las 23:00, hora de Colombia.
      (v_dia + time '12:00' + (random() * interval '11 hours')) at time zone 'America/Bogota'
    );
  end loop;

  raise notice 'Listo: % pedidos simulados.', v_cantidad;
end
$$;

-- ---------------------------------------------------------------------------------------
-- LIMPIEZA: para borrar todos los pedidos simulados, ejecuta SOLO esta línea:
--
--   delete from pedidos where cliente_nombre like '[SIM]%';
-- ---------------------------------------------------------------------------------------
