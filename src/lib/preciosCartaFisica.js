// Precio distinto en la carta física (consumo en el local) frente a domicilios. Es opcional:
// mientras `precio_carta_fisica` esté vacío (null), la carta física usa los mismos precios
// de domicilios (`precio` / `precio_oferta`). Ver explicacion-script-bd.txt, sección 18.

// Precio normal y de oferta que muestra la carta física para un producto sin variantes.
export function preciosCartaFisica(producto) {
  if (producto.precio_carta_fisica != null) {
    return { precio: producto.precio_carta_fisica, precioOferta: producto.precio_oferta_carta_fisica ?? null }
  }
  return { precio: producto.precio, precioOferta: producto.precio_oferta ?? null }
}

// Variante con el precio de la carta física en `precio` (el resto de la carta física trabaja
// con `precio`, igual que domicilios).
export function varianteCartaFisica(variante) {
  return variante.precio_carta_fisica != null ? { ...variante, precio: variante.precio_carta_fisica } : variante
}

// ¿El producto (o alguna de sus variantes) tiene precio propio para la carta física?
export function tienePrecioCartaFisica(producto, variantes = []) {
  return producto?.precio_carta_fisica != null || variantes.some((variante) => variante.precio_carta_fisica != null)
}
