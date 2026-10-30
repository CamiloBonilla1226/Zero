# Recomendaciones del asistente del negocio

> Este archivo se genera con `node scripts/generar-doc-recomendaciones.mjs` a partir del código real
> (`src/lib/recomendacionesNegocio.js`). No lo edites a mano: edita las plantillas y vuelve a generarlo.

## Cómo funciona

El asistente vive en la pantalla **Inicio** del panel admin y **no usa IA externa ni tiene costo**:
analiza en el navegador los pedidos que el panel ya tiene y redacta los mensajes con plantillas.

1. **Se calculan los números** (`src/lib/analisisNegocio.js`): ventas del mes contra el mismo tramo del
   mes anterior, pedidos por día de la semana (últimos 90 días), productos más y menos vendidos.
   Los pedidos rechazados no cuentan como venta.
2. **Se decide qué situaciones aplican.** Hay 7 situaciones (abajo) y cada una tiene su condición.
   Con menos de 10 pedidos en la ventana solo aparece "Pocos datos".
3. **Cada situación tiene varias versiones del mensaje** (40 en total),
   cada una con una estrategia distinta y redactada con los datos reales del negocio (nombres de días,
   productos, cantidades y montos).
4. **Se elige cuál versión mostrar.** La versión cambia **cada día** de forma automática (así el
   dueño no lee siempre lo mismo) y no parpadea al recargar la pantalla dentro del mismo día. Cada
   tarjeta tiene además un botón **"Otra idea ↻"** que pasa a la siguiente versión.

## Cómo agregar o cambiar mensajes

- **Una idea nueva para una situación existente:** en `src/lib/recomendacionesNegocio.js`, suma una
  función al arreglo de esa situación. Recibe `ctx` (los datos) y devuelve `{ titulo, texto }`.
  La lista de campos disponibles de `ctx` está comentada al inicio de ese archivo.
- **Una situación nueva:** agrega su clave en `PLANTILLAS` y su condición en `analizarNegocio`
  (`src/lib/analisisNegocio.js`, bloque "Recomendaciones").
- Al terminar, regenera este documento con el comando de arriba.

## Situaciones y mensajes

Los ejemplos usan datos de un negocio ficticio: ventas de $ 1.250.000 este mes contra $ 1.800.000
el mes pasado, sábado como día fuerte (22 pedidos), martes como día flojo (5 pedidos)
y "Aguardiente Antioqueño" como producto más pedido.

### Pocos datos (`pocosDatos`)

- **Cuándo aparece:** Hay menos de 10 pedidos en los últimos 90 días (no rechazados).
- **Datos que usa:** Cantidad de pedidos de la ventana.
- **Qué busca:** No hay patrones fiables, así que anima al dueño y le da tareas sencillas para conseguir los primeros pedidos.
- **Versiones:** 4

1. **Estás arrancando, ¡y eso ya es un logro!**  
   Llevas 6 pedidos en los últimos 90 días. Aún es pronto para ver patrones, pero cada pedido cuenta. Comparte el enlace de tu carta en tus estados de WhatsApp y en Instagram: a esta altura lo que más ayuda es que más gente te conozca.

2. **Los primeros pedidos son los más difíciles**  
   Con 6 pedidos todavía no puedo detectar tendencias, pero sí te dejo una tarea sencilla: pídele a 5 personas cercanas que hagan un pedido y cuenten qué tal les fue. Esos primeros clientes suelen ser los mejores embajadores.

3. **Deja que los datos se vayan sumando**  
   Cuando junte unos 10 pedidos te diré qué días vendes más, qué productos mueven tu negocio y qué oferta te conviene. Mientras tanto, revisa que tus fotos y precios estén al día: son lo primero que ve un cliente nuevo.

4. **Un buen comienzo se construye día a día**  
   Ya tienes 6 pedidos y eso demuestra que la carta funciona. Prueba dejar un producto destacado y una oferta visible en Inicio: es la forma más rápida de darle un empujón a las primeras semanas.


### Día con menos domicilios (`diaFlojo`)

- **Cuándo aparece:** Hay suficientes datos y el día de la semana con menos pedidos tiene menos del 60% de los pedidos del día más fuerte.
- **Datos que usa:** Día más flojo y su cantidad de pedidos, día más fuerte, producto más pedido, segundo más pedido.
- **Qué busca:** Proponer estrategias para levantar ese día: promo fija, envío gratis, combo, mensaje a clientes, oferta relámpago.
- **Versiones:** 6

