# Brief de desarrollo — Proyecto base plataforma multi-negocio

Este documento es el contexto completo para construir el proyecto base en React. Debe seguirse como referencia principal antes de escribir cualquier línea de código.

---

## 1. La idea de negocio

En Popayán hay muchos negocios pequeños y medianos (restaurantes, comidas rápidas, estancos, bares, granizados) que no tienen presencia digital seria, o que dependen de cartas físicas que se dañan, se pierden o quedan desactualizadas.

El producto que se vende a estos negocios como servicio mensual es:

1. **Un sitio de domicilios**: catálogo de productos, carrito de compras, y un checkout que arma el pedido y lo envía por WhatsApp al negocio (sin pasarela de pago integrada — el pago se coordina directamente entre negocio y cliente).
2. **Una carta digital para el punto físico**: el mismo catálogo, pero en modo solo lectura, pensada para que el cliente la vea escaneando un QR en la mesa, sin carrito ni checkout.
3. **Un panel de administración**: donde el dueño del negocio (o un empleado con permisos limitados) gestiona productos, precios, categorías, ofertas, adiciones y pedidos, sin depender de un desarrollador para cambios cotidianos.

Cada negocio cliente tiene su propio proyecto de código (este mismo proyecto, clonado y personalizado), con diseño propio y distinto para cada uno. Todos los proyectos comparten la misma base de datos.

El objetivo del negocio es escalar a muchos clientes (decenas o cientos), cada uno pagando una mensualidad, con el menor esfuerzo operativo posible por cliente.

---

## 2. Cómo funciona la base de datos

La base de datos es **PostgreSQL, gestionada a través de Supabase**. Supabase provee, sobre esa base de datos: una API autogenerada, autenticación de usuarios, y seguridad a nivel de fila (Row Level Security).

### Por qué es compartida entre todos los negocios

Aunque cada negocio tiene su propio proyecto de React con diseño independiente, **todos los proyectos leen y escriben en la misma base de datos**. El aislamiento de datos entre negocios no se logra teniendo bases de datos separadas, sino con una columna `negocio_id` presente en cada tabla relevante, y reglas de seguridad (RLS) que garantizan que un negocio nunca pueda leer ni modificar datos de otro, aunque técnicamente compartan la infraestructura.

Esto es una decisión deliberada para minimizar costo y complejidad operativa mientras la plataforma crece a muchos clientes.

### Tablas y su propósito

**negocios** — un registro por cada negocio cliente. Guarda su nombre, si está activo (controla si el sitio muestra contenido normal o un aviso de inactividad — esto lo maneja un panel maestro externo a este proyecto, usado por el dueño de la plataforma), el WhatsApp al que llegan los pedidos, y un campo `configuracion` en formato JSON para banderas específicas de ese negocio que no ameritan una columna propia (ej. hora de cierre de pedidos).

**usuarios_admin** — las cuentas del panel de administración. El login es por **número de teléfono + contraseña**, no por correo. Cada usuario tiene un rol: `dueño` (acceso total) o `empleado` (solo ve pedidos y cambia su estado, sin acceso a productos ni precios).

**categorias** — agrupan los productos de cada negocio (ej. "Bebidas", "Platos fuertes").

**productos** — el catálogo. Cada producto tiene precio, y opcionalmente un `precio_oferta`: si tiene valor, se debe mostrar el precio original tachado junto al precio de oferta, de forma visualmente llamativa. Así se maneja toda oferta o promoción en la plataforma — no existe una tabla de promociones separada.

**grupos_opciones** y **opciones** — implementan las adiciones/variantes de un producto (ej. un grupo "Adiciones" con selección múltiple, conteniendo opciones como "Queso extra +2.000"; o un grupo "Tamaño" con selección única). Un producto puede tener varios grupos de opciones a la vez. Cada opción puede tener un costo adicional (`precio_extra`), que se suma al precio base del producto cuando el cliente la selecciona.

**pedidos** — cada pedido hecho por un cliente final. Guarda los datos de contacto del cliente, un campo `productos_detalle` en formato JSON con el detalle completo de lo pedido (productos, cantidades, opciones elegidas y subtotales), el total, y un estado (`nuevo`, `en_preparacion`, `entregado`) que el negocio actualiza desde su panel admin.

### Seguridad de acceso a los datos

- Sin necesidad de login, cualquier visitante puede **leer** el catálogo de un negocio activo (negocio, categorías, productos, opciones) — esto es lo que permite que el menú público cargue.
- Sin necesidad de login, cualquier visitante puede **crear** un pedido — el cliente final no necesita cuenta para pedir.
- Todo lo demás (crear, editar o eliminar productos, categorías, opciones; ver o actualizar pedidos) requiere que el usuario esté autenticado como `usuarios_admin`, y las reglas de seguridad filtran automáticamente para que solo pueda tocar datos de su propio negocio, identificado por el `negocio_id` asociado a su sesión.

### Autenticación con número de teléfono

Supabase Auth exige internamente un correo electrónico para cada cuenta, aunque el número sea lo único que el usuario ve y escribe. La solución es que, al registrar o iniciar sesión, el propio código transforme el número en un correo interno no visible (ej. el número `3001234567` se convierte en `3001234567@dominio-interno.local` únicamente para uso interno de autenticación). El usuario del panel admin nunca ve ni necesita saber que existe ese correo.

---

## 3. Requisitos de diseño y experiencia

