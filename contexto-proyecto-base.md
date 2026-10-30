# Contexto del proyecto — Plataforma multi-negocio (domicilios + carta digital + panel admin)

## Resumen del producto

Plataforma que se vende como servicio a negocios pequeños/medianos (restaurantes, comidas rápidas, estancos, bares) en Popayán. Cada negocio cliente recibe:

1. Un sitio de domicilios (menú + carrito + checkout que envía el pedido por WhatsApp)
2. Una carta digital para el punto físico (solo lectura, sin carrito, pensada para QR en mesa)
3. Un panel de administración (productos, categorías, ofertas, adiciones, pedidos, usuarios con roles)

## Arquitectura general

- **Cada negocio es un proyecto de React independiente** (repo propio, deploy propio en Vercel), con diseño 100% personalizado. No es un sistema de plantillas ni theming compartido: cada negocio se ve distinto porque su código es distinto.
- **Todos los proyectos comparten la misma base de datos** (Supabase / PostgreSQL). El aislamiento entre negocios se logra con una columna `negocio_id` en cada tabla relevante, reforzada con Row Level Security (RLS).
- Este documento describe el **proyecto base** que se clona para cada negocio nuevo. Al clonarlo, lo único que cambia inicialmente es la configuración (`negocio_id`, colores, WhatsApp), y luego se personaliza el diseño a gusto del cliente.
- No hay backend propio: Supabase actúa como backend (base de datos + API autogenerada + autenticación). El proyecto React se conecta directo a Supabase desde el cliente.
- No hay propagación automática de cambios entre negocios: cada repo, una vez clonado y personalizado, vive de forma independiente. Si se corrige un bug, se corrige manualmente en cada proyecto que lo tenga.

## Login del panel admin

- El login es por **número de teléfono + contraseña**, sin email visible para el usuario.
- Por debajo, se usa Supabase Auth (que internamente requiere un correo): el número se transforma en un correo falso interno, ej. `3001234567@tuapp.interno`, de forma transparente para el usuario.
- Al crear el usuario admin, se guarda `negocio_id` y `rol` en los `app_metadata` de Supabase Auth (nunca en `user_metadata`: ese lo puede reescribir el propio usuario autenticado con `supabase.auth.updateUser()`, así que un admin podría cambiarse a sí mismo el negocio_id y acceder a datos de otro negocio — `app_metadata` solo lo escribe el servidor, con la service_role key, desde la Edge Function `crear-usuario-admin`). Esto es lo que usan las políticas de RLS para filtrar qué datos puede ver/editar cada usuario.
- Roles: `dueño` (acceso total) y `empleado` (solo ve pedidos y cambia su estado; no puede tocar productos, precios ni categorías).

## Modelo de datos (ya creado en Supabase)

### negocios
Datos generales del negocio y su estado comercial.
- `id` (uuid, PK)
- `nombre` (text)
- `slug` (text, único — usado si en algún momento se sirve por ruta, aunque cada negocio tiene su propio deploy)
- `dominio_propio` (text, nullable — dominio personalizado cuando el negocio pasa de gratis a dominio propio)
- `activo` (boolean — controla si el sitio muestra su contenido normal o un aviso de "inactivo"; lo maneja el panel maestro del dueño de la plataforma)
- `fecha_proximo_pago` (date)
- `whatsapp_contacto` (text — número al que llegan los pedidos)
- `configuracion` (jsonb — banderas específicas de un negocio que no ameritan columna propia, ej. hora de cierre de pedidos)
- `creado_en` (timestamptz)

No tiene logo ni horario (decisión explícita del cliente de este proyecto: no le interesan esos campos).

### usuarios_admin
Cuentas del panel de administración de cada negocio.
- `id` (uuid, PK)
- `negocio_id` (uuid, FK → negocios)
- `numero` (text — identificador de login, único por negocio)
- `contrasena_hash` (text)
- `rol` (text — `dueño` o `empleado`)
- `creado_en` (timestamptz)

No tiene email (decisión explícita: login solo por número).

### categorias
- `id` (uuid, PK)
- `negocio_id` (uuid, FK → negocios)
- `nombre` (text)

### productos
- `id` (uuid, PK)
- `negocio_id` (uuid, FK → negocios)
- `categoria_id` (uuid, FK → categorias, nullable)
- `nombre` (text)
- `descripcion` (text, nullable)
- `precio` (numeric)
- `precio_oferta` (numeric, nullable — si tiene valor, se muestra el precio normal tachado y este como precio final; así se maneja toda "promoción" o "oferta" en la plataforma, no hay tabla de promociones separada)
- `disponible` (boolean)
- `creado_en` (timestamptz)

### grupos_opciones
Adiciones/variantes de un producto (ej. "Adiciones", "Tamaño", "Punto de la carne").
- `id` (uuid, PK)
- `producto_id` (uuid, FK → productos)
- `nombre` (text)
- `obligatorio` (boolean)
- `seleccion` (text — `unica` o `multiple`)

### opciones
Valores dentro de un grupo de opciones (ej. "Queso extra +2000").
- `id` (uuid, PK)
- `grupo_opciones_id` (uuid, FK → grupos_opciones)
- `nombre` (text)
- `precio_extra` (numeric, default 0)