1. **Los martes tienen mucho espacio para crecer**  
   Es tu día más tranquilo: solo 5 pedidos en 90 días. Eso es una oportunidad. Crea un "Martes de Aguardiente Antioqueño" con un precio especial y avísalo el día anterior en tus estados de WhatsApp. Un día fijo termina volviéndose costumbre.

2. **Regala el domicilio los martes**  
   El sábado vende 4,4 veces más que el martes. Probemos cerrar esa brecha: ofrece domicilio gratis solo los martes por un par de semanas y mira cómo cambia el número. Es una promo fácil de entender y de comunicar.

3. **Un combo pensado para el martes**  
   Arma un combo con Aguardiente Antioqueño y Cerveza Club Colombia, ponle un precio cerrado y llámalo con el nombre del día. Los combos hacen que decidir sea más fácil y suben el valor de cada pedido.

4. **Escríbeles a tus clientes de siempre**  
   Manda un mensaje corto a quienes ya te han comprado con un cupón válido solo el martes. No cuesta nada, llega directo y se siente personal. Algo como: "Hola, hoy tenemos un detallito para ti en tu pedido".

5. **Una oferta relámpago de pocas horas**  
   Los martes son tu día más flojo, así que ahí una oferta de 2 o 3 horas (por ejemplo, de 6 a 9 de la noche) genera urgencia sin regalar todo el día. Anúnciala con un par de horas de anticipación y mira cuántos pedidos entran.

6. **Llévale al martes la energía del sábado**  
   El sábado vende 4,4 veces más que el martes: algo estás haciendo bien ese día. Repite lo mismo el martes: las mismas historias, el mismo mensaje, la misma promo destacada. A veces solo hace falta recordarle a la gente que también abres ese día.


### Día con más domicilios (`diaFuerte`)

- **Cuándo aparece:** Siempre que haya suficientes datos.
- **Datos que usa:** Día más fuerte, cantidad y porcentaje de los pedidos que concentra, producto más pedido.
- **Qué busca:** Ayudar a aprovechar el mejor día: stock, subir el valor por pedido, rapidez, pre-pedidos, equipo, reseñas.
- **Versiones:** 6

1. **Los sábados son tu día estrella**  
   Concentran el 26% de tus pedidos (22 en 90 días). Ese día no te puede faltar nada: revisa el inventario del día anterior, sobre todo de Aguardiente Antioqueño, para no perder ventas por quedarte sin stock.

2. **Aprovecha el sábado para vender un poco más por pedido**  
   Como ese día ya llega mucha gente, es el mejor momento para sugerir adiciones y combos. Pon a la vista una adición popular o un combo con Aguardiente Antioqueño: si cada pedido sube un poco, el total del día se nota bastante.

3. **La rapidez también vende**  
   Con tanto movimiento los sábados, entregar rápido marca la diferencia. Deja listo lo que más sale (Aguardiente Antioqueño) antes de que empiece la hora fuerte y avisa al cliente cuánto va a tardar. Un buen domicilio hace que vuelvan.

4. **Invita a pedir con tiempo los sábados**  
   Ya sabes que ese día se llena. Anima a tus clientes a hacer su pedido temprano o desde la víspera: así repartes la carga, evitas cuellos de botella y aseguras la venta antes de que llegue el momento de mayor demanda.

5. **Refuerza el equipo el sábado**  
   Con 22 pedidos en 90 días, ese es el día para tener un domiciliario o una mano extra en la cocina. Aunque sea por unas horas, evita demoras y errores justo cuando más clientes te están mirando.

6. **Aprovecha que ese día hay clientes contentos**  
   Los sábados recibes más pedidos que cualquier otro día, o sea, más personas que pueden hablar bien de ti. Incluye una notita o un mensaje pidiéndoles que te recomienden o te etiqueten en Instagram: es publicidad gratis.


### Producto estrella (`estrella`)

