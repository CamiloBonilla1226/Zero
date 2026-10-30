import { PLANTILLAS } from './recomendacionesNegocio.js'

// Análisis del negocio a partir de los pedidos, sin IA externa ni costo: todo se calcula en
// el navegador con los datos que el panel ya tiene. Las "recomendaciones" son reglas
// simples (umbrales sobre los números), no predicciones — por eso solo se generan cuando
// hay datos suficientes para que tengan sentido.

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const MS_DIA = 24 * 60 * 60 * 1000

// Ventana para hablar de "qué días se compra más": un mes tiene pocas repeticiones de cada
// día de la semana, así que se miran los últimos 90 días.
const DIAS_VENTANA = 90
const MIN_PEDIDOS_ANALISIS = 10
const MIN_UNIDADES_PRODUCTO_DIA = 3

// Un pedido rechazado no es venta; los demás estados (incluido "nuevo", aún sin atender) sí
// cuentan como demanda real del cliente.
const esVenta = (pedido) => pedido.estado !== 'rechazado'

const formatoDinero = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})
const dinero = (valor) => formatoDinero.format(valor)

// Los días terminados en s (lunes...viernes) no cambian en plural; sábado/domingo sí.
const plural = (dia) => (dia.endsWith('s') ? dia : dia + 's')

function nombreMes(fecha) {
  return new Intl.DateTimeFormat('es-CO', { month: 'long' }).format(fecha)
}

