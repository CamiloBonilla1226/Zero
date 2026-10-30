import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { negocioConfig } from '../config/negocio.config'
import { desbloquearAudio, sonarPedido } from '../lib/sonidoPedido'

const CLAVE_SILENCIO = 'admin-aviso-silenciado'
const DURACION_AVISO_MS = 10000

function leerSilencio() {
  try {
    return localStorage.getItem(CLAVE_SILENCIO) === '1'
  } catch {
    return false
  }
}

// Aviso global de pedido nuevo para todo el panel (vive en AdminLayout, no en Pedidos).
// usePedidos tiene su propia suscripción, pero solo mientras la pantalla Pedidos está montada;
// esta escucha en cualquier sección.
//
// - `activo`: solo con sesión válida y permiso de Pedidos. Sin eso no se suscribe.
// - `enPedidos`: con la pantalla Pedidos abierta, el contador de "sin ver" vuelve a cero.
//
// Solo escucha INSERT (un cambio de estado no es un pedido nuevo). Cada id se avisa una sola
// vez aunque Realtime se reconecte y reenvíe el evento. El silencio vale solo para este
// dispositivo (localStorage), y aun silenciado el aviso visual sale igual.
export function useAvisoPedidos({ activo, enPedidos }) {
  const [aviso, setAviso] = useState(null) // { pedido, extras }
  const [sinVer, setSinVer] = useState(0)
  const [silenciado, setSilenciado] = useState(leerSilencio)
  const idsAvisados = useRef(new Set())
  const silenciadoRef = useRef(silenciado)
  const enPedidosRef = useRef(enPedidos)
  const temporizador = useRef(null)

  useEffect(() => {
    silenciadoRef.current = silenciado
  }, [silenciado])

  // Al entrar a Pedidos el contador vuelve a cero. Se ajusta durante el render (patrón de
  // React para "estado que depende de un cambio de prop"), no en un efecto.
  const [enPedidosPrevio, setEnPedidosPrevio] = useState(enPedidos)
  if (enPedidos !== enPedidosPrevio) {
    setEnPedidosPrevio(enPedidos)
    if (enPedidos) setSinVer(0)
  }

  useEffect(() => {
    enPedidosRef.current = enPedidos
  }, [enPedidos])

  const cerrarAviso = useCallback(() => {
    clearTimeout(temporizador.current)
    setAviso(null)
  }, [])

  // El navegador bloquea el sonido hasta el primer gesto: se desbloquea con el primer toque,
  // clic o tecla en el panel, y se deja de escuchar en cuanto se logra.
  useEffect(() => {
    if (!activo) return undefined
    const alInteractuar = () => {
      if (desbloquearAudio()) quitar()
    }
    const eventos = ['pointerdown', 'keydown', 'touchend']
    const quitar = () => eventos.forEach((evento) => document.removeEventListener(evento, alInteractuar, true))
    eventos.forEach((evento) => document.addEventListener(evento, alInteractuar, true))
    return quitar
  }, [activo])

  useEffect(() => {
    if (!activo) return undefined

    const alLlegar = ({ new: pedido }) => {
      if (!pedido?.id || idsAvisados.current.has(pedido.id)) return
      idsAvisados.current.add(pedido.id)

      if (!silenciadoRef.current) sonarPedido()
      if (!enPedidosRef.current) setSinVer((actual) => actual + 1)
      // Si ya había un aviso a la vista, se muestra el más reciente y se cuenta el resto.
      setAviso((actual) => ({ pedido, extras: actual ? actual.extras + 1 : 0 }))
      clearTimeout(temporizador.current)
      temporizador.current = setTimeout(() => setAviso(null), DURACION_AVISO_MS)
    }

    let canal
    try {
      canal = supabase
        .channel(`aviso-pedidos-${negocioConfig.negocioId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'pedidos',
            filter: `negocio_id=eq.${negocioConfig.negocioId}`,
          },
          alLlegar
        )
        .subscribe((estado, error) => {
          // Si falla, el panel sigue funcionando; solo no habrá aviso hasta reconectar.
          if (estado === 'CHANNEL_ERROR' || estado === 'TIMED_OUT') {
            console.warn(`[useAvisoPedidos] La suscripción a pedidos nuevos falló (${estado}).`, error ?? '')
          }
        })
    } catch (error) {
      console.warn('[useAvisoPedidos] No se pudo suscribir a pedidos nuevos:', error)
    }

    return () => {
      clearTimeout(temporizador.current)
      if (canal) supabase.removeChannel(canal)
    }
  }, [activo])

  const alternarSilencio = useCallback(() => {
    setSilenciado((actual) => {
      const nuevo = !actual
      try {
        localStorage.setItem(CLAVE_SILENCIO, nuevo ? '1' : '0')
      } catch {
        // Sin localStorage (modo privado estricto): vale solo mientras la pestaña siga abierta.
      }
      return nuevo
    })
    // Activar el sonido es un gesto: se aprovecha para desbloquear el audio.
    desbloquearAudio()
  }, [])

  return { aviso, cerrarAviso, sinVer, silenciado, alternarSilencio }
}
