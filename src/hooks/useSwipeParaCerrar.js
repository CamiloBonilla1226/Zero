import { useRef, useState } from 'react'

// Para cerrar hacia abajo, el dedo tiene que empezar en la franja superior del panel (donde
// está la barrita de agarre, ver .superposicion__panel::before en index.css). Arrastrar sobre
// el contenido es siempre scroll: antes, cualquier arrastre hacia abajo con el panel arriba del
// todo lo cerraba, y al revisar un formulario largo se salía sin querer.
const ZONA_AGARRE_PX = 64
// Distancia mínima para cerrar: lo que sea mayor entre estos px y la fracción del panel.
const MINIMO_PX = 120
const FRACCION_ALTO = 0.25
const FRACCION_ANCHO = 0.35
// El eje se decide recién con este movimiento, y el horizontal tiene que dominar con claridad
// (el doble que el vertical): un scroll que arranca un poco ladeado no es un cierre.
const DECISION_PX = 12
const DOMINIO_HORIZONTAL = 2
// Arrastrar dentro de un campo mueve el cursor o selecciona texto: no cierra.
const SELECTOR_CAMPOS = 'input, textarea, select'

// Gesto táctil para cerrar un panel/modal en móvil: deslizar de izquierda a derecha, o de
// arriba hacia abajo desde la franja superior (como una hoja inferior). El eje se decide con
// el primer movimiento claro y ya no cambia durante ese gesto. Devuelve los handlers de touch
// para el elemento del panel (que es el que hace scroll) y un `estilo` que sigue el dedo
// mientras se arrastra y se resetea al soltar si no se llegó a la distancia necesaria.
export function useSwipeParaCerrar(onCerrar) {
  const inicio = useRef(null)
  const eje = useRef(null) // 'x' | 'y' | null
  const [desplazamiento, setDesplazamiento] = useState({ x: 0, y: 0 })

  const onTouchStart = (evento) => {
    eje.current = null
    if (evento.target.closest?.(SELECTOR_CAMPOS)) {
      inicio.current = null
      return
    }
    const toque = evento.touches[0]
    const panel = evento.currentTarget
    const caja = panel.getBoundingClientRect()
    inicio.current = {
      x: toque.clientX,
      y: toque.clientY,
      // Hacia abajo solo con el panel arriba del todo y el dedo en la franja de agarre.
      puedeBajar: (panel.scrollTop ?? 0) <= 0 && toque.clientY - caja.top <= ZONA_AGARRE_PX,
      umbralX: Math.max(MINIMO_PX, caja.width * FRACCION_ANCHO),
      umbralY: Math.max(MINIMO_PX, caja.height * FRACCION_ALTO),
    }
  }

  const onTouchMove = (evento) => {
    if (!inicio.current) return
    const toque = evento.touches[0]
    const deltaX = toque.clientX - inicio.current.x
    const deltaY = toque.clientY - inicio.current.y

    if (!eje.current) {
      if (Math.abs(deltaX) < DECISION_PX && Math.abs(deltaY) < DECISION_PX) return
      if (deltaX > 0 && deltaX > Math.abs(deltaY) * DOMINIO_HORIZONTAL) eje.current = 'x'
      else if (deltaY > 0 && deltaY > Math.abs(deltaX) && inicio.current.puedeBajar) eje.current = 'y'
      else {
        // Scroll normal, o movimiento hacia otro lado: no es un cierre.
        inicio.current = null
        return
      }
    }

    if (eje.current === 'x') setDesplazamiento({ x: Math.max(0, deltaX), y: 0 })
    else setDesplazamiento({ x: 0, y: Math.max(0, deltaY) })
  }

  const onTouchEnd = () => {
    const umbral = inicio.current
    if (umbral && (desplazamiento.x > umbral.umbralX || desplazamiento.y > umbral.umbralY)) {
      onCerrar()
    }
    setDesplazamiento({ x: 0, y: 0 })
    inicio.current = null
    eje.current = null
  }

  const arrastrando = desplazamiento.x > 0 || desplazamiento.y > 0

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    estilo: arrastrando
      ? { transform: `translate(${desplazamiento.x}px, ${desplazamiento.y}px)`, transition: 'none' }
      : undefined,
  }
}
