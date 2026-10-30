// Edge Function: eliminar-usuario-admin
//
// Por qué existe: hasta ahora, eliminar un empleado (ver useUsuariosAdmin.js) solo borraba
// su fila en `usuarios_admin`, dejando viva la cuenta correspondiente en `auth.users` (con
// su correo interno derivado del número). Si después se intentaba crear un usuario nuevo
// con ese mismo número, Supabase Auth rechazaba el alta porque ese correo ya existía
// ("already been registered") — el número quedaba "quemado" para siempre aunque ya no
// apareciera en la tabla de usuarios. Esta función borra ambas cosas en una sola operación,
// igual que crear-usuario-admin las crea juntas.
//
// Requiere que `usuarios_admin.id` sea igual al uid de auth.users (ver crear-usuario-admin,
// que ya lo fija así desde el alta) — así se puede borrar la cuenta de Auth directamente
// por id, sin tener que buscarla por correo entre TODOS los usuarios de este proyecto
// Supabase compartido (varios negocios conviven en la misma base).
//
// Seguridad: igual que crear-usuario-admin, solo el dueño autenticado del negocio puede
// invocarla, y el id a borrar se valida contra `negocio_id` del propio dueño (nunca se
// confía en el body para decidir de qué negocio es la fila) — así un dueño no puede borrar,
// ni por error ni manipulando la petición, un usuario de otro negocio.
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    const { id } = await req.json()

    if (!id) {
      return respuesta({ error: 'Falta el id del usuario a eliminar.' }, 400)
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return respuesta({ error: 'No autenticado.' }, 401)
    }

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
      return respuesta({ error: 'Solo el dueño del negocio puede eliminar usuarios.' }, 403)
    }

    const clienteAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Confirma que la fila exista y sea de este negocio ANTES de borrar nada — con
    // service_role no hay RLS que lo impida, así que esta consulta es la única barrera real
    // contra borrar el usuario de otro negocio.
    const { data: filaUsuario, error: errorConsulta } = await clienteAdmin
      .from('usuarios_admin')
      .select('id')
      .eq('id', id)
      .eq('negocio_id', negocioIdSolicitante)
      .maybeSingle()

    if (errorConsulta) {
      return respuesta({ error: 'No se pudo verificar el usuario a eliminar.' }, 500)
    }
    if (!filaUsuario) {
      return respuesta({ error: 'Ese usuario no existe en este negocio.' }, 404)
    }

    const { error: errorEliminarFila } = await clienteAdmin.from('usuarios_admin').delete().eq('id', id)
    if (errorEliminarFila) {
      return respuesta({ error: 'No se pudo eliminar el usuario.' }, 500)
    }

    // Si la fila ya se borró pero esto falla, el número queda temporalmente bloqueado para
    // reutilizarse (el problema original) — se reporta el error igual para que se note, en
    // vez de fallar en silencio.
    const { error: errorEliminarAuth } = await clienteAdmin.auth.admin.deleteUser(id)
    if (errorEliminarAuth) {
      return respuesta(
        { error: 'El usuario se quitó de la lista, pero no se pudo liberar su número. Contacta soporte.' },
        500
      )
    }

    return respuesta({ exito: true })
  } catch (error) {
    return respuesta({ error: error instanceof Error ? error.message : 'Error inesperado.' }, 500)
  }
})
