import { textoSabores } from './sabores'

// Máximo de adiciones de un producto (ver explicacion-script-bd.txt, sección 26). Con variante
// elegida manda la variante; sin variantes, el producto.
//   null → sin límite (valor por defecto: así funcionaba todo antes de este campo)
//   0    → no admite adiciones
//   N    → hasta N, contando repetidas (Leche x2 ocupa 2)
// `undefined` (la columna todavía no existe en la base) se trata como null.
export function cantidadAdiciones(producto, variante) {
  const valor = variante ? variante.cantidad_adiciones : producto.cantidad_adiciones
  return valor == null ? null : Number(valor)
}

// ¿El producto (o la variante) admite al menos una adición?
export function admiteAdiciones(maximo) {
  return maximo === null || maximo > 0
}

// Texto de las adiciones elegidas, agrupando repetidas: [Leche, Leche, Queso] → "Leche x2,
// Queso". Sirve para las del carrito ({ nombre }) y las de pedidos.productos_detalle.
export function textoAdiciones(opciones = []) {
  return textoSabores(opciones.map((o) => o.nombre))
}

export const MAX_ADICIONES = 20

// Del campo del formulario al valor de la columna: vacío = null (sin límite); si no, un entero
// entre 0 y MAX_ADICIONES (el mismo rango del check de la base).
export function normalizarMaximoAdiciones(valor) {
  if (valor === '' || valor == null) return null
  const numero = Math.trunc(Number(valor))
  if (Number.isNaN(numero)) return null
  return Math.min(MAX_ADICIONES, Math.max(0, numero))
}
