// Edge Function: notificar-pedido-nuevo
//
// Por qué existe: el aviso de pedido nuevo dentro del panel (useAvisoPedidos) solo funciona
// con el panel abierto en pantalla. Para que el dueño o un empleado se entere con el celular
// bloqueado o la app cerrada hace falta una notificación push, y esa solo la puede mandar un
// servidor con la clave privada VAPID. Esta función la manda.
//
// Quién la llama: un Database Webhook de Supabase en INSERT de la tabla pedidos (ver
// CHANGELOG.md para su configuración). Se despliega con --no-verify-jwt porque el webhook no
// manda el JWT de un usuario; en su lugar se exige el header x-webhook-secret, que debe
// coincidir con el secreto PUSH_WEBHOOK_SECRET. Sin ese header correcto responde 401.
//
// Seguridad:
// - El negocio_id sale del pedido insertado (record), nunca de otro lado.
// - Solo se notifica a suscripciones de ese negocio cuyo usuario esté activo en
//   usuarios_admin y sea dueño o tenga puede_pedidos.
// - El usuario se identifica igual que en todas las políticas RLS del proyecto: por el número
//   que va en su correo interno ("numero.negocio_id@interno.local", ver lib/phoneAuth.js), no
//   por usuarios_admin.id. El dueño se crea a mano y su id en usuarios_admin no tiene por qué
//   coincidir con su uid de Auth.
// - El mensaje solo lleva el nombre del cliente y el total: nada de dirección ni teléfono,
//   porque la notificación se ve en la pantalla bloqueada.
import { createClient } from 'jsr:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

function respuesta(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

// Comparación en tiempo constante, para no filtrar el secreto por cuánto tarda en fallar.
function mismoSecreto(recibido: string, esperado: string) {
  const a = new TextEncoder().encode(recibido)
  const b = new TextEncoder().encode(esperado)
  let diferencia = a.length ^ b.length
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    diferencia |= (a[i] ?? 0) ^ (b[i] ?? 0)
  }
  return diferencia === 0
}

const formatoPrecio = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return respuesta({ error: 'Método no permitido.' }, 405)
  }

  const secreto = Deno.env.get('PUSH_WEBHOOK_SECRET') ?? ''
  const recibido = req.headers.get('x-webhook-secret') ?? ''
  if (!secreto || !mismoSecreto(recibido, secreto)) {
    return respuesta({ error: 'No autorizado.' }, 401)
  }

  try {
    const { type, table, record } = await req.json()

    // Solo pedidos nuevos: un cambio de estado no es un pedido nuevo.
    if (type !== 'INSERT' || table !== 'pedidos' || !record) {
      return respuesta({ ignorado: true })
    }

    const negocioId = record.negocio_id
    if (!negocioId) {
      return respuesta({ error: 'El pedido no trae negocio_id.' }, 400)
    }

    // Cliente con service_role: lee suscripciones y usuarios de todo el negocio, cosa que la
    // RLS no le permite a nadie desde el navegador. SUPABASE_SERVICE_ROLE_KEY la inyecta
    // Supabase en el entorno de la función; nunca debe exponerse al cliente.
    const clienteAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: suscripciones, error: errorSuscripciones } = await clienteAdmin
      .from('suscripciones_push')
      .select('id, usuario_id, endpoint, p256dh, auth')
      .eq('negocio_id', negocioId)

    if (errorSuscripciones) {
      return respuesta({ error: 'No se pudieron leer las suscripciones.' }, 500)
    }
    if (!suscripciones?.length) {
      return respuesta({ enviadas: 0, motivo: 'Sin suscripciones en este negocio.' })
    }

    // uid de Auth → número de teléfono, solo para usuarios de ESTE negocio (app_metadata la
    // escribe solo el servidor, ver crear-usuario-admin).
    const numeroPorUsuario = new Map<string, string>()
    // Cada consulta va aislada: un usuario que ya no existe (o un id raro) no debe dejar sin
    // aviso a los demás.
    for (const usuarioId of new Set(suscripciones.map((s) => s.usuario_id))) {
      try {
        const { data, error } = await clienteAdmin.auth.admin.getUserById(usuarioId)
        const usuario = data?.user
        if (error || !usuario?.email || usuario.app_metadata?.negocio_id !== negocioId) continue
        numeroPorUsuario.set(usuarioId, usuario.email.split('.')[0])
      } catch (error) {
        console.warn('[notificar-pedido-nuevo] No se pudo leer el usuario de una suscripción:', error)
      }
    }

    const numeros = [...new Set(numeroPorUsuario.values())]
    const numerosPermitidos = new Set<string>()
    if (numeros.length > 0) {
      const { data: usuarios, error: errorUsuarios } = await clienteAdmin
        .from('usuarios_admin')
        .select('numero, rol, activo, puede_pedidos')
        .eq('negocio_id', negocioId)
        .in('numero', numeros)

      if (errorUsuarios) {
        return respuesta({ error: 'No se pudieron leer los usuarios del panel.' }, 500)
      }
      for (const usuario of usuarios ?? []) {
        if (usuario.activo === true && (usuario.rol === 'dueño' || usuario.puede_pedidos === true)) {
          numerosPermitidos.add(usuario.numero)
        }
      }
    }

    const destinos = suscripciones.filter((s) => numerosPermitidos.has(numeroPorUsuario.get(s.usuario_id) ?? ''))
    if (destinos.length === 0) {
      return respuesta({ enviadas: 0, motivo: 'Ninguna suscripción con permiso de Pedidos.' })
    }

    webpush.setVapidDetails(
      Deno.env.get('VAPID_SUBJECT') ?? '',
      Deno.env.get('VAPID_PUBLIC_KEY') ?? '',
      Deno.env.get('VAPID_PRIVATE_KEY') ?? ''
    )

    const total = Number(record.total)
    const cliente = String(record.cliente_nombre ?? '').trim() || 'Cliente'
    const payload = JSON.stringify({
      titulo: 'Pedido nuevo',
      cuerpo: Number.isFinite(total) ? `${cliente} · ${formatoPrecio.format(total)}` : cliente,
      url: '/admin/pedidos',
      pedidoId: record.id ?? null,
    })

    // allSettled: si una suscripción falla, las demás se envían igual.
    const resultados = await Promise.allSettled(
      destinos.map((s) =>
        webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, {
          TTL: 60 * 60,
          urgency: 'high',
        })
      )
    )

    // 404/410: el navegador ya no tiene esa suscripción (se desinstaló la app, se quitó el
    // permiso...). Se borra para no seguir intentando.
    const vencidas: string[] = []
    let enviadas = 0
    resultados.forEach((resultado, i) => {
      if (resultado.status === 'fulfilled') {
        enviadas++
        return
      }
      const codigo = (resultado.reason as { statusCode?: number })?.statusCode
      if (codigo === 404 || codigo === 410) {
        vencidas.push(destinos[i].id)
      } else {
        console.warn('[notificar-pedido-nuevo] Falló un envío:', codigo ?? resultado.reason)
      }
    })

    if (vencidas.length > 0) {
      const { error: errorBorrar } = await clienteAdmin.from('suscripciones_push').delete().in('id', vencidas)
      if (errorBorrar) console.warn('[notificar-pedido-nuevo] No se pudieron borrar suscripciones vencidas:', errorBorrar)
    }

    return respuesta({ enviadas, fallidas: destinos.length - enviadas, borradas: vencidas.length })
  } catch (error) {
    return respuesta({ error: error instanceof Error ? error.message : 'Error inesperado.' }, 500)
  }
})
