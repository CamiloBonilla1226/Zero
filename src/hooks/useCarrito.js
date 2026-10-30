import { useCallback, useMemo, useState } from 'react'

// Cuando el producto tiene variante elegida (tamaño, sabor), su precio manda: el
// precio_oferta de productos deja de aplicar (ver FormularioProducto.jsx).
function precioEfectivo(producto, variante) {
  if (variante) return variante.precio
  return producto.precio_oferta ?? producto.precio
}

function idOpciones(opcionesElegidas) {
  return opcionesElegidas
    .map((o) => o.id)
    .sort()
    .join(',')
}

// Dos selecciones idénticas del mismo producto (mismo producto + misma variante + mismas
// opciones + mismos sabores) se agrupan en una sola línea del carrito, sumando cantidad, en vez
// de duplicar filas. Variantes o sabores distintos del mismo producto quedan en líneas separadas.
// Los sabores se repiten (Mango, Mango, Mora), así que se ordenan sin quitar repetidos.
function construirItemId(productoId, varianteId, opcionesElegidas, saboresElegidos = []) {
  const sabores = saboresElegidos.map((s) => s.id).sort().join(',')
  return `${productoId}|${varianteId ?? ''}|${idOpciones(opcionesElegidas)}|${sabores}`
}

function calcularSubtotal(precioBase, opcionesElegidas, cantidad) {
  const extras = opcionesElegidas.reduce((suma, o) => suma + (o.precio_extra ?? 0), 0)
  return (precioBase + extras) * cantidad
}

export function useCarrito() {
  const [items, setItems] = useState([])

  // `saboresElegidos`: [{ id, nombre }], con repetidos si el cliente repitió un sabor. No
  // cambian el precio (ver lib/sabores.js).
  const agregarProducto = useCallback((producto, opcionesElegidas = [], cantidad = 1, variante = null, saboresElegidos = []) => {
    const itemId = construirItemId(producto.id, variante?.id, opcionesElegidas, saboresElegidos)
    const precioBase = precioEfectivo(producto, variante)

    setItems((actuales) => {
      const existente = actuales.find((item) => item.itemId === itemId)

      if (existente) {
        const nuevaCantidad = existente.cantidad + cantidad
        return actuales.map((item) =>
          item.itemId === itemId
            ? {
                ...item,
                cantidad: nuevaCantidad,
                subtotal: calcularSubtotal(precioBase, opcionesElegidas, nuevaCantidad),
              }
            : item
        )
      }

      return [
        ...actuales,
        {
          itemId,
          productoId: producto.id,
          nombre: producto.nombre,
          imagenUrl: producto.imagen_url ?? null,
          varianteId: variante?.id ?? null,
          varianteNombre: variante?.nombre ?? null,
          saboresElegidos,
          precioBase,
          cantidad,
          opcionesElegidas,
          subtotal: calcularSubtotal(precioBase, opcionesElegidas, cantidad),
        },
      ]
    })
  }, [])

  // Adición pedida sola desde el Menú (cuando el negocio activa "Mostrar adiciones en el menú"):
  // es su propia línea, sin producto, variante ni opciones. Varias veces la misma adición suma
  // cantidad. La línea no se puede "modificar" (no hay detalle que abrir), solo cambiar cantidad.
  const agregarAdicion = useCallback((adicion, cantidad = 1) => {
    const itemId = `adicion|${adicion.id}`
    const precioBase = adicion.precio ?? 0

    setItems((actuales) => {
      const existente = actuales.find((item) => item.itemId === itemId)
      if (existente) {
        const nuevaCantidad = existente.cantidad + cantidad
        return actuales.map((item) =>
          item.itemId === itemId
            ? { ...item, cantidad: nuevaCantidad, subtotal: calcularSubtotal(precioBase, [], nuevaCantidad) }
            : item
        )
      }

      return [
        ...actuales,
        {
          itemId,
          productoId: null,
          adicionId: adicion.id,
          nombre: adicion.nombre,
          imagenUrl: adicion.imagen_url ?? null,
          varianteId: null,
          varianteNombre: null,
          saboresElegidos: [],
          precioBase,
          cantidad,
          opcionesElegidas: [],
          subtotal: calcularSubtotal(precioBase, [], cantidad),
        },
      ]
    })
  }, [])

  const quitarItem = useCallback((itemId) => {
    setItems((actuales) => actuales.filter((item) => item.itemId !== itemId))
  }, [])

  const cambiarCantidad = useCallback((itemId, cantidad) => {
    if (cantidad <= 0) {
      setItems((actuales) => actuales.filter((item) => item.itemId !== itemId))
      return
    }

    setItems((actuales) =>
      actuales.map((item) =>
        item.itemId === itemId
          ? {
              ...item,
              cantidad,
              subtotal: calcularSubtotal(item.precioBase, item.opcionesElegidas, cantidad),
            }
          : item
      )
    )
  }, [])

  // Editar una línea desde el carrito (cambiar variante, adiciones o cantidad): la línea queda
  // en su mismo lugar con la nueva elección. Si la nueva elección es idéntica a otra línea que
  // ya existía, se suman en esa otra (misma regla de agrupación que agregarProducto).
  const reemplazarItem = useCallback((itemIdAnterior, producto, opcionesElegidas = [], cantidad = 1, variante = null, saboresElegidos = []) => {
    const itemId = construirItemId(producto.id, variante?.id, opcionesElegidas, saboresElegidos)
    const precioBase = precioEfectivo(producto, variante)

    setItems((actuales) => {
      const anterior = actuales.find((item) => item.itemId === itemIdAnterior)
      if (!anterior) return actuales
      const otra = itemId !== itemIdAnterior ? actuales.find((item) => item.itemId === itemId) : null

      if (otra) {
        const nuevaCantidad = otra.cantidad + cantidad
        return actuales
          .filter((item) => item.itemId !== itemIdAnterior)
          .map((item) =>
            item.itemId === itemId
              ? { ...item, cantidad: nuevaCantidad, subtotal: calcularSubtotal(precioBase, opcionesElegidas, nuevaCantidad) }
              : item
          )
      }

      return actuales.map((item) =>
        item.itemId === itemIdAnterior
          ? {
              ...item,
              itemId,
              imagenUrl: producto.imagen_url ?? null,
              varianteId: variante?.id ?? null,
              varianteNombre: variante?.nombre ?? null,
              saboresElegidos,
              precioBase,
              cantidad,
              opcionesElegidas,
              subtotal: calcularSubtotal(precioBase, opcionesElegidas, cantidad),
            }
          : item
      )
    })
  }, [])

  const vaciarCarrito = useCallback(() => setItems([]), [])

  const total = useMemo(() => items.reduce((suma, item) => suma + item.subtotal, 0), [items])
  const cantidadTotal = useMemo(() => items.reduce((suma, item) => suma + item.cantidad, 0), [items])

  return {
    items,
    total,
    cantidadTotal,
    agregarProducto,
    agregarAdicion,
    quitarItem,
    cambiarCantidad,
    reemplazarItem,
    vaciarCarrito,
  }
}
