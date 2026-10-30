import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { negocioConfig } from '../config/negocio.config'

// Variantes de un producto puntual (ej. tamaños Pequeño/Mediano/Grande, sabores): a
// diferencia de las adiciones (catálogo plano del negocio, siempre opcionales, se suman al
// precio), las variantes son propias de un `producto_id`, la elección es obligatoria al
// pedir ese producto, y cambian el precio final en vez de sumarse. Sin `productoId` (un
// producto que todavía no se ha guardado) no hay nada que consultar.
export function useVariantesProducto(productoId, { soloDisponibles = false } = {}) {
  const [variantes, setVariantes] = useState([])
  const [cargando, setCargando] = useState(Boolean(productoId))
  const [error, setError] = useState(null)

  const recargar = useCallback(async () => {
    if (!productoId) {
      setVariantes([])
      setCargando(false)
      return
    }

    setCargando(true)
    setError(null)

    let consulta = supabase
      .from('variantes_producto')
      .select('*')
      .eq('producto_id', productoId)
      .order('orden', { ascending: true })
      .order('nombre', { ascending: true })

    if (soloDisponibles) {
      consulta = consulta.eq('disponible', true)
    }

    const { data, error: errorConsulta } = await consulta

    if (errorConsulta) {
      setError(errorConsulta)
      setVariantes([])
    } else {
      setVariantes(data)
    }
    setCargando(false)
  }, [productoId, soloDisponibles])

  useEffect(() => {
    recargar()
  }, [recargar])

  const crearVariante = useCallback(
    async (datos) => {
      const nombreLimpio = datos.nombre?.trim() ?? ''
      if (!nombreLimpio) {
        return { exito: false, error: new Error('El nombre es obligatorio.') }
      }

      const { error: errorCrear } = await supabase.from('variantes_producto').insert({
        ...datos,
        nombre: nombreLimpio,
        producto_id: productoId,
        negocio_id: negocioConfig.negocioId,
      })

      if (!errorCrear) await recargar()
      return { exito: !errorCrear, error: errorCrear }
    },
    [productoId, recargar]
  )

  const actualizarVariante = useCallback(
    async (id, cambiosOriginales) => {
      let cambios = cambiosOriginales

      if (cambios.nombre !== undefined) {
        const nombreLimpio = cambios.nombre.trim()
        if (!nombreLimpio) {
          return { exito: false, error: new Error('El nombre es obligatorio.') }
        }
        cambios = { ...cambios, nombre: nombreLimpio }
      }

      const { error: errorActualizar } = await supabase.from('variantes_producto').update(cambios).eq('id', id)

      if (!errorActualizar) await recargar()
      return { exito: !errorActualizar, error: errorActualizar }
    },
    [recargar]
  )

  const eliminarVariante = useCallback(
    async (id) => {
      const { error: errorEliminar } = await supabase.from('variantes_producto').delete().eq('id', id)

      if (!errorEliminar) await recargar()
      return { exito: !errorEliminar, error: errorEliminar }
    },
    [recargar]
  )

  return {
    variantes,
    cargando,
    error,
    recargar,
    crearVariante,
    actualizarVariante,
    eliminarVariante,
  }
}
