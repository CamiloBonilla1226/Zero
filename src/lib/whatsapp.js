import { evaluarOfertas, formatoPrecio } from './tiposOferta'
import { textoSabores } from './sabores'

// `ofertas`: las activas del negocio; las que el pedido cumple (ej. domicilio gratis desde $X)
// agregan su línea al final del mensaje, ver lib/tiposOferta.js.
export function construirMensajePedido({ items, total, cliente, ofertas = [] }) {
  const lineas = items.map((item) => {
    const sabores = textoSabores((item.saboresElegidos ?? []).map((s) => s.nombre))
    const detalles = [item.varianteNombre, sabores, ...item.opcionesElegidas.map((o) => o.nombre)].filter(Boolean)
    const detalleTexto = detalles.length ? ` (${detalles.join(', ')})` : ''
    return `• ${item.cantidad}x ${item.nombre}${detalleTexto} — ${formatoPrecio.format(item.subtotal)}`
  })
  const lineasOfertas = evaluarOfertas(ofertas, total)
    .map((estado) => estado.lineaWhatsapp)
    .filter(Boolean)

  return [
    `Pedido de ${cliente.nombre}`,
    `Teléfono: ${cliente.telefono}`,
    cliente.direccion ? `Dirección: ${cliente.direccion}` : null,
    '',
    ...lineas,
    '',
    `Total: ${formatoPrecio.format(total)}`,
    ...lineasOfertas,
  ]
    .filter((linea) => linea !== null)
    .join('\n')
}

export function construirLinkWhatsApp(numeroWhatsapp, mensaje) {
  const numeroLimpio = numeroWhatsapp.replace(/\D/g, '')
  return `https://wa.me/${numeroLimpio}?text=${encodeURIComponent(mensaje)}`
}
