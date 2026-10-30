import { useRef } from 'react'

const UMBRAL_PX = 50

// Contenedores con su propio scroll horizontal (carrusel, chips de categoría): un swipe que
// empieza ahí debe scrollearlos a ellos, no disparar la navegación de secciones/categorías.
const SELECTOR_SCROLL_INTERNO = '.carrusel-destacados__pista, .carrusel-pedidos__pista, .filtro-categorias'

// Un swipe que empieza sobre el nav inferior debe cambiar de sección directamente, incluso
// estando en Menú — ahí no tiene sentido recorrer categorías primero, porque el dedo ya
// arrancó sobre el control de navegación, no sobre el contenido. Ver Carta.jsx.
const SELECTOR_NAV = '.nav-inferior'

// Gesto de swipe horizontal para navegar sin tocar los tabs (ver Carta.jsx: en Inicio/Carrito
// cambia de sección, en Menú primero recorre categorías y solo cambia de sección al pasarse
// del límite, salvo que el gesto arranque sobre el nav inferior). Se ignora si el gesto
// domina en vertical (para no pelear con el scroll normal de la página) o si empieza sobre
// un contenedor con scroll horizontal propio.
// `selectorIgnorar` reemplaza la lista de zonas donde el gesto no cuenta (el panel admin usa
// la suya, ver AdminLayout.jsx).
export function useSwipeNavegacion({ onSwipeIzquierda, onSwipeDerecha, selectorIgnorar = SELECTOR_SCROLL_INTERNO }) {
  const inicio = useRef(null)

  const onTouchStart = (evento) => {
    if (evento.target.closest?.(selectorIgnorar)) {
      inicio.current = null
      return
    }
    const toque = evento.touches[0]
    const enNav = Boolean(evento.target.closest?.(SELECTOR_NAV))
    inicio.current = { x: toque.clientX, y: toque.clientY, enNav }
  }

  const onTouchEnd = (evento) => {
    if (!inicio.current) return
    const toque = evento.changedTouches[0]
    const deltaX = toque.clientX - inicio.current.x
    const deltaY = toque.clientY - inicio.current.y
    const { enNav } = inicio.current
    inicio.current = null

    if (Math.abs(deltaX) < UMBRAL_PX || Math.abs(deltaX) < Math.abs(deltaY)) return

    if (deltaX < 0) onSwipeIzquierda({ enNav })
    else onSwipeDerecha({ enNav })
  }

  return { onTouchStart, onTouchEnd }
}
