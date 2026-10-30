import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import {
  appInstalada,
  desuscribir,
  esIPhone,
  guardarSuscripcion,
  pushSoportado,
  suscribir,
  suscripcionActual,
} from '../../lib/notificacionesPush'

// Estado inicial, sin pasar por el service worker: lo que se sabe de una vez.
function estadoBase() {
  if (esIPhone() && !appInstalada()) return 'instalar-iphone'
  if (!pushSoportado()) return 'no-soportado'
  if (Notification.permission === 'denied') return 'bloqueado'
  return 'cargando'
}

const AYUDA_BLOQUEADO = esIPhone()
  ? 'Ábrelas en Ajustes del iPhone → Notificaciones → ZÉRO Admin → Permitir notificaciones.'
  : 'Ábrelas en Ajustes del celular → Aplicaciones → ZÉRO Admin (o Chrome) → Notificaciones, o en el candado junto a la dirección si usas el navegador.'

// Tarjeta "Notificaciones" del Inicio del panel: activa o desactiva los avisos push de pedidos
// nuevos en ESTE dispositivo (cada celular o computador se activa por separado).
export function Notificaciones() {
  const { usuario, negocioId } = useAuth()
  const [estado, setEstado] = useState(estadoBase)
  const [error, setError] = useState(null)

  // Si ya había suscripción, se vuelve a guardar en silencio: así la fila existe aunque la
  // Edge Function la haya borrado (410) o se haya perdido.
  useEffect(() => {
    if (estado !== 'cargando') return undefined
    let activo = true
    suscripcionActual()
      .then(async (suscripcion) => {
        if (!activo) return
        const vigente = suscripcion && Notification.permission === 'granted'
        setEstado(vigente ? 'activas' : 'inactivas')
        if (vigente && usuario) {
          const { error: errorGuardar } = await guardarSuscripcion(suscripcion, { usuarioId: usuario.id, negocioId })
          if (errorGuardar) console.warn('[Notificaciones] No se pudo sincronizar la suscripción:', errorGuardar)
        }
      })
      .catch(() => activo && setEstado('inactivas'))
    return () => {
      activo = false
    }
  }, [estado, usuario, negocioId])

  const activar = () => {
    setError(null)
    // requestPermission va primero y sin esperas antes: iPhone solo lo acepta dentro del toque.
    const pedido = Notification.requestPermission()
    setEstado('procesando')
    pedido
      .then(async (permiso) => {
        if (permiso === 'denied') return setEstado('bloqueado')
        if (permiso !== 'granted') return setEstado('inactivas')
        await suscribir({ usuarioId: usuario.id, negocioId })
        setEstado('activas')
      })
      .catch((errorActivar) => {
        console.warn('[Notificaciones] No se pudieron activar:', errorActivar)
        setError('No se pudieron activar las notificaciones. Revisa tu conexión e intenta de nuevo.')
        setEstado('inactivas')
      })
  }

  const desactivar = async () => {
    setError(null)
    setEstado('procesando')
    try {
      await desuscribir()
      setEstado('inactivas')
    } catch (errorDesactivar) {
      console.warn('[Notificaciones] No se pudieron desactivar:', errorDesactivar)
      setError('No se pudieron desactivar. Intenta de nuevo.')
      setEstado('activas')
    }
  }

  const textos = {
    'instalar-iphone': {
      titulo: 'Instala primero la app',
      texto: 'En iPhone, las notificaciones solo funcionan con el panel instalado: ábrelo en Safari, toca Compartir → "Agregar a inicio" y entra desde ese ícono.',
    },
    'no-soportado': {
      titulo: 'No disponibles aquí',
      texto: 'Este navegador no permite notificaciones. Prueba con Chrome en Android o con la app instalada en iPhone.',
    },
    bloqueado: { titulo: 'Bloqueadas en este dispositivo', texto: `Las notificaciones están bloqueadas. ${AYUDA_BLOQUEADO}` },
    cargando: { titulo: 'Notificaciones', texto: 'Revisando este dispositivo…' },
    procesando: { titulo: 'Notificaciones', texto: 'Guardando el cambio en este dispositivo…' },
    inactivas: { titulo: 'Avisos de pedidos nuevos', texto: 'Recibe una notificación en este dispositivo cada vez que entre un pedido, aunque el panel esté cerrado.' },
    activas: { titulo: 'Notificaciones activas', texto: 'Este dispositivo recibe un aviso con cada pedido nuevo (nombre del cliente y total).' },
  }
  const { titulo, texto } = textos[estado]

  return (
    <section className={`tarjeta notificaciones-push notificaciones-push--${estado}`} aria-live="polite">
      <div className="notificaciones-push__textos">
        <h2 className="notificaciones-push__titulo">
          <span className="notificaciones-push__punto" aria-hidden="true" />
          {titulo}
        </h2>
        <p className="notificaciones-push__texto">{texto}</p>
        {error && <p className="notificaciones-push__error">{error}</p>}
      </div>
      {estado === 'inactivas' && (
        <button type="button" className="notificaciones-push__boton" onClick={activar}>
          Activar notificaciones
        </button>
      )}
      {estado === 'procesando' && (
        <button type="button" className="notificaciones-push__boton" disabled>
          Un momento…
        </button>
      )}
      {estado === 'activas' && (
        <button type="button" className="notificaciones-push__boton notificaciones-push__boton--secundario" onClick={desactivar}>
          Desactivar
        </button>
      )}
    </section>
  )
}
