// Categorías ancladas al Inicio de la carta de domicilios (columnas categorias.en_inicio y
// categorias.emoji_inicio, ver explicacion-script-bd.txt sección 4). El diseño de la
// cuadrícula de Inicio es de 2 columnas: solo se muestra con 2 o 4 categorías ancladas, para
// que nunca quede una casilla suelta. La base de datos impide anclar más de 4.

export const MAX_CATEGORIAS_INICIO = 4
const CANTIDADES_VALIDAS = [2, 4]

// Íconos de línea que el admin puede elegir (los dibujos están en
// components/inicio/IconoCategoria.jsx). Se guarda la clave en categorias.emoji_inicio: la
// columna conserva el nombre de cuando guardaba un emoji.
export const ICONOS_CATEGORIA = [
  ['vaso', 'Vaso'],
  ['vaso-pitillo', 'Vaso con pitillo'],
  ['helado', 'Helado'],
  ['hielo', 'Hielo'],
  ['jarra', 'Cerveza'],
  ['botella', 'Botella'],
  ['coctel', 'Coctel'],
  ['copa', 'Copa'],
  ['shot', 'Shot'],
  ['fruta', 'Fruta'],
  ['combo', 'Combo'],
  ['snack', 'Snack'],
  ['estrella', 'Estrella'],
  ['fuego', 'Fuego'],
  ['rayo', 'Rayo'],
  ['corazon', 'Corazón'],
]

const CLAVES = new Set(ICONOS_CATEGORIA.map(([clave]) => clave))

// Las primeras categorías ancladas se guardaron con un emoji (antes del cambio a íconos):
// se traducen al ícono más parecido para no tener que volver a elegirlo.
const EMOJI_A_ICONO = {
  '🍧': 'vaso', '🥤': 'vaso-pitillo', '🧊': 'hielo', '🍹': 'coctel', '🍸': 'coctel',
  '🍺': 'jarra', '🍻': 'jarra', '🍾': 'botella', '🥃': 'shot', '🍷': 'copa',
  '🍓': 'fruta', '🍋': 'fruta', '🥭': 'fruta', '🍍': 'fruta', '🍉': 'fruta',
  '🍒': 'fruta', '🥥': 'fruta', '🍑': 'fruta', '🫐': 'fruta',
  '🍫': 'snack', '🍬': 'snack', '🍿': 'snack', '🍟': 'snack', '🌭': 'snack',
  '🎁': 'combo', '🔥': 'fuego', '⭐': 'estrella', '💥': 'rayo', '🎉': 'rayo', '❤️': 'corazon',
}

// Clave de ícono a partir de lo guardado (clave nueva o emoji antiguo); null si no hay.
export function claveIcono(valor) {
  if (!valor) return null
  const limpio = valor.trim()
  if (CLAVES.has(limpio)) return limpio
  return EMOJI_A_ICONO[limpio] ?? null
}

// De las categorías que ya se ven en la carta (activas, visibles en domicilios y con
// productos), las ancladas con ícono. Si no son exactamente 2 o 4, Inicio no muestra la sección.
export function categoriasDeInicio(categoriasVisibles) {
  const ancladas = categoriasVisibles.filter((categoria) => categoria.en_inicio && categoria.emoji_inicio)
  return CANTIDADES_VALIDAS.includes(ancladas.length) ? ancladas : []
}

// Texto de estado para el panel, según cuántas hay ancladas.
export function estadoAncladas(cantidad) {
  if (cantidad === 0) return 'Ninguna anclada: la sección de categorías no aparece en el inicio de la carta.'
  if (CANTIDADES_VALIDAS.includes(cantidad)) return `${cantidad} ancladas: se muestran en el inicio de la carta.`
  return `${cantidad} anclada${cantidad === 1 ? '' : 's'}: deben ser 2 o 4 para que la sección aparezca en el inicio.`
}

export const cantidadValida = (cantidad) => CANTIDADES_VALIDAS.includes(cantidad)