- **Mobile-first**: la mayoría de los clientes finales van a entrar desde el celular. El diseño se piensa primero para pantallas pequeñas, y luego se adapta hacia arriba (tablet, escritorio) — no al revés.
- **Minimalista, moderno y profesional**. El resultado debe verse como el trabajo de un diseñador experimentado, no como una plantilla genérica ni como algo "armado con IA": evitar patrones visuales genéricos, gradientes de relleno sin propósito, iconografía repetida sin criterio, o composiciones simétricas sin personalidad.
- **Sin bordes redondeados en los recuadros** (tarjetas, botones, contenedores). Usar esquinas rectas como parte del lenguaje visual del proyecto.
- **Máxima usabilidad**: la navegación del cliente final (ver categorías, elegir producto, agregar al carrito, hacer checkout) debe sentirse obvia, sin pasos innecesarios ni fricción. El panel admin debe permitir hacer las tareas comunes (cambiar un precio, marcar un producto agotado, ver un pedido nuevo) en el menor número de clics posible.
- Cada negocio, al personalizarse, debe poder tener su propia paleta de color y tipografía, sin que eso rompa la usabilidad ni la consistencia interna del diseño.

---

## 4. Rendimiento y carga de imágenes

- Las imágenes deben cargar de forma correcta desde el primer render, sin que el usuario vea un salto de layout (contenido que se mueve) cuando la imagen termina de cargar. Esto implica siempre reservar el espacio de la imagen de antemano (definir dimensiones o usar contenedores con relación de aspecto fija).
- Usar formatos de imagen modernos y livianos (WebP como estándar), con tamaños apropiados para el contexto en que se muestran (no cargar una imagen de alta resolución para un thumbnail pequeño).
- Cargar de forma diferida (`lazy loading`) las imágenes que no son visibles en el primer scroll, pero sin que esto cause el efecto de "aparece después" cuando el usuario sí llega a verlas — debe sentirse fluido, no brusco.
- El sitio debe sentirse rápido: minimizar el tiempo hasta que el contenido principal es visible, evitar renders bloqueantes, y evitar dependencias innecesarias que aumenten el peso del proyecto sin aportar valor real.

---

## 5. Buenas prácticas de desarrollo

Este proyecto debe construirse con el criterio de un desarrollador senior:

- Componentes reutilizables, bien separados por responsabilidad (presentación vs. lógica de datos vs. estado).
- Nombres de variables, funciones y componentes claros y consistentes.
- Manejo apropiado de estados de carga, vacío y error en cada pantalla que consulta datos (qué ve el usuario mientras carga, si no hay productos, si falla la conexión).
- Validación de formularios (checkout, login, formularios del panel admin) tanto en el cliente como confiando en las reglas de seguridad del lado de la base de datos — nunca confiar únicamente en la validación visual del frontend para datos sensibles.
- Código organizado siguiendo la estructura de carpetas ya definida para este proyecto (components, hooks, lib, pages, config), sin mezclar responsabilidades entre capas.

---

## 6. Seguridad

- Nunca exponer credenciales sensibles en el código del cliente — solo la URL pública de Supabase y su llave anónima (`anon key`), que están diseñadas para ser públicas porque la seguridad real la aplican las reglas de RLS en la base de datos, no el secreto de esa llave.
- Toda contraseña de `usuarios_admin` se maneja con hash (nunca en texto plano), y toda autenticación pasa por Supabase Auth, no por lógica propia insegura.
- Confiar en Row Level Security como la barrera principal de acceso a datos — cualquier consulta desde el frontend debe asumir que puede ser inspeccionada, y la protección real vive en las políticas de la base de datos, no en ocultar el código del cliente.
- Sanitizar y validar cualquier input del usuario antes de usarlo (checkout, login, formularios del panel admin) para prevenir inyecciones o datos malformados.
- No permitir que un usuario autenticado como `empleado` acceda, ni siquiera por manipulación del frontend, a funciones reservadas para `dueño` — la restricción de rol debe estar reforzada también del lado de las políticas de base de datos, no solo ocultando botones en la interfaz.

---

## 7. Registro de cambios (obligatorio)

Debe crearse y mantenerse un archivo `CHANGELOG.md` en la raíz del proyecto desde el primer commit. Cada vez que se implemente una funcionalidad, se corrija un error o se tome una decisión técnica relevante, debe agregarse una entrada con: fecha, qué se hizo, y por qué (si la razón no es obvia). El propósito es que, al retomar el proyecto más adelante o al usarlo como base para clonarlo en un negocio nuevo, quede claro el historial de decisiones y se eviten errores ya resueltos anteriormente.

Formato sugerido por entrada:

```
## 2026-09-24
- Se implementó el hook useCarrito con soporte para opciones/adiciones.
- Se decidió calcular el subtotal de cada producto en el cliente (no en la base de datos) porque el carrito no persiste hasta que se confirma el pedido.
```

---

## 8. Resumen de lo que debe implementarse en esta primera fase

- Conexión a Supabase (`supabaseClient.js`).
- Login de panel admin por número + contraseña, con roles.
- Visualización pública de catálogo (categorías, productos, precios, ofertas, adiciones).
- Carrito de compras con cálculo correcto de subtotales incluyendo opciones elegidas.
- Checkout que genera un link de WhatsApp con el pedido ya armado, y guarda el pedido en la base de datos.
- Modo carta física (catálogo de solo lectura, sin carrito).
- Panel admin: CRUD de productos, categorías, gestión de ofertas y adiciones, vista y actualización de pedidos, gestión de usuarios empleados (solo visible para rol dueño).
- Diseño mobile-first, minimalista, sin bordes redondeados, con buen rendimiento de carga de imágenes.
- Archivo `CHANGELOG.md` actualizado a medida que se avanza.