- **Cuándo aparece:** Hay suficientes datos y al menos un producto vendido en la ventana.
- **Datos que usa:** Producto con más unidades, sus unidades, el día en que más se compra y el segundo más vendido.
- **Qué busca:** Sacarle partido al producto que más gusta: destacarlo, combos, stock, foto, gancho para otros, comunicarlo.
- **Versiones:** 6

1. **Aguardiente Antioqueño: tu producto estrella**  
   Se han pedido 64 unidades en 90 días y se compra sobre todo los sábados. Márcalo como destacado para que aparezca de primero en el carrusel de Inicio; lo que ya funciona merece la mejor vitrina.

2. **Haz un combo con Aguardiente Antioqueño**  
   Aguardiente Antioqueño ya tiene clientes fieles. Combínalo con Cerveza Club Colombia a un precio especial: quien viene por el que ya conoce, se anima a probar algo más, y tú subes el valor del pedido.

3. **Que nunca te falte Aguardiente Antioqueño**  
   Es lo que más sale (64 unidades), así que quedarte sin él es perder ventas seguras. Fíjate un mínimo de stock y revísalo antes de tus días fuertes. Es la manera más barata de proteger tus ingresos.

4. **Dale a Aguardiente Antioqueño la mejor foto**  
   Si es el más pedido, cualquier mejora en su foto o descripción se nota más que en cualquier otro producto. Una foto con buena luz y una descripción que abra el apetito pueden convertir a los curiosos en compradores.

5. **Usa a Aguardiente Antioqueño de gancho**  
   Prueba una oferta tipo "pide Aguardiente Antioqueño y llévate Cerveza Club Colombia con descuento". Así el producto que ya se vende solo arrastra a los que rotan menos, sin tener que rebajar el precio de lo que ya te funciona.

6. **Cuenta que es el favorito**  
   Aguardiente Antioqueño lleva 64 unidades vendidas: eso es confianza de tus clientes. Dilo en tus redes ("el favorito de la casa") y ponle una etiqueta en la carta. La gente tiende a elegir lo que otros ya eligieron.


### Productos sin ventas (`sinVentas`)

- **Cuándo aparece:** Hay suficientes datos y existen productos disponibles sin ninguna venta en los últimos 90 días.
- **Datos que usa:** Nombres de esos productos (hasta 3, y cuántos más) y el producto más pedido.
- **Qué busca:** Darles una oportunidad (visibilidad, combos, foto, oferta corta) o simplificar la carta si no rotan.
- **Versiones:** 6

1. **Estos productos merecen una segunda oportunidad**  
   Whisky Old Parr, Ron Medellín, Vino tinto no han vendido nada en 90 días. Antes de descartarlos, dales visibilidad: márcalos como destacados una o dos semanas y mira si la gente simplemente no los estaba viendo.

2. **Ponles compañía de un producto que sí vende**  
   Combina Whisky Old Parr, Ron Medellín, Vino tinto con Aguardiente Antioqueño: por ejemplo, un descuento en el segundo si lo piden juntos. Así aprovechas la fuerza de lo que ya funciona para que más gente pruebe lo que aún no conoce.

3. **Revisa cómo se presentan**  
   Whisky Old Parr, Ron Medellín, Vino tinto no tiene ventas. A veces el problema es la presentación: una foto poco clara, un nombre confuso o una descripción muy corta. Renuévala y espera una semana antes de decidir.

4. **Prueba una oferta corta y mide**  
   Haz una promo de dos semanas en Whisky Old Parr, Ron Medellín, Vino tinto y compara. Si con precio especial tampoco se mueve, ya sabes que no es cuestión de precio, y si se mueve, descubriste un producto con potencial.

5. **Una carta más corta también vende más**  
   Si Whisky Old Parr, Ron Medellín, Vino tinto siguen sin salir después de probar algo, considera desactivarlos por un tiempo. Una carta más clara le facilita la decisión al cliente y te evita tener productos que no rotan.

6. **Recomiéndalos tú mismo**  
   Cuando confirmes un pedido por WhatsApp, sugiere Whisky Old Parr, Ron Medellín, Vino tinto como acompañante ("¿le agrego uno de estos?"). Una recomendación personal vale más que cualquier vitrina y te dice de inmediato si al cliente le interesa.


### Ventas por debajo del mes anterior (`ventasBajan`)

