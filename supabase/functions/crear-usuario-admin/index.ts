// Edge Function: crear-usuario-admin
//
// Por qué existe: las políticas RLS de este proyecto identifican el negocio y el rol de
// cada usuario admin a través de `auth.jwt() -> 'app_metadata'`, no de `user_metadata`.
// A diferencia de user_metadata, app_metadata NO se puede escribir desde el navegador
// bajo ninguna circunstancia (ni con la anon key ni con una sesión autenticada) — solo
// desde un entorno de servidor con la service_role key. Por eso crear un usuario admin
// (dueño creando un empleado) ya no puede hacerse con un signUp normal desde el cliente:
// esta función corre en el servidor de Supabase y es la única pieza del proyecto que
// usa la service_role key.
//
// Seguridad: quien llama a esta función debe ser, él mismo, un usuario admin autenticado
// con rol `dueño`. El negocio_id del nuevo usuario se toma del propio `dueño` que llama
// (de su app_metadata verificado por el JWT), nunca del cuerpo de la petición — así un
// dueño no puede, ni por error ni manipulando el body, crear un usuario para un negocio
// distinto al suyo.
import { createClient } from 'jsr:@supabase/supabase-js@2'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function respuesta(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}

// Debe coincidir exactamente con numeroACorreoInterno de src/lib/phoneAuth.js. No se
// puede importar ese archivo aquí porque esta función corre en Deno, en un entorno de
// despliegue separado del bundle de Vite — si esa lógica cambia en el frontend, hay que
// replicar el cambio aquí también.
const DOMINIO_INTERNO = 'interno.local'
function numeroACorreoInterno(numero: string, negocioId: string) {
  const numeroLimpio = numero.replace(/\D/g, '')
  return `${numeroLimpio}.${negocioId}@${DOMINIO_INTERNO}`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    const { numero, contrasena, nombre, rol } = await req.json()

    if (!numero || !contrasena || !nombre || !rol) {
      return respuesta({ error: 'Faltan datos: numero, contrasena, nombre y rol son obligatorios.' }, 400)
    }
    if (!['dueño', 'empleado'].includes(rol)) {
      return respuesta({ error: 'Rol inválido.' }, 400)
    }
    if (String(contrasena).length < 6) {
      return respuesta({ error: 'La contraseña debe tener al menos 6 caracteres.' }, 400)
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return respuesta({ error: 'No autenticado.' }, 401)
    }

    // Cliente "de quien llama": usa la anon key + el JWT de la petición para identificar
    // de forma verificada quién está invocando la función (no confiar en nada del body).
    const clienteSolicitante = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: datosSolicitante, error: errorSolicitante } = await clienteSolicitante.auth.getUser()
    if (errorSolicitante || !datosSolicitante?.user) {
      return respuesta({ error: 'No autenticado.' }, 401)
    }

    const solicitante = datosSolicitante.user
    const rolSolicitante = solicitante.app_metadata?.rol
    const negocioIdSolicitante = solicitante.app_metadata?.negocio_id

    if (rolSolicitante !== 'dueño' || !negocioIdSolicitante) {
      return respuesta({ error: 'Solo el dueño del negocio puede crear usuarios.' }, 403)
    }

    // Cliente con service_role: el único punto del proyecto autorizado a escribir
    // app_metadata. La variable SUPABASE_SERVICE_ROLE_KEY la inyecta Supabase
    // automáticamente en el entorno de la función; nunca debe exponerse al cliente.
    const clienteAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const negocioId = negocioIdSolicitante
    const correoInterno = numeroACorreoInterno(numero, negocioId)

    const { data: usuarioCreado, error: errorCrear } = await clienteAdmin.auth.admin.createUser({
      email: correoInterno,
      password: contrasena,
      email_confirm: true,
    })

    if (errorCrear) {
      const mensaje = errorCrear.message.includes('already been registered')
        ? 'Ya existe un usuario con ese número en este negocio.'
        : errorCrear.message
      return respuesta({ error: mensaje }, 400)
    }

    const { error: errorMetadata } = await clienteAdmin.auth.admin.updateUserById(usuarioCreado.user.id, {
      app_metadata: { negocio_id: negocioId, rol },
    })

    if (errorMetadata) {
      // El usuario de Auth ya existe pero sin metadata correcta: se revierte para no
      // dejar una cuenta a medias que nunca pasaría el RLS.
      await clienteAdmin.auth.admin.deleteUser(usuarioCreado.user.id)
      return respuesta({ error: 'No se pudo asignar el negocio/rol al usuario.' }, 500)
    }

    // El registro en usuarios_admin se crea aquí, con el cliente service_role, en vez de
    // dejar que el frontend lo inserte por separado después de invocar esta función. Antes,
    // un fallo del insert (por ejemplo, RLS sin políticas, como pasó en la práctica) dejaba
    // un usuario "fantasma": creado en auth.users con su app_metadata correcta, pero sin fila
    // en usuarios_admin. Haciendo ambos pasos en el servidor, todo el alta queda como una
    // sola operación: si el insert falla, se revierte el usuario de Auth igual que arriba.
    //
    // `id` se fija igual al uid de auth.users (en vez de dejar que usuarios_admin genere el
    // suyo propio) para que eliminar-usuario-admin pueda borrar la cuenta de Auth
    // correspondiente sin tener que buscarla por email — ver ese archivo para el porqué.
    const { error: errorInsertar } = await clienteAdmin.from('usuarios_admin').insert({
      id: usuarioCreado.user.id,
      negocio_id: negocioId,
      numero: numero.replace(/\D/g, ''),
      nombre: String(nombre).trim(),
      rol,
    })

    if (errorInsertar) {
      await clienteAdmin.auth.admin.deleteUser(usuarioCreado.user.id)
      return respuesta({ error: 'No se pudo registrar el usuario en usuarios_admin.' }, 500)
    }

    return respuesta({ exito: true, id: usuarioCreado.user.id })
  } catch (error) {
    return respuesta({ error: error instanceof Error ? error.message : 'Error inesperado.' }, 500)
  }
})
