import { supabase } from './supabaseClient'

// Notificaciones push de pedidos nuevos en el panel (PWA). La Edge Function
// notificar-pedido-nuevo envía; aquí solo se suscribe este dispositivo y se guarda la
// suscripción en suscripciones_push (la RLS deja a cada usuario ver y manejar solo las suyas).

const CLAVE_PUBLICA = import.meta.env.VITE_VAPID_PUBLIC_KEY

export function pushSoportado() {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window &&
    Boolean(CLAVE_PUBLICA)
  )
}

export function esIPhone() {
  const { userAgent, platform, maxTouchPoints } = navigator
  // iPadOS se presenta como Mac: se reconoce por la pantalla táctil.
  return /iPhone|iPad|iPod/.test(userAgent) || (platform === 'MacIntel' && maxTouchPoints > 1)
}

// En iPhone las notificaciones solo existen con la app instalada en la pantalla de inicio.
export function appInstalada() {
  return window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true
}

// El service worker solo se registra en producción y bajo /admin (ver src/pwaAdmin.js).
async function registroDelPanel() {
  const registro = await navigator.serviceWorker.getRegistration('/admin')
  if (!registro) return null
  return registro.active ? registro : navigator.serviceWorker.ready
}

export async function suscripcionActual() {
  if (!pushSoportado()) return null
  const registro = await registroDelPanel()
  return registro ? registro.pushManager.getSubscription() : null
}

function claveABytes(base64) {
  const relleno = '='.repeat((4 - (base64.length % 4)) % 4)
  const binario = atob((base64 + relleno).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(binario, (letra) => letra.charCodeAt(0))
}

// Guarda (o actualiza, por endpoint) la suscripción de este dispositivo a nombre del usuario
// de la sesión. usuario_id y negocio_id salen de la sesión, no de nada que se pueda editar.
export async function guardarSuscripcion(suscripcion, { usuarioId, negocioId }) {
  const { keys } = suscripcion.toJSON()
  const { error } = await supabase.from('suscripciones_push').upsert(
    {
      negocio_id: negocioId,
      usuario_id: usuarioId,
      endpoint: suscripcion.endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      user_agent: navigator.userAgent.slice(0, 500),
    },
    { onConflict: 'endpoint' }
  )
  return { error }
}

// Suscribe este dispositivo. El permiso ya debe estar concedido: Notification.requestPermission()
// se pide en el componente, directo en el toque (iPhone lo exige así).
export async function suscribir(sesion) {
  const registro = await registroDelPanel()
  if (!registro) throw new Error('El panel todavía no terminó de instalarse. Recarga la página e intenta de nuevo.')
  const suscripcion =
    (await registro.pushManager.getSubscription()) ??
    (await registro.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: claveABytes(CLAVE_PUBLICA) }))
  const { error } = await guardarSuscripcion(suscripcion, sesion)
  if (error) throw error
  return suscripcion
}

// Desuscribe este dispositivo y borra su fila. Primero se borra la fila (necesita la sesión
// activa por la RLS) y después se cancela en el navegador.
export async function desuscribir() {
  const suscripcion = await suscripcionActual()
  if (!suscripcion) return
  const { error } = await supabase.from('suscripciones_push').delete().eq('endpoint', suscripcion.endpoint)
  if (error) console.warn('[notificacionesPush] No se pudo borrar la suscripción:', error)
  await suscripcion.unsubscribe()
}

// Al cerrar sesión: que otra persona que entre en este mismo celular no reciba avisos de la
// cuenta anterior. Nunca bloquea el cierre de sesión por más de 3 segundos.
export async function desuscribirAlCerrarSesion() {
  try {
    await Promise.race([desuscribir(), new Promise((resolver) => setTimeout(resolver, 3000))])
  } catch (error) {
    console.warn('[notificacionesPush] No se pudo quitar la suscripción al cerrar sesión:', error)
  }
}
