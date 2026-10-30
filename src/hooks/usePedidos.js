import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { negocioConfig } from '../config/negocio.config'

// Se usa tanto desde el checkout público (crearPedido, sin sesión) como desde el panel
// admin (listar/actualizar estado, requiere sesión — reforzado por RLS). La suscripción
// en tiempo real es para que dueño/empleado vean un pedido nuevo sin recargar la
// pantalla, en línea con el requisito de "máxima usabilidad" del brief.
export function usePedidos({ tiempoReal = false } = {}) {
  const [pedidos, setPedidos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  const recargar = useCallback(async () => {
    setCargando(true)
    setError(null)

    const { data, error: errorConsulta } = await supabase
      .from('pedidos')
      .select('*')
      .eq('negocio_id', negocioConfig.negocioId)
      .order('creado_en', { ascending: false })

    if (errorConsulta) {
      setError(errorConsulta)
      setPedidos([])
    } else {
      setPedidos(data)
    }
    setCargando(false)
  }, [])

  useEffect(() => {
    recargar()
  }, [recargar])

  useEffect(() => {
    if (!tiempoReal) return undefined

    const canal = supabase
      .channel(`pedidos-negocio-${negocioConfig.negocioId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pedidos',
          filter: `negocio_id=eq.${negocioConfig.negocioId}`,
        },
        () => recargar()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(canal)
    }
  }, [tiempoReal, recargar])

  // Sin .select(): el cliente inserta como anon y RLS no le deja leer pedidos, así que pedir
  // la fila de vuelta (INSERT ... RETURNING) falla con 42501 aunque la inserción sea válida.
  const crearPedido = useCallback(async (pedido) => {
    const { error: errorCrear } = await supabase
      .from('pedidos')
      .insert({ ...pedido, negocio_id: negocioConfig.negocioId, estado: 'nuevo' })

    return { exito: !errorCrear, error: errorCrear }
  }, [])

  // `atendidoPor`: nombre del admin/empleado que hizo el cambio (ver useAuth.js), para dejar
  // registro de quién atendió el pedido. Si la columna `atendido_por` todavía no existe en
  // la base de datos (código 42703), se reintenta solo con `estado` — así el cambio de
  // estado no queda roto mientras el dueño corre el script de la columna nueva.
  const actualizarEstadoPedido = useCallback(
    async (id, estado, atendidoPor) => {
      const cambios = atendidoPor ? { estado, atendido_por: atendidoPor } : { estado }
      let { error: errorActualizar } = await supabase.from('pedidos').update(cambios).eq('id', id)

      if (errorActualizar?.code === '42703' && atendidoPor) {
        ;({ error: errorActualizar } = await supabase.from('pedidos').update({ estado }).eq('id', id))
      }

      if (!errorActualizar) await recargar()
      return { exito: !errorActualizar, error: errorActualizar }
    },
    [recargar]
  )

  return { pedidos, cargando, error, recargar, crearPedido, actualizarEstadoPedido }
}
