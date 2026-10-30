// Comportamiento de las ofertas, programado en el código. La oferta guarda su `tipo` y sus
// parámetros en `configuracion` (tabla ofertas, ver explicacion-script-bd.txt sección 17).
// - 'informativa': las que crea el dueño; solo título y descripción en la tarjeta de Inicio.
// - 'domicilio_gratis': oferta fija del sistema (siempre existe, una por negocio, no se
//   elimina); el dueño solo configura el monto mínimo.
// Un tipo con comportamiento define `evaluar(config, total)` → { meta, completado, mensaje,
// lineaWhatsapp }: con `meta` el carrito muestra una barra de progreso, y `lineaWhatsapp` se
// agrega al mensaje del pedido.

export const formatoPrecio = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

export const TIPO_DOMICILIO_GRATIS = 'domicilio_gratis'
export const MONTO_DOMICILIO_POR_DEFECTO = 70000
const SUBTITULO_MAX = 22

// El texto de la tarjeta de domicilio gratis se arma con el monto, para que nunca quede
// desactualizado al cambiarlo. Se recorta a "Desde $X" si no cabe en los 22 caracteres.
export function textoDomicilioGratis(monto) {
  const precio = formatoPrecio.format(monto).replace(/\s/g, '')
  const largo = `Compras desde ${precio}`
  return { titulo: 'Domicilio gratis', subtitulo: largo.length <= SUBTITULO_MAX ? largo : `Desde ${precio}` }
}

// Monto mínimo de la oferta de domicilio gratis si es la oferta activa (si no, null). Lo usan la
// tarjeta y los pasos de Inicio para mostrar siempre el valor configurado en /admin/ofertas.
export function montoDomicilioGratis(oferta) {
  if (oferta?.tipo !== TIPO_DOMICILIO_GRATIS) return null
  return Number(oferta.configuracion?.monto_minimo) || null
}

const COMPORTAMIENTOS = {
  [TIPO_DOMICILIO_GRATIS]: (config, total) => {
    const meta = Number(config.monto_minimo) || 0
    const completado = total >= meta
    return {
      meta,
      completado,
      mensaje: completado
        ? '¡Tu pedido tiene domicilio gratis!'
        : `Te faltan ${formatoPrecio.format(meta - total)} para el domicilio gratis`,
      lineaWhatsapp: completado
        ? `Oferta aplicada: Domicilio gratis (compras desde ${formatoPrecio.format(meta)})`
        : null,
    }
  },
}

// Estado de cada oferta activa con comportamiento para el total del carrito.
export function evaluarOfertas(ofertas, total) {
  return ofertas
    .map((oferta) => {
      const evaluar = COMPORTAMIENTOS[oferta.tipo]
      return evaluar ? { oferta, ...evaluar(oferta.configuracion ?? {}, total) } : null
    })
    .filter(Boolean)
}
