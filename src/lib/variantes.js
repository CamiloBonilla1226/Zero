// Precio más bajo entre las variantes disponibles de un producto: se muestra como
// "Desde $X" antes de que el cliente elija una variante puntual.
export function precioMinimo(variantes) {
  return Math.min(...variantes.map((v) => v.precio))
}

// A partir del embed liviano `variantes_producto(precio, disponible)` que trae
// useProductos.js, obtiene solo las variantes disponibles de un producto — se usa tanto
// para decidir si mostrar "Desde $X" en la tarjeta como para forzar el modal de selección
// obligatoria (ver ProductoCard.jsx/Carta.jsx).
export function variantesDisponibles(producto) {
  return (producto.variantes_producto ?? []).filter((v) => v.disponible)
}
