import { useEffect, useState } from 'react'

// Punto de quiebre "computador" del proyecto: debe coincidir con el @media (min-width: 1024px)
// del bloque responsive de index.css.
export const CONSULTA_ESCRITORIO = '(min-width: 1024px)'

// true mientras la consulta de medios se cumple; se actualiza sola al girar la tableta o
// cambiar el tamaño de la ventana.
export function useMediaQuery(consulta) {
  const [coincide, setCoincide] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(consulta).matches
  )

  useEffect(() => {
    const lista = window.matchMedia(consulta)
    const alCambiar = () => setCoincide(lista.matches)
    alCambiar()
    lista.addEventListener('change', alCambiar)
    return () => lista.removeEventListener('change', alCambiar)
  }, [consulta])

  return coincide
}
