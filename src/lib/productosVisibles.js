// Un producto puede estar en varias categorías (tabla productos_categorias; useProductos.js
// las deja en `producto.categorias`). Reglas de visibilidad en las cartas públicas:
// - Dentro de una categoría puntual aparece si está en esa categoría (productoEnCategoria).
// - En general ("Todas") aparece si al menos una de sus categorías está activa y visible en
//   esa carta, o si no tiene ninguna categoría. Una categoría desactivada u oculta solo deja
//   de mostrarlo dentro de ella: sigue saliendo en sus otras categorías.
export function filtrarProductosVisibles(productos, campoVisibilidad) {
  return productos.filter((producto) => {
    const categorias = producto.categorias ?? []
    return (
      categorias.length === 0 ||
      categorias.some((categoria) => categoria.activo !== false && categoria[campoVisibilidad] !== false)
    )
  })
}

export function productoEnCategoria(producto, categoriaId) {
  return (producto.categorias ?? []).some((categoria) => categoria.id === categoriaId)
}

// Categorías que tienen al menos un producto visible en esa carta. Las cartas públicas solo
// muestran estas: una categoría vacía (o cuyos productos están agotados u ocultos en esa
// carta) no aparece, para que el cliente nunca entre a una categoría sin nada.
export function categoriasConProductos(categorias, productosVisibles) {
  return categorias.filter((categoria) =>
    productosVisibles.some((producto) => productoEnCategoria(producto, categoria.id))
  )
}

// Productos marcados manualmente como destacados desde el admin (ver FormularioProducto.jsx),
// para el carrusel de Inicio de la carta de domicilios. `max` limita a 5 por defecto porque
// esa es la cantidad de tarjetas que pide el diseño del carrusel.
export function productosDestacados(productos, max = 5) {
  return productos.filter((producto) => producto.destacado).slice(0, max)
}

const enOferta = (producto) => producto.precio_oferta != null && producto.precio_oferta < producto.precio

// Recomendaciones del carrito (estrategia para subir el pedido): productos disponibles que
// todavía no están en el carrito, primero los destacados, después los que tienen precio de
// oferta y luego el resto (en el orden de la carta). Con productos en el carrito, entre
// iguales van antes los de categorías que el cliente aún no tiene (ej. lleva cerveza → pasabocas,
// hielo), para sugerir complementos en vez de más de lo mismo.
export function productosRecomendados(productos, items, max = 10) {
  const idsEnCarrito = new Set(items.map((item) => item.productoId))
  const productosPorId = new Map(productos.map((producto) => [producto.id, producto]))
  const categoriasEnCarrito = new Set(
    items.flatMap((item) => (productosPorId.get(item.productoId)?.categorias ?? []).map((categoria) => categoria.id))
  )
  const complementa = (producto) =>
    categoriasEnCarrito.size > 0 && !(producto.categorias ?? []).some((categoria) => categoriasEnCarrito.has(categoria.id))
  const puntaje = (producto) =>
    (producto.destacado ? 4 : 0) + (enOferta(producto) ? 2 : 0) + (complementa(producto) ? 1 : 0)

  return productos
    .filter((producto) => producto.disponible !== false && !idsEnCarrito.has(producto.id))
    .map((producto, indice) => ({ producto, indice, puntaje: puntaje(producto) }))
    .sort((a, b) => b.puntaje - a.puntaje || a.indice - b.indice)
    .slice(0, max)
    .map(({ producto }) => producto)
}
