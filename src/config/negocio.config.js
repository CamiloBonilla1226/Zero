// Configuración específica de este negocio/cliente.
// Al clonar este proyecto base para un negocio nuevo, este es el único archivo
// que debe actualizarse con los datos reales antes de personalizar el diseño.

// UUID de ejemplo original de este archivo. Se exporta para que supabaseClient.js pueda
// advertir si negocioId no se reemplazó: un negocioId placeholder produce un correo interno
// (ver lib/phoneAuth.js) que no coincide con ningún usuario real, y el login falla con un
// 400 "Bad Request" que parece un problema de credenciales pero es un desajuste de config
// (ver CHANGELOG.md, lección aprendida del 2026-09-24).
export const NEGOCIO_ID_EJEMPLO = '00000000-0000-0000-0000-000000000000'

export const negocioConfig = {
  // ID del negocio en Supabase (columna `negocios.id`). Reemplazar por el real.
  // TODO ZÉRO: poner el UUID de la fila de ZÉRO en `negocios` (mientras siga el de ejemplo,
  // supabaseClient.js avisa en consola y el login del panel falla).
  negocioId: NEGOCIO_ID_EJEMPLO,
  nombre: 'ZÉRO',
  // Frase bajo el logo en Inicio. Solo se usa si el dueño no escribió una en /admin/negocio
  // ("Frase de inicio", columna negocio_config.descripcion).
  // TODO ZÉRO: frase propia del negocio (o escribirla desde /admin/negocio).
  lema: 'Paletas artesanales & granizados',
  // Rótulo corto sobre la frase de Inicio: qué vende el negocio y dónde.
  rubro: 'Paletas & granizados · Popayán',

  // Número de WhatsApp del negocio, en formato internacional sin signos (ej. 573001234567).
  // Se usa para armar el link wa.me del checkout.
  // TODO ZÉRO: número real de WhatsApp de ZÉRO (a este llegan los pedidos).
  whatsappContacto: '570000000000',

  // Los colores de la marca viven en :root de src/index.css (--color-bg, --color-primary...).
  // Aquí solo queda la tipografía, que App.jsx aplica como variable CSS.
  marca: {
    fuente: "'Archivo', system-ui, sans-serif",
  },
}
