// Toda "promoción" u "oferta" en la plataforma se maneja únicamente con precio_oferta
// en productos (no hay tabla de promociones separada). Si existe, se ve el precio
// original tachado junto al precio de oferta, de forma llamativa.
const formatoPrecio = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

export function PrecioProducto({ precio, precioOferta }) {
  if (precioOferta == null) {
    return <span className="precio-producto">{formatoPrecio.format(precio)}</span>
  }

  return (
    <span className="precio-producto">
      <span className="precio-producto__tachado">{formatoPrecio.format(precio)}</span>
      <span className="precio-producto__oferta">{formatoPrecio.format(precioOferta)}</span>
    </span>
  )
}