export function analizarNegocio(pedidos, productos = [], ahora = new Date()) {
  const ventas = pedidos.filter(esVenta)

  // ---- Dinero del mes (mes calendario en curso) y comparación con el anterior ----
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1)
  const inicioMesAnterior = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1)
  const diaDelMes = ahora.getDate()
  // Para comparar justo: mismo tramo del mes anterior (del 1 al mismo día), no el mes completo.
  const finTramoAnterior = new Date(ahora.getFullYear(), ahora.getMonth() - 1, diaDelMes + 1)

  let totalMes = 0
  let pedidosMes = 0
  let totalMesAnterior = 0
  for (const pedido of ventas) {
    const fecha = new Date(pedido.creado_en)
    if (fecha >= inicioMes) {
      totalMes += Number(pedido.total) || 0
      pedidosMes += 1
    } else if (fecha >= inicioMesAnterior && fecha < finTramoAnterior) {
      totalMesAnterior += Number(pedido.total) || 0
    }
  }
  const variacion = totalMesAnterior > 0 ? ((totalMes - totalMesAnterior) / totalMesAnterior) * 100 : null

  // ---- Ventana de 90 días para patrones por día de la semana y por producto ----
  const desde = new Date(ahora.getTime() - DIAS_VENTANA * MS_DIA)
  const recientes = ventas.filter((pedido) => new Date(pedido.creado_en) >= desde)

  const porDia = DIAS.map((nombre) => ({ nombre, pedidos: 0, total: 0 }))
  const unidadesProducto = new Map() // nombre -> { unidades, dias: number[7] }
  for (const pedido of recientes) {
    const dia = new Date(pedido.creado_en).getDay()
    porDia[dia].pedidos += 1
    porDia[dia].total += Number(pedido.total) || 0

    for (const item of pedido.productos_detalle ?? []) {
      const registro = unidadesProducto.get(item.nombre) ?? { unidades: 0, dias: Array(7).fill(0) }
      const cantidad = Number(item.cantidad) || 0
      registro.unidades += cantidad
      registro.dias[dia] += cantidad
      unidadesProducto.set(item.nombre, registro)
    }
  }

  const topProductos = [...unidadesProducto.entries()]
    .map(([nombre, { unidades, dias }]) => {
      const mejorDia = dias.indexOf(Math.max(...dias))
      return { nombre, unidades, mejorDia: DIAS[mejorDia], unidadesMejorDia: dias[mejorDia] }
    })
    .sort((a, b) => b.unidades - a.unidades)

  const suficientesDatos = recientes.length >= MIN_PEDIDOS_ANALISIS

  const diaMasFuerte = [...porDia].sort((a, b) => b.pedidos - a.pedidos)[0]
  const diaMasFlojo = [...porDia].sort((a, b) => a.pedidos - b.pedidos)[0]
  const maxPedidosDia = diaMasFuerte.pedidos

  // Productos disponibles sin una sola venta en la ventana: candidatos a oferta o a destacar.
  const vendidos = new Set(unidadesProducto.keys())
  const sinVentas = productos.filter((p) => p.disponible && !vendidos.has(p.nombre)).map((p) => p.nombre)

  // ---- Recomendaciones ----
  // Aquí solo se decide QUÉ situaciones aplican (con las mismas condiciones de siempre); el
  // texto de cada una sale de recomendacionesNegocio.js, que tiene varias versiones por
  // situación. Cada recomendación devuelve todas sus versiones ya redactadas con los datos del
  // negocio, y la pantalla elige cuál mostrar.
  const estrella = topProductos[0] ?? null
  const razon = diaMasFlojo.pedidos > 0 ? diaMasFuerte.pedidos / diaMasFlojo.pedidos : null
  const ctx = {
    mes: nombreMes(ahora),
    ventana: DIAS_VENTANA,
    totalPedidos: recientes.length,
    dinero,
    totalMes,
    totalMesAnterior,
    pedidosMes,
    variacionPct: variacion === null ? 0 : Math.abs(Math.round(variacion)),
    diferencia: Math.abs(totalMes - totalMesAnterior),
    fuerte: { nombre: diaMasFuerte.nombre, plural: plural(diaMasFuerte.nombre), pedidos: diaMasFuerte.pedidos },
    flojo: { nombre: diaMasFlojo.nombre, plural: plural(diaMasFlojo.nombre), pedidos: diaMasFlojo.pedidos },
    pctFuerte: recientes.length > 0 ? Math.round((diaMasFuerte.pedidos / recientes.length) * 100) : 0,
    comparativo:
      razon === null
        ? `El ${diaMasFuerte.nombre} tiene ${diaMasFuerte.pedidos} pedidos y el ${diaMasFlojo.nombre}, ninguno`
        : `El ${diaMasFuerte.nombre} vende ${razon.toFixed(1).replace('.', ',')} veces más que el ${diaMasFlojo.nombre}`,
    conteoFlojo:
      diaMasFlojo.pedidos === 0
        ? 'ningún pedido'
        : `solo ${diaMasFlojo.pedidos} ${diaMasFlojo.pedidos === 1 ? 'pedido' : 'pedidos'}`,
    producto: estrella?.nombre ?? 'tu producto más pedido',
    estrella: estrella ? { ...estrella, mejorDiaPlural: plural(estrella.mejorDia) } : null,
    segundo: topProductos[1]?.nombre ?? null,
    sinVentas,
    lista: sinVentas.slice(0, 3).join(', '),
    restantes: sinVentas.length > 3 ? ` y ${sinVentas.length - 3} más` : '',
  }

  const situaciones = []
  if (!suficientesDatos) {
    situaciones.push('pocosDatos')
  } else {
    if (diaMasFlojo.pedidos < diaMasFuerte.pedidos * 0.6) situaciones.push('diaFlojo')
    situaciones.push('diaFuerte')
    if (estrella) situaciones.push('estrella')
    if (sinVentas.length > 0) situaciones.push('sinVentas')
    if (variacion !== null && variacion <= -15) situaciones.push('ventasBajan')
    else if (variacion !== null && variacion >= 15) situaciones.push('ventasSuben')
  }

  const recomendaciones = situaciones.map((clave) => ({
    clave,
    variantes: PLANTILLAS[clave].map((plantilla) => plantilla(ctx)),
  }))

  return {
    mes: nombreMes(ahora),
    totalMes,
    pedidosMes,
    totalMesAnterior,
    variacion,
    porDia,
    maxPedidosDia,
    topProductos: topProductos.slice(0, 3).filter((p) => p.unidadesMejorDia >= MIN_UNIDADES_PRODUCTO_DIA),
    suficientesDatos,
    diasVentana: DIAS_VENTANA,
    recomendaciones,
    // Cambia cada día: la pantalla lo usa para rotar qué versión de cada recomendación muestra.
    semilla: Math.floor(ahora.getTime() / MS_DIA),
    dinero,
  }
}
