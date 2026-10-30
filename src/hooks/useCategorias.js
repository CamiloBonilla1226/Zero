import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { negocioConfig } from '../config/negocio.config'

export function useCategorias({
  soloActivas = false,
  soloVisibleDomicilios = false,
  soloVisibleCartaFisica = false,
} = {}) {
  const [categorias, setCategorias] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  const recargar = useCallback(async () => {
    setCargando(true)
    setError(null)

    let consulta = supabase
      .from('categorias')
      .select('*')
      .eq('negocio_id', negocioConfig.negocioId)
      .order('nombre', { ascending: true })

    if (soloActivas) {
      consulta = consulta.eq('activo', true)
    }
    if (soloVisibleDomicilios) {
      consulta = consulta.eq('visible_domicilios', true)
    }
    if (soloVisibleCartaFisica) {
      consulta = consulta.eq('visible_carta_fisica', true)
    }

    const { data, error: errorConsulta } = await consulta

    if (errorConsulta) {
      setError(errorConsulta)
      setCategorias([])
    } else {
      setCategorias(data)
    }
    setCargando(false)
  }, [soloActivas, soloVisibleDomicilios, soloVisibleCartaFisica])

  useEffect(() => {
    recargar()
  }, [recargar])

  const crearCategoria = useCallback(
    async (datos) => {
      const nombreLimpio = datos.nombre.trim()
      if (!nombreLimpio) {
        return { exito: false, error: new Error('El nombre es obligatorio.') }
      }

      // ilike sin comodines (%) hace una comparación exacta insensible a mayúsculas/acentos
      // de caja, suficiente para detectar duplicados como "Bebidas" vs "bebidas".
      const { data: existente, error: errorConsulta } = await supabase
        .from('categorias')
        .select('id')
        .eq('negocio_id', negocioConfig.negocioId)
        .ilike('nombre', nombreLimpio)
        .maybeSingle()

      if (errorConsulta) return { exito: false, error: errorConsulta }
      if (existente) {
        return { exito: false, error: new Error('Ya existe una categoría con ese nombre.') }
      }

      const { data: creada, error: errorCrear } = await supabase
        .from('categorias')
        .insert({ ...datos, nombre: nombreLimpio, negocio_id: negocioConfig.negocioId })
        .select('id')
        .single()

      if (!errorCrear) await recargar()
      return { exito: !errorCrear, error: errorCrear, id: creada?.id }
    },
    [recargar]
  )

  const actualizarCategoria = useCallback(
    async (id, cambiosOriginales) => {
      let cambios = cambiosOriginales

      if (cambios.nombre !== undefined) {
        const nombreLimpio = cambios.nombre.trim()
        if (!nombreLimpio) {
          return { exito: false, error: new Error('El nombre es obligatorio.') }
        }

        const { data: existente, error: errorConsulta } = await supabase
          .from('categorias')
          .select('id')
          .eq('negocio_id', negocioConfig.negocioId)
          .neq('id', id)
          .ilike('nombre', nombreLimpio)
          .maybeSingle()

        if (errorConsulta) return { exito: false, error: errorConsulta }
        if (existente) {
          return { exito: false, error: new Error('Ya existe una categoría con ese nombre.') }
        }

        cambios = { ...cambios, nombre: nombreLimpio }
      }

      const { error: errorActualizar } = await supabase
        .from('categorias')
        .update(cambios)
        .eq('id', id)

      if (!errorActualizar) await recargar()
      return { exito: !errorActualizar, error: errorActualizar }
    },
    [recargar]
  )

  const eliminarCategoria = useCallback(
    async (id) => {
      // En la base de datos, borrar la categoría solo quitaría sus filas de
      // productos_categorias (on delete cascade). Se bloquea desde aquí para que no se pierda
      // por accidente la organización de productos que todavía la usan.
      const { count, error: errorConteo } = await supabase
        .from('productos_categorias')
        .select('producto_id', { count: 'exact', head: true })
        .eq('categoria_id', id)

      if (errorConteo) return { exito: false, error: errorConteo }

      if (count > 0) {
        return {
          exito: false,
          error: new Error(
            `No se puede eliminar: hay ${count} producto${count === 1 ? '' : 's'} en esta categoría. Usa "Limpiar categoría" para quitarlos (no se borran).`
          ),
        }
      }

      const { error: errorEliminar } = await supabase.from('categorias').delete().eq('id', id)

      if (!errorEliminar) await recargar()
      return { exito: !errorEliminar, error: errorEliminar }
    },
    [recargar]
  )

  const toggleActivo = useCallback(
    async (id, valor) => {
      // Desactivar una categoría solo la oculta: sus productos no se tocan. Como un producto
      // puede estar en varias categorías, deja de verse dentro de esta pero sigue en sus otras
      // categorías activas (ver lib/productosVisibles.js). Al reactivarla todo vuelve igual.
      const { error: errorActualizar } = await supabase.from('categorias').update({ activo: valor }).eq('id', id)

      if (errorActualizar) {
        return { exito: false, error: errorActualizar }
      }

      await recargar()
      return { exito: true }
    },
    [recargar]
  )

  // Deja en la categoría exactamente los productos de `idsNuevos` (tabla productos_categorias):
  // quita los que se desmarcaron y agrega los nuevos. Los productos no se tocan; solo cambia en
  // qué categorías están. `idsActuales` son los que tenía al abrir el formulario.
  const asignarProductos = useCallback(async (categoriaId, idsNuevos, idsActuales) => {
    const nuevos = new Set(idsNuevos)
    const actuales = new Set(idsActuales)
    const quitar = idsActuales.filter((id) => !nuevos.has(id))
    const agregar = idsNuevos.filter((id) => !actuales.has(id))

    if (quitar.length > 0) {
      const { data, error: errorQuitar } = await supabase
        .from('productos_categorias')
        .delete()
        .eq('categoria_id', categoriaId)
        .in('producto_id', quitar)
        .select('producto_id')
      if (errorQuitar) return { exito: false, error: errorQuitar }
      // Un delete que RLS no deja hacer no da error: afecta 0 filas.
      if ((data?.length ?? 0) < quitar.length) {
        return { exito: false, error: new Error('No tienes permiso para cambiar los productos de esta categoría.') }
      }
    }

    if (agregar.length > 0) {
      const { error: errorAgregar } = await supabase.from('productos_categorias').upsert(
        agregar.map((productoId) => ({
          producto_id: productoId,
          categoria_id: categoriaId,
          negocio_id: negocioConfig.negocioId,
        })),
        { onConflict: 'producto_id,categoria_id', ignoreDuplicates: true }
      )
      if (errorAgregar) return { exito: false, error: errorAgregar }
    }

    return { exito: true, cambios: quitar.length + agregar.length }
  }, [])

  // "Limpiar categoría": quita todos sus productos (los productos siguen existiendo y
  // conservan sus otras categorías). Devuelve cuántos se quitaron.
  const limpiarCategoria = useCallback(async (categoriaId) => {
    const { data, error: errorLimpiar } = await supabase
      .from('productos_categorias')
      .delete()
      .eq('categoria_id', categoriaId)
      .select('producto_id')
    if (errorLimpiar) return { exito: false, error: errorLimpiar }
    return { exito: true, quitados: data?.length ?? 0 }
  }, [])

  return {
    categorias,
    cargando,
    error,
    recargar,
    crearCategoria,
    actualizarCategoria,
    eliminarCategoria,
    toggleActivo,
    asignarProductos,
    limpiarCategoria,
  }
}