### pedidos
- `id` (uuid, PK)
- `negocio_id` (uuid, FK → negocios)
- `cliente_nombre` (text)
- `cliente_telefono` (text)
- `direccion` (text, nullable — no aplica en carta física)
- `productos_detalle` (jsonb — array con cada producto pedido, cantidad, precio base, opciones elegidas y subtotal; ver ejemplo abajo)
- `total` (numeric)
- `estado` (text — `nuevo`, `en_preparacion`, `entregado`)
- `creado_en` (timestamptz)

Ejemplo de `productos_detalle`:
```json
[
  {
    "producto_id": "uuid-hamburguesa",
    "nombre": "Hamburguesa clásica",
    "cantidad": 1,
    "precio_base": 15000,
    "opciones_elegidas": [
      { "nombre": "Queso extra", "precio_extra": 2000 },
      { "nombre": "Término medio", "precio_extra": 0 }
    ],
    "subtotal": 17000
  }
]
```

## Seguridad (RLS)

- Lectura pública (sin login) permitida en: `negocios` (solo si `activo = true`), `categorias`, `productos`, `grupos_opciones`, `opciones`. Esto es lo que permite que el menú/carta cargue sin que el cliente final tenga que iniciar sesión.
- Inserción pública permitida en `pedidos` (el cliente final crea su pedido sin login).
- Todo lo demás (crear/editar/eliminar productos, categorías, opciones; ver y actualizar pedidos) requiere sesión de `usuarios_admin`, y las políticas filtran por `negocio_id` extraído de los metadatos del usuario autenticado (`auth.jwt() -> 'app_metadata' ->> 'negocio_id'`).
- Como cada negocio corre en su propio proyecto React con su propio deploy, en la práctica cada frontend solo interactúa con su propio `negocio_id`, pero el RLS es la barrera real de seguridad (evita que alguien, inspeccionando el código o las credenciales públicas del proyecto, acceda a datos de otro negocio).

## Flujo de pantallas por perfil

**Cliente final**
- Inicio del negocio → Menú/carta filtrable por categoría → Detalle de producto (elige opciones/adiciones si aplica) → Carrito → Checkout (nombre, teléfono, dirección) → genera link `wa.me` con el pedido armado, el cliente solo confirma envío en WhatsApp.
- En modo carta física: mismo catálogo, sin carrito ni checkout (solo lectura).

**Empleado** (rol limitado)
- Login → Ve pedidos entrantes → Cambia estado del pedido (nuevo → en preparación → entregado). Sin acceso a productos, precios ni categorías.

**Dueño** (rol completo)
- Todo lo del empleado, más: CRUD de productos y categorías, gestión de precio_oferta, gestión de grupos de opciones/adiciones, gestión de usuarios empleados, historial completo de pedidos.

**Panel maestro** (fuera del alcance de este proyecto base — es una app aparte que administra el dueño de la plataforma)
- Lista de negocios, activar/desactivar, estado de pago.

## Estructura de carpetas sugerida para el proyecto base

```
proyecto-base/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Nav.jsx
│   │   │   └── Footer.jsx
│   │   ├── menu/
│   │   │   ├── ProductoCard.jsx
│   │   │   ├── CategoriaFiltro.jsx
│   │   │   └── OpcionesProducto.jsx
│   │   ├── carrito/
│   │   │   ├── Carrito.jsx
│   │   │   └── Checkout.jsx
│   │   ├── promociones/
│   │   │   └── BadgeOferta.jsx
│   │   └── admin/
│   │       ├── TablaProductos.jsx
│   │       ├── FormularioProducto.jsx
│   │       ├── GestionOpciones.jsx
│   │       ├── TablaPedidos.jsx
│   │       └── GestionUsuarios.jsx
│   ├── hooks/
│   │   ├── useCarrito.js
│   │   ├── useAuth.js
│   │   ├── useProductos.js
│   │   ├── useCategorias.js
│   │   └── usePedidos.js
│   ├── lib/
│   │   └── supabaseClient.js
│   ├── pages/
│   │   ├── Inicio.jsx
│   │   ├── Carta.jsx
│   │   ├── CartaFisica.jsx
│   │   └── admin/
│   │       ├── Login.jsx
│   │       ├── Dashboard.jsx
│   │       ├── Productos.jsx
│   │       ├── Pedidos.jsx
│   │       └── Usuarios.jsx
│   └── config/
│       └── negocio.config.js
├── .env.local  (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_NEGOCIO_ID)
└── package.json
```

`negocio.config.js` guarda el `negocio_id` fijo de ese proyecto/cliente, junto a cualquier dato de marca (colores, WhatsApp) que el propio código use directamente en sus componentes personalizados.

## Pendiente de definir/construir

- Código de `supabaseClient.js` y los hooks (`useAuth`, `useProductos`, `useCarrito`, `usePedidos`) que consumen la base de datos.
- Lógica de transformación número → correo falso interno para el login con Supabase Auth.
- Lógica de cálculo del total del carrito incluyendo `precio_oferta` y `opciones_elegidas`.
- Generación del mensaje/link de WhatsApp (`wa.me`) a partir del carrito.
- Panel maestro (proyecto aparte, fuera de este repo base).
