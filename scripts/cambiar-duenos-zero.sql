-- Cambiar los datos del dueño de ZÉRO (número de usuario, nombre y contraseña) y dar de alta
-- un SEGUNDO dueño. Se hace una sola vez, en Supabase > SQL Editor (corre como postgres, con
-- acceso a auth.users; desde la app no se puede porque no hay service_role en el navegador).
--
-- IMPORTANTE:
-- - Escribe los datos reales SOLO en el SQL Editor de Supabase, nunca en este archivo del
--   repositorio: las contraseñas no deben quedar guardadas en git.
-- - Todo va filtrado por el negocio_id de ZÉRO ('0c09f773-82c6-47c8-85e8-2fc909c7db1f'). La
--   base es compartida con otros negocios: no lo cambies.
-- - El "usuario" para entrar al panel es un número (solo dígitos). Por dentro se guarda como
--   correo interno NUMERO.NEGOCIO_ID@interno.local (ver src/lib/phoneAuth.js).
--
-- Orden: PASO 0 (revisar) → PASO 1 (dueño actual) → PASO 2 (crear el segundo en el panel de
-- Supabase) → PASO 3 (convertirlo en dueño) → PASO 4 (revisar). Cada bloque se ejecuta solo,
-- seleccionándolo y dando Run. Los bloques 1 y 3 se detienen sin cambiar nada si algo no cuadra.


-- ─────────────────────────── PASO 0: ver los usuarios actuales (no cambia nada) ───────────────────────────
select ua.nombre, ua.numero, ua.rol, ua.activo, u.email, u.raw_app_meta_data ->> 'rol' as rol_en_auth
from usuarios_admin ua
left join auth.users u
  on u.email = ua.numero || '.' || ua.negocio_id || '@interno.local'
where ua.negocio_id = '0c09f773-82c6-47c8-85e8-2fc909c7db1f'
order by ua.rol, ua.nombre;


-- ─────────────────────────── PASO 1: cambiar número, nombre y contraseña del dueño actual ───────────────────────────
-- Reemplaza los 4 valores de "declare". Si no quieres cambiar algo, deja el mismo valor
-- (numero_nuevo = numero_actual) o, para la contraseña, déjala vacía ('').
do $$
declare
  v_negocio          uuid := '0c09f773-82c6-47c8-85e8-2fc909c7db1f';
  v_numero_actual    text := 'NUMERO_ACTUAL';     -- el que usa hoy para entrar (ver PASO 0)
  v_numero_nuevo     text := 'NUMERO_NUEVO';      -- el nuevo usuario (solo dígitos)
  v_nombre_nuevo     text := 'NOMBRE_NUEVO';
  v_contrasena_nueva text := 'CONTRASENA_NUEVA';  -- mínimo 6 caracteres, o '' para no cambiarla

  v_correo_actual text;
  v_correo_nuevo  text;
  v_usuario_id    uuid;
begin
  v_numero_actual := regexp_replace(v_numero_actual, '\D', '', 'g');
  v_numero_nuevo  := regexp_replace(v_numero_nuevo, '\D', '', 'g');
  v_correo_actual := v_numero_actual || '.' || v_negocio || '@interno.local';
  v_correo_nuevo  := v_numero_nuevo  || '.' || v_negocio || '@interno.local';

  if v_numero_nuevo = '' or trim(v_nombre_nuevo) = '' then
    raise exception 'El número nuevo y el nombre nuevo no pueden quedar vacíos.';
  end if;
  if v_contrasena_nueva <> '' and length(v_contrasena_nueva) < 6 then
    raise exception 'La contraseña debe tener al menos 6 caracteres.';
  end if;

  select id into v_usuario_id
  from auth.users
  where email = v_correo_actual
    and raw_app_meta_data ->> 'negocio_id' = v_negocio::text
    and raw_app_meta_data ->> 'rol' = 'dueño';
  if v_usuario_id is null then
    raise exception 'No hay un dueño de ZÉRO con el número %. Revisa el PASO 0.', v_numero_actual;
  end if;

  if v_numero_nuevo <> v_numero_actual
     and (exists (select 1 from auth.users where email = v_correo_nuevo)
          or exists (select 1 from usuarios_admin where negocio_id = v_negocio and numero = v_numero_nuevo)) then
    raise exception 'El número % ya lo usa otro usuario de ZÉRO.', v_numero_nuevo;
  end if;

  -- Cuenta de Auth: correo interno (= el número de usuario) y, si se pidió, la contraseña.
  -- bcrypt (gen_salt('bf')) es el mismo formato que usa Supabase Auth.
  update auth.users
  set email = v_correo_nuevo,
      encrypted_password = case
        when v_contrasena_nueva = '' then encrypted_password
        else extensions.crypt(v_contrasena_nueva, extensions.gen_salt('bf'))
      end,
      updated_at = now()
  where id = v_usuario_id;

  -- La identidad "email" guarda una copia del correo; se mantiene igual al de la cuenta.
  update auth.identities
  set identity_data = identity_data || jsonb_build_object('email', v_correo_nuevo),
      updated_at = now()
  where user_id = v_usuario_id and provider = 'email';

  -- Fila del panel (nombre que se ve, número con el que se busca su perfil).
  update usuarios_admin
  set numero = v_numero_nuevo,
      nombre = trim(v_nombre_nuevo)
  where negocio_id = v_negocio and numero = v_numero_actual;
  if not found then
    raise exception 'La cuenta existe pero no tiene fila en usuarios_admin con el número %.', v_numero_actual;
  end if;

  raise notice 'Listo: el dueño ahora entra con el número %.', v_numero_nuevo;
