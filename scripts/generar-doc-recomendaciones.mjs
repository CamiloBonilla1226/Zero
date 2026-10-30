// Genera docs/recomendaciones-asistente.md a partir de las plantillas reales de
// src/lib/recomendacionesNegocio.js, renderizadas con datos de ejemplo. Así el documento
// nunca se desincroniza del código. Uso:  node scripts/generar-doc-recomendaciones.mjs
import { writeFileSync } from 'node:fs'
import { PLANTILLAS } from '../src/lib/recomendacionesNegocio.js'

const dinero = (n) => `$ ${Math.round(n).toLocaleString('es-CO')}`

// Datos de ejemplo de un negocio ficticio (solo para ilustrar los mensajes).
const ctx = {
  mes: 'septiembre',
  ventana: 90,
  totalPedidos: 84,
  dinero,
  totalMes: 1250000,
  totalMesAnterior: 1800000,
  pedidosMes: 31,
  variacionPct: 31,
  diferencia: 550000,
  fuerte: { nombre: 'sábado', plural: 'sábados', pedidos: 22 },
  flojo: { nombre: 'martes', plural: 'martes', pedidos: 5 },
  pctFuerte: 26,
  comparativo: 'El sábado vende 4,4 veces más que el martes',
  conteoFlojo: 'solo 5 pedidos',
  producto: 'Aguardiente Antioqueño',
  estrella: { nombre: 'Aguardiente Antioqueño', unidades: 64, mejorDia: 'sábado', mejorDiaPlural: 'sábados' },
  segundo: 'Cerveza Club Colombia',
  sinVentas: ['Whisky Old Parr', 'Ron Medellín', 'Vino tinto'],
  lista: 'Whisky Old Parr, Ron Medellín, Vino tinto',
  restantes: '',
}

const SITUACIONES = [
  {
    clave: 'pocosDatos',
    nombre: 'Pocos datos',
    cuando: 'Hay menos de 10 pedidos en los últimos 90 días (no rechazados).',
    datos: 'Cantidad de pedidos de la ventana.',
    objetivo: 'No hay patrones fiables, así que anima al dueño y le da tareas sencillas para conseguir los primeros pedidos.',
  },
  {
    clave: 'diaFlojo',
    nombre: 'Día con menos domicilios',
    cuando:
      'Hay suficientes datos y el día de la semana con menos pedidos tiene menos del 60% de los pedidos del día más fuerte.',
    datos: 'Día más flojo y su cantidad de pedidos, día más fuerte, producto más pedido, segundo más pedido.',
    objetivo: 'Proponer estrategias para levantar ese día: promo fija, envío gratis, combo, mensaje a clientes, oferta relámpago.',
  },
  {
    clave: 'diaFuerte',
    nombre: 'Día con más domicilios',
    cuando: 'Siempre que haya suficientes datos.',
    datos: 'Día más fuerte, cantidad y porcentaje de los pedidos que concentra, producto más pedido.',
    objetivo: 'Ayudar a aprovechar el mejor día: stock, subir el valor por pedido, rapidez, pre-pedidos, equipo, reseñas.',
  },
  {
    clave: 'estrella',
    nombre: 'Producto estrella',
    cuando: 'Hay suficientes datos y al menos un producto vendido en la ventana.',
    datos: 'Producto con más unidades, sus unidades, el día en que más se compra y el segundo más vendido.',
    objetivo: 'Sacarle partido al producto que más gusta: destacarlo, combos, stock, foto, gancho para otros, comunicarlo.',
  },
  {
    clave: 'sinVentas',
    nombre: 'Productos sin ventas',
    cuando: 'Hay suficientes datos y existen productos disponibles sin ninguna venta en los últimos 90 días.',
    datos: 'Nombres de esos productos (hasta 3, y cuántos más) y el producto más pedido.',
    objetivo: 'Darles una oportunidad (visibilidad, combos, foto, oferta corta) o simplificar la carta si no rotan.',
  },
  {
    clave: 'ventasBajan',
    nombre: 'Ventas por debajo del mes anterior',
    cuando: 'Hay suficientes datos y las ventas del mes van 15% o más por debajo del mismo tramo del mes anterior.',
    datos: 'Ventas del mes, ventas del mismo tramo del mes pasado, porcentaje y diferencia, día más flojo, producto más pedido.',
    objetivo: 'Motivar y proponer acciones para remontar: oferta relámpago, reactivar clientes, revisar causas, sorteo, referidos.',
  },
  {
    clave: 'ventasSuben',
    nombre: 'Ventas por encima del mes anterior',
    cuando: 'Hay suficientes datos y las ventas del mes van 15% o más por encima del mismo tramo del mes anterior.',
    datos: 'Ventas del mes, porcentaje y diferencia frente al mes pasado, pedidos del mes, producto más pedido.',
    objetivo: 'Celebrar y consolidar: cuidar stock, reinvertir, fidelizar, reseñas, revisar márgenes, reconocer al equipo.',
  },
]

