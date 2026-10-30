import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { negocioConfig } from '../config/negocio.config'

// Trae cada producto con sus categorías (un producto puede estar en varias, a través de la
// tabla productos_categorias — ver explicacion-script-bd.txt, sección 16). Las adiciones no
// se anidan aquí: son del negocio completo (ver useAdiciones.js).
// `activo`/`visible_domicilios`/`visible_carta_fisica` de cada categoría viajan junto con el
// resto: las cartas públicas los usan para decidir dónde se muestra el producto (ver
// lib/productosVisibles.js); no se filtra en la consulta porque un join `!inner` excluiría
// también a los productos sin categoría.
// `variantes_producto(precio, precio_carta_fisica, disponible)` trae solo lo necesario para que la carta
// pública sepa, sin una consulta aparte por producto, si debe mostrar "Desde $X" en la
// tarjeta y forzar el modal de selección obligatoria antes de agregar al carrito (ver
// Carta.jsx/ProductoCard.jsx). El detalle completo (id, nombre, orden) se carga con
// useVariantesProducto.js cuando el modal ya está abierto. `cantidad_sabores` va en el embed
// para mostrar "Elige N sabores" en la lista sin abrir el producto (ver lib/sabores.js).
// `sabor`: el sabor del que ES el producto (productos.sabor_id, opcional). Si está apagado, las
// cartas no muestran el producto (ver productoSaborDisponible y la sección 23 del script).
const SELECT_PRODUCTO_COMPLETO = `
  *,
  productos_categorias(categoria:categorias(id, nombre, activo, visible_domicilios, visible_carta_fisica)),
  variantes_producto(precio, precio_carta_fisica, disponible, cantidad_sabores),
  sabor:sabores!productos_sabor_fk(id, nombre, disponible)
`

// Un producto ligado a un sabor apagado no sale en las cartas. No se escribe en
// productos.disponible: así, al prender el sabor, vuelve solo, sin pisar un "Agotado" puesto a
// mano por otra razón.
export function productoSaborDisponible(producto) {
  return !producto.sabor || producto.sabor.disponible !== false
}

// Aplana productos_categorias → `producto.categorias` (arreglo de categorías, por nombre).
function normalizarProducto({ productos_categorias: enlaces, ...producto }) {
  const categorias = (enlaces ?? [])
    .map((enlace) => enlace.categoria)
    .filter(Boolean)
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
  return { ...producto, categorias }
}

const filasEnlace = (productoIds, categoriaIds) =>
  productoIds.flatMap((productoId) =>
    categoriaIds.map((categoriaId) => ({
      producto_id: productoId,
      categoria_id: categoriaId,
      negocio_id: negocioConfig.negocioId,
    }))
  )

// Un update/delete que RLS no deja hacer no devuelve error: simplemente afecta 0 filas.
// Para las acciones masivas se pide de vuelta lo afectado y se compara, así el panel avisa
// en vez de mostrar un "listo" falso.
function verificarAfectados(data, esperados) {
  const afectados = data?.length ?? 0
  if (afectados < esperados) {
    return new Error(
      afectados === 0
        ? 'No tienes permiso para hacer este cambio.'
        : `Solo se pudieron actualizar ${afectados} de ${esperados} productos.`
    )
  }
  return null
}

// Inserta las filas de variantes de un producto (nombre + precio, orden = posición en la
// lista). Se usa tanto al crear como al editar; en ambos casos el llamador decide qué hacer
// si falla (ver crearProducto/actualizarProducto). `precio_carta_fisica` vacío = la carta
// física usa el mismo precio (ver lib/preciosCartaFisica.js). `descripcion` (lo que trae ese
// tamaño) y `cantidad_sabores` (cuántos sabores se eligen, 0 = ninguno) son opcionales.
async function insertarVariantes(productoId, variantes) {
  const filas = variantes.map((variante, indice) => ({
    producto_id: productoId,
    negocio_id: negocioConfig.negocioId,
    nombre: variante.nombre.trim(),
    descripcion: variante.descripcion?.trim() || null,
    cantidad_sabores: Number(variante.cantidad_sabores) || 0,
    precio: Number(variante.precio) || 0,
    precio_carta_fisica:
      variante.precio_carta_fisica == null || variante.precio_carta_fisica === ''
        ? null
        : Number(variante.precio_carta_fisica),
    orden: indice,
  }))
  const { error } = await supabase.from('variantes_producto').insert(filas)
  return { error }
}

