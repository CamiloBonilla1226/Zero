import { evaluarOfertas, formatoPrecio } from './tiposOferta'
import { textoSabores } from './sabores'
import { textoAdiciones } from './adiciones'

// `ofertas`: las activas del negocio; las que el pedido cumple (ej. domicilio gratis desde $X)
// agregan su línea al final del mensaje, ver lib/tiposOferta.js. `pago`: líneas del método de
// pago elegido en el checkout (ver lineasPagoWhatsapp en lib/mediosPago.js); van después de
// una línea en blanco para que se lean como un bloque aparte del pedido.
export function construirMensajePedido({ items, total, cliente, ofertas = [], pago = [] }) {
  const lineas = items.map((item) => {
    const sabores = textoSabores((item.saboresElegidos ?? []).map((s) => s.nombre))
    // Adiciones repetidas agrupadas ("Leche x2"), ver lib/adiciones.js.
    const detalles = [item.varianteNombre, sabores, textoAdiciones(item.opcionesElegidas)].filter(Boolean)
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
    ...(pago.length > 0 ? ['', ...pago] : []),
  ]
    .filter((linea) => linea !== null)
    .join('\n')
}

export function construirLinkWhatsApp(numeroWhatsapp, mensaje) {
  const numeroLimpio = numeroWhatsapp.replace(/\D/g, '')
  return `https://wa.me/${numeroLimpio}?text=${encodeURIComponent(mensaje)}`
}