end $$;


-- ─────────────────────────── PASO 2: crear la cuenta del segundo dueño (en el panel de Supabase) ───────────────────────────
-- No es SQL. En Supabase: Authentication → Users → Add user → Create new user:
--   - Email:    NUMERO_SEGUNDO.0c09f773-82c6-47c8-85e8-2fc909c7db1f@interno.local
--               (NUMERO_SEGUNDO = el número con el que va a entrar, solo dígitos)
--   - Password: su contraseña (mínimo 6 caracteres)
--   - Marca "Auto Confirm User"
-- Después corre el PASO 3 con ese mismo número.


-- ─────────────────────────── PASO 3: convertir esa cuenta en dueño de ZÉRO ───────────────────────────
do $$
declare
  v_negocio uuid := '0c09f773-82c6-47c8-85e8-2fc909c7db1f';
  v_numero  text := 'NUMERO_SEGUNDO';   -- el mismo del PASO 2
  v_nombre  text := 'NOMBRE_SEGUNDO';

  v_correo     text;
  v_usuario_id uuid;
begin
  v_numero := regexp_replace(v_numero, '\D', '', 'g');
  v_correo := v_numero || '.' || v_negocio || '@interno.local';

  if v_numero = '' or trim(v_nombre) = '' then
    raise exception 'El número y el nombre no pueden quedar vacíos.';
  end if;

  select id into v_usuario_id from auth.users where email = v_correo;
  if v_usuario_id is null then
    raise exception 'No existe la cuenta %. Créala primero (PASO 2).', v_correo;
  end if;
  if exists (select 1 from usuarios_admin where negocio_id = v_negocio and numero = v_numero) then
    raise exception 'El número % ya tiene fila en usuarios_admin.', v_numero;
  end if;

  -- negocio_id y rol SIEMPRE en app_metadata (nunca user_metadata): es lo que leen las
  -- políticas RLS y el usuario no lo puede cambiar desde el navegador.
  update auth.users
  set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
        || jsonb_build_object('negocio_id', v_negocio::text, 'rol', 'dueño'),
      updated_at = now()
  where id = v_usuario_id;

  -- id = el mismo de auth.users, igual que hace la Edge Function crear-usuario-admin:
  -- eliminar-usuario-admin borra la cuenta de Auth usando ese id.
  insert into usuarios_admin (id, negocio_id, numero, nombre, rol)
  values (v_usuario_id, v_negocio, v_numero, trim(v_nombre), 'dueño');

  raise notice 'Listo: % es dueño de ZÉRO y entra con el número %.', trim(v_nombre), v_numero;
end $$;


-- ─────────────────────────── PASO 4: revisar (no cambia nada) ───────────────────────────
-- Deben salir los dos dueños, con rol "dueño" en las dos columnas y el correo lleno.
select ua.nombre, ua.numero, ua.rol, u.email, u.raw_app_meta_data ->> 'rol' as rol_en_auth
from usuarios_admin ua
left join auth.users u
  on u.email = ua.numero || '.' || ua.negocio_id || '@interno.local'
where ua.negocio_id = '0c09f773-82c6-47c8-85e8-2fc909c7db1f'
  and ua.rol = 'dueño';