let md = `# Recomendaciones del asistente del negocio

> Este archivo se genera con \`node scripts/generar-doc-recomendaciones.mjs\` a partir del código real
> (\`src/lib/recomendacionesNegocio.js\`). No lo edites a mano: edita las plantillas y vuelve a generarlo.

## Cómo funciona

El asistente vive en la pantalla **Inicio** del panel admin y **no usa IA externa ni tiene costo**:
analiza en el navegador los pedidos que el panel ya tiene y redacta los mensajes con plantillas.

1. **Se calculan los números** (\`src/lib/analisisNegocio.js\`): ventas del mes contra el mismo tramo del
   mes anterior, pedidos por día de la semana (últimos 90 días), productos más y menos vendidos.
   Los pedidos rechazados no cuentan como venta.
2. **Se decide qué situaciones aplican.** Hay ${SITUACIONES.length} situaciones (abajo) y cada una tiene su condición.
   Con menos de 10 pedidos en la ventana solo aparece "Pocos datos".
3. **Cada situación tiene varias versiones del mensaje** (${Object.values(PLANTILLAS).reduce((n, v) => n + v.length, 0)} en total),
   cada una con una estrategia distinta y redactada con los datos reales del negocio (nombres de días,
   productos, cantidades y montos).
4. **Se elige cuál versión mostrar.** La versión cambia **cada día** de forma automática (así el
   dueño no lee siempre lo mismo) y no parpadea al recargar la pantalla dentro del mismo día. Cada
   tarjeta tiene además un botón **"Otra idea ↻"** que pasa a la siguiente versión.

## Cómo agregar o cambiar mensajes

- **Una idea nueva para una situación existente:** en \`src/lib/recomendacionesNegocio.js\`, suma una
  función al arreglo de esa situación. Recibe \`ctx\` (los datos) y devuelve \`{ titulo, texto }\`.
  La lista de campos disponibles de \`ctx\` está comentada al inicio de ese archivo.
- **Una situación nueva:** agrega su clave en \`PLANTILLAS\` y su condición en \`analizarNegocio\`
  (\`src/lib/analisisNegocio.js\`, bloque "Recomendaciones").
- Al terminar, regenera este documento con el comando de arriba.

## Situaciones y mensajes

Los ejemplos usan datos de un negocio ficticio: ventas de ${dinero(ctx.totalMes)} este mes contra ${dinero(ctx.totalMesAnterior)}
el mes pasado, sábado como día fuerte (${ctx.fuerte.pedidos} pedidos), martes como día flojo (${ctx.flojo.pedidos} pedidos)
y "${ctx.producto}" como producto más pedido.
`

for (const situacion of SITUACIONES) {
  const variantes = PLANTILLAS[situacion.clave]
  md += `\n### ${situacion.nombre} (\`${situacion.clave}\`)\n\n`
  md += `- **Cuándo aparece:** ${situacion.cuando}\n`
  md += `- **Datos que usa:** ${situacion.datos}\n`
  md += `- **Qué busca:** ${situacion.objetivo}\n`
  md += `- **Versiones:** ${variantes.length}\n\n`
  variantes.forEach((plantilla, indice) => {
    // "Pocos datos" no depende del caso ficticio de ventas; se ilustra con pocos pedidos.
    const contexto = situacion.clave === 'pocosDatos' ? { ...ctx, totalPedidos: 6 } : ctx
    const { titulo, texto } = plantilla(contexto)
    md += `${indice + 1}. **${titulo}**  \n   ${texto}\n\n`
  })
}

writeFileSync(new URL('../docs/recomendaciones-asistente.md', import.meta.url), md, 'utf8')
console.log('docs/recomendaciones-asistente.md generado')
