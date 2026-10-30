import { useEffect, useRef } from 'react'

const DURACION_MS = 500
// Si el dedo se mueve más que esto antes de cumplir el tiempo, era un scroll, no una
// pulsación sostenida.
const TOLERANCIA_PX = 10

// El click que el navegador dispara al soltar después de una pulsación larga se descarta, en
// toda la página y no solo en el elemento: lo que aparece al completarse (ej. la barra de
// acciones masivas, fija abajo) puede quedar justo bajo el dedo, y ese click activaría uno de
// sus botones ("Desactivar", "Quitar selección") sin querer. El bloqueo se levanta con el
// siguiente toque real (pointerdown) o, si el navegador no generó ese click, al segundo.
function descartarClickAlSoltar() {
  const descartar = (evento) => {
    evento.stopPropagation()
    evento.preventDefault()
    levantar()
  }
  const levantar = () => {
    window.removeEventListener('click', descartar, true)
    window.removeEventListener('pointerdown', levantar, true)
    clearTimeout(temporizador)
  }
  const temporizador = setTimeout(levantar, 1000)
  window.addEventListener('click', descartar, true)
  // Se registra en el siguiente ciclo: el pointerup/pointerdown de esta misma pulsación no
  // debe levantarlo.
  setTimeout(() => window.addEventListener('pointerdown', levantar, true), 0)
}

// Mantener presionado un elemento de una lista. Se llama una vez para toda la lista y
// devuelve `props(valor)` para esparcir en cada elemento. Cuando la pulsación se completa,
// el click que el navegador dispara al soltar se descarta (ver arriba), para que no cuente
// además como un toque normal. `ignorar`: selector de zonas dentro del elemento donde no
// aplica (botones propios, interruptores).
//
// En Chrome para Android la pulsación larga nativa (menú contextual) llega casi a la vez que
// este temporizador y cancela el puntero (`pointercancel`). Por eso `pointercancel` no anula
// la pulsación: el menú contextual la completa en el acto, y un scroll se detecta por el
// desplazamiento real de la página, no por la cancelación.
export function useMantenerPresionado(onMantener, { ignorar } = {}) {
  const pendiente = useRef(null)

  const cancelar = () => {
    const actual = pendiente.current
    if (!actual) return
    clearTimeout(actual.temporizador)
    // Se quita la misma función que se registró (esta se recrea en cada render).
    window.removeEventListener('scroll', actual.alScroll, true)
    pendiente.current = null
  }

  const completar = () => {
    const actual = pendiente.current
    if (!actual) return
    cancelar()
    descartarClickAlSoltar()
    navigator.vibrate?.(30)
    actual.onMantener(actual.valor)
  }

  useEffect(() => cancelar, [])

  return (valor) => ({
    onPointerDown: (evento) => {
      cancelar()
      if (evento.button !== 0 || (ignorar && evento.target.closest?.(ignorar))) return
      pendiente.current = {
        temporizador: setTimeout(completar, DURACION_MS),
        x: evento.clientX,
        y: evento.clientY,
        valor,
        onMantener,
        alScroll: cancelar,
      }
      // Capture: también detecta el scroll de cualquier contenedor, no solo de la página.
      window.addEventListener('scroll', cancelar, { capture: true, passive: true })
    },
    onPointerMove: (evento) => {
      const inicio = pendiente.current
      if (inicio && Math.hypot(evento.clientX - inicio.x, evento.clientY - inicio.y) > TOLERANCIA_PX) cancelar()
    },
    onPointerUp: cancelar,
    onPointerLeave: (evento) => {
      if (evento.pointerType === 'mouse') cancelar()
    },
    // Después de un pointercancel ya no llega pointerup: soltar el dedo antes de tiempo se
    // detecta con touchend.
    onTouchEnd: cancelar,
    onContextMenu: (evento) => {
      evento.preventDefault()
      completar()
    },
  })
}
