import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { negocioConfig } from '../config/negocio.config'

// Catálogo de sabores del negocio (ej. Fresa, Mango, Tussi): lo comparten todos los productos
// que piden sabores. Cuántos se eligen lo dice cada producto o variante (`cantidad_sabores`),
// se pueden repetir y no cambian el precio. `disponible` es el interruptor del día: apagado, el
// sabor desaparece de todos los productos a la vez. Un negocio sin sabores no ve ningún cambio
// (ver explicacion-script-bd.txt, sección 22).
export function useSabores({ soloDisponibles = false } = {}) {
  const [sabores, setSabores] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  const recargar = useCallback(async (silencioso = false) => {
    if (!silencioso) setCargando(true)
    setError(null)

    let consulta = supabase
      .from('sabores')
      .select('*')
      .eq('negocio_id', negocioConfig.negocioId)
      .order('orden', { ascending: true })
      .order('nombre', { ascending: true })

    if (soloDisponibles) {
      consulta = consulta.eq('disponible', true)
    }

    const { data, error: errorConsulta } = await consulta

    if (errorConsulta) {
      setError(errorConsulta)
      setSabores([])
    } else {
      setSabores(data)
    }
    setCargando(false)
  }, [soloDisponibles])

  useEffect(() => {
    recargar()
  }, [recargar])

  // El índice único (negocio_id, lower(nombre)) ya impide repetidos; se revisa antes para dar
  // un mensaje claro en vez del error de Postgres.
  const nombreRepetido = useCallback(async (nombre, idExcluido = null) => {
    let consulta = supabase
      .from('sabores')
      .select('id')
      .eq('negocio_id', negocioConfig.negocioId)
      .ilike('nombre', nombre)
    if (idExcluido) consulta = consulta.neq('id', idExcluido)
    const { data, error: errorConsulta } = await consulta.maybeSingle()
    if (errorConsulta) return { error: errorConsulta }
    return { repetido: Boolean(data) }
  }, [])

  const crearSabor = useCallback(
    async (sabor) => {
      const nombreLimpio = sabor.nombre?.trim() ?? ''
      if (!nombreLimpio) {
        return { exito: false, error: new Error('El nombre es obligatorio.') }
      }

      const { repetido, error: errorConsulta } = await nombreRepetido(nombreLimpio)
      if (errorConsulta) return { exito: false, error: errorConsulta }
      if (repetido) return { exito: false, error: new Error('Ya existe un sabor con ese nombre.') }

      const { error: errorCrear } = await supabase
        .from('sabores')
        .insert({ ...sabor, nombre: nombreLimpio, negocio_id: negocioConfig.negocioId })

      if (!errorCrear) await recargar(true)
      return { exito: !errorCrear, error: errorCrear }
    },
    [nombreRepetido, recargar]
  )

  const actualizarSabor = useCallback(
    async (id, cambiosOriginales) => {
      let cambios = cambiosOriginales

      if (cambios.nombre !== undefined) {
        const nombreLimpio = cambios.nombre.trim()
        if (!nombreLimpio) {
          return { exito: false, error: new Error('El nombre es obligatorio.') }
        }

        const { repetido, error: errorConsulta } = await nombreRepetido(nombreLimpio, id)
        if (errorConsulta) return { exito: false, error: errorConsulta }
        if (repetido) return { exito: false, error: new Error('Ya existe un sabor con ese nombre.') }

        cambios = { ...cambios, nombre: nombreLimpio }
      }

      const { error: errorActualizar } = await supabase.from('sabores').update(cambios).eq('id', id)

      if (!errorActualizar) await recargar(true)
      return { exito: !errorActualizar, error: errorActualizar }
    },
    [nombreRepetido, recargar]
  )

  const eliminarSabor = useCallback(
    async (id) => {
      const { error: errorEliminar } = await supabase.from('sabores').delete().eq('id', id)

      if (!errorEliminar) await recargar(true)
      return { exito: !errorEliminar, error: errorEliminar }
    },
    [recargar]
  )

  // Un update que RLS no deja hacer no devuelve error, solo afecta 0 filas: se pide la fila de
  // vuelta para no mostrar el interruptor movido cuando en realidad no se guardó.
  const toggleDisponible = useCallback(
    async (id, valor) => {
      const { data, error: errorActualizar } = await supabase
        .from('sabores')
        .update({ disponible: valor })
        .eq('id', id)
        .select('id')

      const error = errorActualizar ?? (data?.length ? null : new Error('No tienes permiso para hacer este cambio.'))
      if (!error) await recargar(true)
      return { exito: !error, error }
    },
    [recargar]
  )

  return {
    sabores,
    cargando,
    error,
    recargar,
    crearSabor,
    actualizarSabor,
    eliminarSabor,
    toggleDisponible,
  }
}
