// Mensajes del asistente del negocio. Cada "situación" (clave) tiene VARIAS versiones, cada
// una con una estrategia distinta, escritas en tono cercano. Todas reciben el mismo contexto
// (`ctx`, armado en analisisNegocio.js con los números reales del negocio) y devuelven
// { titulo, texto }. Para agregar una idea nueva basta con sumar una función al arreglo de
// la situación; para una situación nueva, agregar una clave aquí y su condición en
// analisisNegocio.js. La explicación completa está en docs/recomendaciones-asistente.md.
//
// Campos de `ctx` (ver analisisNegocio.js → armarContexto):
//   mes, ventana (días analizados), totalPedidos (en la ventana)
//   dinero(n)            → "$ 1.250.000"
//   totalMes, totalMesAnterior, pedidosMes, variacionPct (absoluto, entero), diferencia (dinero, absoluta)
//   fuerte / flojo       → { nombre, plural, pedidos }  (día de la semana más y menos activo)
//   pctFuerte            → % de los pedidos que cae en el día fuerte
//   comparativo          → frase lista, ej. "El sábado vende 3,2 veces más que el martes"
//   conteoFlojo          → ej. "solo 4 pedidos" / "ningún pedido"
//   producto             → nombre del más pedido (o "tu producto más pedido" si aún no hay)
//   estrella             → { nombre, unidades, mejorDia } | null
//   segundo              → nombre del 2.º más pedido | null
//   sinVentas, lista, restantes → productos disponibles sin ventas (lista = hasta 3 nombres)