export function useProductos({
  soloDisponibles = false,
  soloVisibleDomicilios = false,
  soloVisibleCartaFisica = false,
} = {}) {
  const [productos, setProductos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  const recargar = useCallback(async (silencioso = false) => {
    if (!silencioso) setCargando(true)
    setError(null)

    let consulta = supabase
      .from('productos')
      .select(SELECT_PRODUCTO_COMPLETO)
      .eq('negocio_id', negocioConfig.negocioId)
      .order('nombre', { ascending: true })

    if (soloDisponibles) {
      consulta = consulta.eq('disponible', true)
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
      setProductos([])
    } else {
      const normalizados = data.map(normalizarProducto)
      setProductos(soloDisponibles ? normalizados.filter(productoSaborDisponible) : normalizados)
    }
    setCargando(false)
  }, [soloDisponibles, soloVisibleDomicilios, soloVisibleCartaFisica])

  useEffect(() => {
    recargar()
  }, [recargar])

  // `variantes`: cuando el producto tiene variantes (switch encendido en el formulario), la
  // lista completa de {nombre, precio} a guardar en variantes_producto, en la misma acción
  // de crear — para el panel se siente como un solo "Crear producto", no dos pasos.
  // `categoriaIds`: categorías a las que pertenece (productos_categorias).
  const crearProducto = useCallback(
    async (producto, variantes = [], categoriaIds = []) => {
      const nombreLimpio = producto.nombre?.trim() ?? ''
      if (!nombreLimpio) {
        return { exito: false, error: new Error('El nombre es obligatorio.') }
      }

      const { data: existente, error: errorConsulta } = await supabase
        .from('productos')
        .select('id')
        .eq('negocio_id', negocioConfig.negocioId)
        .ilike('nombre', nombreLimpio)
        .maybeSingle()

      if (errorConsulta) return { exito: false, error: errorConsulta }
      if (existente) {
        return { exito: false, error: new Error('Ya existe un producto con ese nombre.') }
      }

      const { data, error: errorCrear } = await supabase
        .from('productos')
        .insert({ ...producto, nombre: nombreLimpio, negocio_id: negocioConfig.negocioId })
        .select()
        .single()

      if (errorCrear) return { exito: false, error: errorCrear }

      if (variantes.length > 0) {
        const { error: errorVariantes } = await insertarVariantes(data.id, variantes)
        if (errorVariantes) {
          // Rollback: no dejar un producto a medias sin sus variantes — mismo criterio de
          // atomicidad que ya se usa en la Edge Function crear-usuario-admin.
          await supabase.from('productos').delete().eq('id', data.id)
          return { exito: false, error: errorVariantes }
        }
      }

      if (categoriaIds.length > 0) {
        const { error: errorCategorias } = await supabase
          .from('productos_categorias')
          .insert(filasEnlace([data.id], categoriaIds))
        if (errorCategorias) {
          // Mismo rollback: borrar el producto se lleva en cascada sus variantes.
          await supabase.from('productos').delete().eq('id', data.id)
          return { exito: false, error: errorCategorias }
        }
      }

      await recargar(true)
      return { exito: true, producto: data }
    },
    [recargar]
  )

  // `variantes`: `null` deja intactas las variantes existentes (no se tocó esa parte del
  // formulario); un arreglo (aunque esté vacío) reemplaza por completo las variantes del
  // producto — se borran todas las anteriores y se insertan las que llegaron.
  // `categoriaIds`: igual — `null` no toca las categorías; un arreglo las reemplaza.
  const actualizarProducto = useCallback(
    async (id, cambiosOriginales, variantes = null, categoriaIds = null) => {
      let cambios = cambiosOriginales

      if (cambios.nombre !== undefined) {
        const nombreLimpio = cambios.nombre.trim()
        if (!nombreLimpio) {
          return { exito: false, error: new Error('El nombre es obligatorio.') }
        }

        const { data: existente, error: errorConsulta } = await supabase
          .from('productos')
          .select('id')
          .eq('negocio_id', negocioConfig.negocioId)
          .neq('id', id)
          .ilike('nombre', nombreLimpio)
          .maybeSingle()

        if (errorConsulta) return { exito: false, error: errorConsulta }
        if (existente) {
          return { exito: false, error: new Error('Ya existe un producto con ese nombre.') }
        }

        cambios = { ...cambios, nombre: nombreLimpio }
      }

      const { error: errorActualizar } = await supabase.from('productos').update(cambios).eq('id', id)
      if (errorActualizar) return { exito: false, error: errorActualizar }

      if (variantes !== null) {
        const { error: errorEliminar } = await supabase.from('variantes_producto').delete().eq('producto_id', id)
        if (errorEliminar) return { exito: false, error: errorEliminar }

        if (variantes.length > 0) {
          const { error: errorVariantes } = await insertarVariantes(id, variantes)
          if (errorVariantes) return { exito: false, error: errorVariantes }
        }
      }

      if (categoriaIds !== null) {
        const { error: errorCategorias } = await supabase.rpc('reemplazar_categorias_productos', {
          p_productos: [id],
          p_categorias: categoriaIds,
        })
        if (errorCategorias) return { exito: false, error: errorCategorias }
      }

      await recargar(true)
      return { exito: true }
    },
    [recargar]
  )

  // --- Acciones masivas (varios productos seleccionados en el panel) ---

  const cambiarDisponibleVarios = useCallback(
    async (ids, valor) => {
      const { data, error: errorActualizar } = await supabase
        .from('productos')
        .update({ disponible: valor })
        .in('id', ids)
        .select('id')

      const error = errorActualizar ?? verificarAfectados(data, ids.length)
      await recargar(true)
      return { exito: !error, error }
    },
    [recargar]
  )

  const eliminarVarios = useCallback(
    async (ids) => {
      const { data, error: errorEliminar } = await supabase.from('productos').delete().in('id', ids).select('id')

      const error = errorEliminar ?? verificarAfectados(data, ids.length)
      await recargar(true)
      return { exito: !error, error }
    },
    [recargar]
  )

  // Suma las categorías sin tocar las que ya tenían; las que ya estaban se ignoran.
  const agregarCategoriasVarios = useCallback(
    async (ids, categoriaIds) => {
      const { error } = await supabase
        .from('productos_categorias')
        .upsert(filasEnlace(ids, categoriaIds), { onConflict: 'producto_id,categoria_id', ignoreDuplicates: true })

      await recargar(true)
      return { exito: !error, error }
    },
    [recargar]
  )

  // Deja a cada producto con exactamente estas categorías (vacío = sin categoría), en una
  // sola transacción del lado de la base de datos.
  const reemplazarCategoriasVarios = useCallback(
    async (ids, categoriaIds) => {
      const { error } = await supabase.rpc('reemplazar_categorias_productos', {
        p_productos: ids,
        p_categorias: categoriaIds,
      })

      await recargar(true)
      return { exito: !error, error }
    },
    [recargar]
  )

  const quitarCategoriasVarios = useCallback(
    async (ids, categoriaIds) => {
      const { error } = await supabase
        .from('productos_categorias')
        .delete()
        .in('producto_id', ids)
        .in('categoria_id', categoriaIds)

      await recargar(true)
      return { exito: !error, error }
    },
    [recargar]
  )

  const eliminarProducto = useCallback(
    async (id) => {
      const { error: errorEliminar } = await supabase.from('productos').delete().eq('id', id)

      if (!errorEliminar) await recargar(true)
      return { exito: !errorEliminar, error: errorEliminar }
    },
    [recargar]
  )

  const toggleDisponible = useCallback(
    async (id, valor) => {
      const { error: errorActualizar } = await supabase
        .from('productos')
        .update({ disponible: valor })
        .eq('id', id)

      if (!errorActualizar) await recargar(true)
      return { exito: !errorActualizar, error: errorActualizar }
    },
    [recargar]
  )

  return {
    productos,
    cargando,
    error,
    recargar,
    crearProducto,
    actualizarProducto,
    eliminarProducto,
    toggleDisponible,
    cambiarDisponibleVarios,
    eliminarVarios,
    agregarCategoriasVarios,
    reemplazarCategoriasVarios,
    quitarCategoriasVarios,
  }
}