- **Cuándo aparece:** Hay suficientes datos y las ventas del mes van 15% o más por debajo del mismo tramo del mes anterior.
- **Datos que usa:** Ventas del mes, ventas del mismo tramo del mes pasado, porcentaje y diferencia, día más flojo, producto más pedido.
- **Qué busca:** Motivar y proponer acciones para remontar: oferta relámpago, reactivar clientes, revisar causas, sorteo, referidos.
- **Versiones:** 6

1. **Un mes más flojo no define tu negocio**  
   Llevas $ 1.250.000 frente a $ 1.800.000 del mismo tramo del mes pasado (31% menos). Pasa en todos los negocios y se puede remontar: lanza esta semana una oferta relámpago con Aguardiente Antioqueño y avísala por WhatsApp.

2. **Reactiva a tus clientes de siempre**  
   Las ventas están 31% por debajo del mes pasado. Escríbeles a los clientes que ya te compraron con un mensaje amable y un pequeño detalle para su próximo pedido. Es más fácil que vuelva quien ya te conoce que conseguir uno nuevo.

3. **Empieza por tu día más flojo: el martes**  
   Faltan $ 550.000 para igualar el mismo tramo del mes pasado. Una promo pensada para los martes, que son tus días con menos pedidos, puede recuperar buena parte sin tocar los días que ya te funcionan.

4. **Revisemos qué pudo cambiar**  
   Con 31% menos que el mes pasado, vale la pena preguntarse: ¿hubo productos agotados?, ¿cambió el horario?, ¿hay algún producto desactivado que se vendía bien? A veces la causa es una sola cosa fácil de arreglar.

5. **Haz un sorteo pequeño en Instagram**  
   Una forma de mover el negocio sin bajar precios: sortea un combo entre quienes te etiqueten o compartan tu carta. Genera conversación, trae gente nueva y te ayuda a levantar las ventas de este mes ($ 1.250.000 por ahora).

6. **Pídele a tus mejores clientes que te recomienden**  
   Tus ventas bajaron 31% frente al mes pasado, pero tu base de clientes contentos sigue ahí. Ofréceles un descuento por cada amigo que traigan: el boca a boca es lo más poderoso que tiene un negocio de barrio.


### Ventas por encima del mes anterior (`ventasSuben`)

- **Cuándo aparece:** Hay suficientes datos y las ventas del mes van 15% o más por encima del mismo tramo del mes anterior.
- **Datos que usa:** Ventas del mes, porcentaje y diferencia frente al mes pasado, pedidos del mes, producto más pedido.
- **Qué busca:** Celebrar y consolidar: cuidar stock, reinvertir, fidelizar, reseñas, revisar márgenes, reconocer al equipo.
- **Versiones:** 6

1. **¡Vas volando este mes!**  
   Llevas $ 1.250.000, un 31% más que en el mismo tramo del mes pasado. Eso es fruto de tu trabajo. Para no frenar el ritmo, revisa que Aguardiente Antioqueño y tus productos más pedidos tengan stock suficiente.

2. **Es buen momento para invertir en tu carta**  
   Con 31% más de ventas que el mes anterior, puedes darte el gusto de mejorar lo visual: fotos nuevas de tus productos más pedidos o un producto nuevo para probar. Cuando el negocio crece, conviene reinvertir un poco.

3. **Agradece a quienes te están comprando**  
   Ganaste $ 550.000 más que en el mismo tramo del mes pasado, y eso viene de clientes que confían en ti. Un mensaje de gracias con un cupón para su próximo pedido los mantiene cerca y los convierte en habituales.

4. **Pide reseñas mientras estás en racha**  
   Con las ventas 31% arriba, hay muchos clientes contentos. Pídeles que te dejen un comentario o te etiqueten en redes: las opiniones reales le dan confianza a quien todavía no te ha probado.

5. **Revisa tus márgenes**  
   Con más demanda (31 pedidos este mes), es un buen momento para revisar los costos de tus productos más vendidos, empezando por Aguardiente Antioqueño. Un ajuste pequeño en precio o proveedor se multiplica con cada pedido.

6. **Celebra con tu equipo**  
   Un 31% más que el mes pasado no pasa solo. Comparte la buena noticia con quienes te ayudan, aunque sea con un detalle pequeño. Un equipo motivado se nota en cada domicilio y en cada cliente atendido.