export const PLANTILLAS = {
  // Pocos pedidos todavía: no hay patrones, así que se anima a seguir en vez de analizar.
  pocosDatos: [
    (c) => ({
      titulo: 'Estás arrancando, ¡y eso ya es un logro!',
      texto: `Llevas ${c.totalPedidos} pedidos en los últimos ${c.ventana} días. Aún es pronto para ver patrones, pero cada pedido cuenta. Comparte el enlace de tu carta en tus estados de WhatsApp y en Instagram: a esta altura lo que más ayuda es que más gente te conozca.`,
    }),
    (c) => ({
      titulo: 'Los primeros pedidos son los más difíciles',
      texto: `Con ${c.totalPedidos} pedidos todavía no puedo detectar tendencias, pero sí te dejo una tarea sencilla: pídele a 5 personas cercanas que hagan un pedido y cuenten qué tal les fue. Esos primeros clientes suelen ser los mejores embajadores.`,
    }),
    () => ({
      titulo: 'Deja que los datos se vayan sumando',
      texto:
        'Cuando junte unos 10 pedidos te diré qué días vendes más, qué productos mueven tu negocio y qué oferta te conviene. Mientras tanto, revisa que tus fotos y precios estén al día: son lo primero que ve un cliente nuevo.',
    }),
    (c) => ({
      titulo: 'Un buen comienzo se construye día a día',
      texto: `Ya tienes ${c.totalPedidos} pedidos y eso demuestra que la carta funciona. Prueba dejar un producto destacado y una oferta visible en Inicio: es la forma más rápida de darle un empujón a las primeras semanas.`,
    }),
  ],

  // El día con menos pedidos: estrategias para levantarlo.
  diaFlojo: [
    (c) => ({
      titulo: `Los ${c.flojo.plural} tienen mucho espacio para crecer`,
      texto: `Es tu día más tranquilo: ${c.conteoFlojo} en ${c.ventana} días. Eso es una oportunidad. Crea un "${capitalizar(c.flojo.nombre)} de ${c.producto}" con un precio especial y avísalo el día anterior en tus estados de WhatsApp. Un día fijo termina volviéndose costumbre.`,
    }),
    (c) => ({
      titulo: `Regala el domicilio los ${c.flojo.plural}`,
      texto: `${c.comparativo}. Probemos cerrar esa brecha: ofrece domicilio gratis solo los ${c.flojo.plural} por un par de semanas y mira cómo cambia el número. Es una promo fácil de entender y de comunicar.`,
    }),
    (c) => ({
      titulo: `Un combo pensado para el ${c.flojo.nombre}`,
      texto: `Arma un combo con ${c.producto}${c.segundo ? ` y ${c.segundo}` : ' y algo que se pida seguido con él'}, ponle un precio cerrado y llámalo con el nombre del día. Los combos hacen que decidir sea más fácil y suben el valor de cada pedido.`,
    }),
    (c) => ({
      titulo: 'Escríbeles a tus clientes de siempre',
      texto: `Manda un mensaje corto a quienes ya te han comprado con un cupón válido solo el ${c.flojo.nombre}. No cuesta nada, llega directo y se siente personal. Algo como: "Hola, hoy tenemos un detallito para ti en tu pedido".`,
    }),
    (c) => ({
      titulo: 'Una oferta relámpago de pocas horas',
      texto: `Los ${c.flojo.plural} son tu día más flojo, así que ahí una oferta de 2 o 3 horas (por ejemplo, de 6 a 9 de la noche) genera urgencia sin regalar todo el día. Anúnciala con un par de horas de anticipación y mira cuántos pedidos entran.`,
    }),
    (c) => ({
      titulo: `Llévale al ${c.flojo.nombre} la energía del ${c.fuerte.nombre}`,
      texto: `${c.comparativo}: algo estás haciendo bien ese día. Repite lo mismo el ${c.flojo.nombre}: las mismas historias, el mismo mensaje, la misma promo destacada. A veces solo hace falta recordarle a la gente que también abres ese día.`,
    }),
  ],

  // El día con más pedidos: cómo aprovecharlo y no fallar.
  diaFuerte: [
    (c) => ({
      titulo: `Los ${c.fuerte.plural} son tu día estrella`,
      texto: `Concentran el ${c.pctFuerte}% de tus pedidos (${c.fuerte.pedidos} en ${c.ventana} días). Ese día no te puede faltar nada: revisa el inventario del día anterior, sobre todo de ${c.producto}, para no perder ventas por quedarte sin stock.`,
    }),
    (c) => ({
      titulo: `Aprovecha el ${c.fuerte.nombre} para vender un poco más por pedido`,
      texto: `Como ese día ya llega mucha gente, es el mejor momento para sugerir adiciones y combos. Pon a la vista una adición popular o un combo con ${c.producto}: si cada pedido sube un poco, el total del día se nota bastante.`,
    }),
    (c) => ({
      titulo: 'La rapidez también vende',
      texto: `Con tanto movimiento los ${c.fuerte.plural}, entregar rápido marca la diferencia. Deja listo lo que más sale (${c.producto}) antes de que empiece la hora fuerte y avisa al cliente cuánto va a tardar. Un buen domicilio hace que vuelvan.`,
    }),
    (c) => ({
      titulo: `Invita a pedir con tiempo los ${c.fuerte.plural}`,
      texto: `Ya sabes que ese día se llena. Anima a tus clientes a hacer su pedido temprano o desde la víspera: así repartes la carga, evitas cuellos de botella y aseguras la venta antes de que llegue el momento de mayor demanda.`,
    }),
    (c) => ({
      titulo: `Refuerza el equipo el ${c.fuerte.nombre}`,
      texto: `Con ${c.fuerte.pedidos} pedidos en ${c.ventana} días, ese es el día para tener un domiciliario o una mano extra en la cocina. Aunque sea por unas horas, evita demoras y errores justo cuando más clientes te están mirando.`,
    }),
    (c) => ({
      titulo: 'Aprovecha que ese día hay clientes contentos',
      texto: `Los ${c.fuerte.plural} recibes más pedidos que cualquier otro día, o sea, más personas que pueden hablar bien de ti. Incluye una notita o un mensaje pidiéndoles que te recomienden o te etiqueten en Instagram: es publicidad gratis.`,
    }),
  ],

  // El producto más pedido.
  estrella: [
    (c) => ({
      titulo: `${c.estrella.nombre}: tu producto estrella`,
      texto: `Se han pedido ${c.estrella.unidades} unidades en ${c.ventana} días y se compra sobre todo los ${c.estrella.mejorDiaPlural}. Márcalo como destacado para que aparezca de primero en el carrusel de Inicio; lo que ya funciona merece la mejor vitrina.`,
    }),
    (c) => ({
      titulo: `Haz un combo con ${c.estrella.nombre}`,
      texto: `${c.estrella.nombre} ya tiene clientes fieles. Combínalo con ${c.segundo ?? 'una adición o un acompañante'} a un precio especial: quien viene por el que ya conoce, se anima a probar algo más, y tú subes el valor del pedido.`,
    }),
    (c) => ({
      titulo: `Que nunca te falte ${c.estrella.nombre}`,
      texto: `Es lo que más sale (${c.estrella.unidades} unidades), así que quedarte sin él es perder ventas seguras. Fíjate un mínimo de stock y revísalo antes de tus días fuertes. Es la manera más barata de proteger tus ingresos.`,
    }),
    (c) => ({
      titulo: `Dale a ${c.estrella.nombre} la mejor foto`,
      texto: `Si es el más pedido, cualquier mejora en su foto o descripción se nota más que en cualquier otro producto. Una foto con buena luz y una descripción que abra el apetito pueden convertir a los curiosos en compradores.`,
    }),
    (c) => ({
      titulo: `Usa a ${c.estrella.nombre} de gancho`,
      texto: `Prueba una oferta tipo "pide ${c.estrella.nombre} y llévate ${c.segundo ?? 'otro producto'} con descuento". Así el producto que ya se vende solo arrastra a los que rotan menos, sin tener que rebajar el precio de lo que ya te funciona.`,
    }),
    (c) => ({
      titulo: 'Cuenta que es el favorito',
      texto: `${c.estrella.nombre} lleva ${c.estrella.unidades} unidades vendidas: eso es confianza de tus clientes. Dilo en tus redes ("el favorito de la casa") y ponle una etiqueta en la carta. La gente tiende a elegir lo que otros ya eligieron.`,
    }),
  ],

  // Productos disponibles sin ventas en la ventana.
  sinVentas: [
    (c) => ({
      titulo: 'Estos productos merecen una segunda oportunidad',
      texto: `${c.lista}${c.restantes} no ${c.sinVentas.length === 1 ? 'ha' : 'han'} vendido nada en ${c.ventana} días. Antes de descartarlos, dales visibilidad: márcalos como destacados una o dos semanas y mira si la gente simplemente no los estaba viendo.`,
    }),
    (c) => ({
      titulo: 'Ponles compañía de un producto que sí vende',
      texto: `Combina ${c.lista} con ${c.producto}: por ejemplo, un descuento en el segundo si lo piden juntos. Así aprovechas la fuerza de lo que ya funciona para que más gente pruebe lo que aún no conoce.`,
    }),
    (c) => ({
      titulo: 'Revisa cómo se presentan',
      texto: `${c.lista}${c.restantes} no tiene ventas. A veces el problema es la presentación: una foto poco clara, un nombre confuso o una descripción muy corta. Renuévala y espera una semana antes de decidir.`,
    }),
    (c) => ({
      titulo: 'Prueba una oferta corta y mide',
      texto: `Haz una promo de dos semanas en ${c.lista}${c.restantes} y compara. Si con precio especial tampoco se mueve, ya sabes que no es cuestión de precio, y si se mueve, descubriste un producto con potencial.`,
    }),
    (c) => ({
      titulo: 'Una carta más corta también vende más',
      texto: `Si ${c.lista}${c.restantes} ${c.sinVentas.length === 1 ? 'sigue' : 'siguen'} sin salir después de probar algo, considera desactivarlos por un tiempo. Una carta más clara le facilita la decisión al cliente y te evita tener productos que no rotan.`,
    }),
    (c) => ({
      titulo: 'Recomiéndalos tú mismo',
      texto: `Cuando confirmes un pedido por WhatsApp, sugiere ${c.lista} como acompañante ("¿le agrego uno de estos?"). Una recomendación personal vale más que cualquier vitrina y te dice de inmediato si al cliente le interesa.`,
    }),
  ],

  // Las ventas del mes van por debajo del mismo tramo del mes anterior.
  ventasBajan: [
    (c) => ({
      titulo: 'Un mes más flojo no define tu negocio',
      texto: `Llevas ${c.dinero(c.totalMes)} frente a ${c.dinero(c.totalMesAnterior)} del mismo tramo del mes pasado (${c.variacionPct}% menos). Pasa en todos los negocios y se puede remontar: lanza esta semana una oferta relámpago con ${c.producto} y avísala por WhatsApp.`,
    }),
    (c) => ({
      titulo: 'Reactiva a tus clientes de siempre',
      texto: `Las ventas están ${c.variacionPct}% por debajo del mes pasado. Escríbeles a los clientes que ya te compraron con un mensaje amable y un pequeño detalle para su próximo pedido. Es más fácil que vuelva quien ya te conoce que conseguir uno nuevo.`,
    }),
    (c) => ({
      titulo: `Empieza por tu día más flojo: el ${c.flojo.nombre}`,
      texto: `Faltan ${c.dinero(c.diferencia)} para igualar el mismo tramo del mes pasado. Una promo pensada para los ${c.flojo.plural}, que son tus días con menos pedidos, puede recuperar buena parte sin tocar los días que ya te funcionan.`,
    }),
    (c) => ({
      titulo: 'Revisemos qué pudo cambiar',
      texto: `Con ${c.variacionPct}% menos que el mes pasado, vale la pena preguntarse: ¿hubo productos agotados?, ¿cambió el horario?, ¿hay algún producto desactivado que se vendía bien? A veces la causa es una sola cosa fácil de arreglar.`,
    }),
    (c) => ({
      titulo: 'Haz un sorteo pequeño en Instagram',
      texto: `Una forma de mover el negocio sin bajar precios: sortea un combo entre quienes te etiqueten o compartan tu carta. Genera conversación, trae gente nueva y te ayuda a levantar las ventas de este mes (${c.dinero(c.totalMes)} por ahora).`,
    }),
    (c) => ({
      titulo: 'Pídele a tus mejores clientes que te recomienden',
      texto: `Tus ventas bajaron ${c.variacionPct}% frente al mes pasado, pero tu base de clientes contentos sigue ahí. Ofréceles un descuento por cada amigo que traigan: el boca a boca es lo más poderoso que tiene un negocio de barrio.`,
    }),
  ],

  // Las ventas del mes van por encima del mismo tramo del mes anterior.
  ventasSuben: [
    (c) => ({
      titulo: '¡Vas volando este mes!',
      texto: `Llevas ${c.dinero(c.totalMes)}, un ${c.variacionPct}% más que en el mismo tramo del mes pasado. Eso es fruto de tu trabajo. Para no frenar el ritmo, revisa que ${c.producto} y tus productos más pedidos tengan stock suficiente.`,
    }),
    (c) => ({
      titulo: 'Es buen momento para invertir en tu carta',
      texto: `Con ${c.variacionPct}% más de ventas que el mes anterior, puedes darte el gusto de mejorar lo visual: fotos nuevas de tus productos más pedidos o un producto nuevo para probar. Cuando el negocio crece, conviene reinvertir un poco.`,
    }),
    (c) => ({
      titulo: 'Agradece a quienes te están comprando',
      texto: `Ganaste ${c.dinero(c.diferencia)} más que en el mismo tramo del mes pasado, y eso viene de clientes que confían en ti. Un mensaje de gracias con un cupón para su próximo pedido los mantiene cerca y los convierte en habituales.`,
    }),
    (c) => ({
      titulo: 'Pide reseñas mientras estás en racha',
      texto: `Con las ventas ${c.variacionPct}% arriba, hay muchos clientes contentos. Pídeles que te dejen un comentario o te etiqueten en redes: las opiniones reales le dan confianza a quien todavía no te ha probado.`,
    }),
    (c) => ({
      titulo: 'Revisa tus márgenes',
      texto: `Con más demanda (${c.pedidosMes} pedidos este mes), es un buen momento para revisar los costos de tus productos más vendidos, empezando por ${c.producto}. Un ajuste pequeño en precio o proveedor se multiplica con cada pedido.`,
    }),
    (c) => ({
      titulo: 'Celebra con tu equipo',
      texto: `Un ${c.variacionPct}% más que el mes pasado no pasa solo. Comparte la buena noticia con quienes te ayudan, aunque sea con un detalle pequeño. Un equipo motivado se nota en cada domicilio y en cada cliente atendido.`,
    }),
  ],
}

function capitalizar(texto) {
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

// Índice estable de la versión que se muestra: cambia cada día (así el mensaje se renueva sin
// que el usuario haga nada) pero no "parpadea" entre renders. `desplazamiento` lo suma el botón
// "Otra idea" para recorrer las demás versiones.
export function indiceVariante(clave, cantidad, semilla, desplazamiento = 0) {
  let hash = 0
  for (const letra of clave) hash = (hash * 31 + letra.charCodeAt(0)) % 9973
  return (semilla + hash + desplazamiento) % cantidad
}
