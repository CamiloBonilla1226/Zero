// Cuántos sabores pide un producto: con variante elegida manda la variante; sin variantes, el
// producto. 0 = no pide sabores (el valor por defecto de la base, ver
// explicacion-script-bd.txt sección 22).
export function cantidadSabores(producto, variante) {
  if (variante) return variante.cantidad_sabores ?? 0
  return producto.cantidad_sabores ?? 0
}

// ¿Hay que abrir el detalle para elegir sabores antes de agregar? Con variantes ya se abre por
// la variante; esto cubre el producto sin variantes que pide sabores.
export function pideSabores(producto) {
  return (producto.cantidad_sabores ?? 0) > 0
}

// Texto corto de los sabores elegidos, agrupando repetidos en el orden en que se eligieron:
// ['Mango', 'Mango', 'Mora'] → "Mango x2, Mora". Se usa en carrito, WhatsApp y pedidos.
export function textoSabores(nombres = []) {
  const conteo = new Map()
  for (const nombre of nombres) conteo.set(nombre, (conteo.get(nombre) ?? 0) + 1)
  return [...conteo].map(([nombre, veces]) => (veces > 1 ? `${nombre} x${veces}` : nombre)).join(', ')
}
