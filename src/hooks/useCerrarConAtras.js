import { useEffect, useRef } from 'react'

// Hace que el botón "atrás" del celular (o la flecha del navegador) cierre un modal en vez de
// sacar al usuario de la página. Mientras el modal está abierto se agrega una entrada al
// historial; "atrás" consume esa entrada (y aquí se cierra el modal) en lugar de salir del
// sitio. Si el modal se cierra por otro medio (×, arrastrar, agregar al carrito, tocar el
// fondo) se retira esa entrada extra para que el historial quede limpio.
//
// Se copia `history.state` al agregar la entrada porque React Router guarda ahí su índice de
// navegación; una entrada sin él lo desorientaría.

// Cuando NOSOTROS llamamos a history.back() para limpiar la entrada extra, el navegador
// dispara un popstate que no debe interpretarse como "el usuario presionó atrás".
let ignorarPopstate = false

export function useCerrarConAtras(abierto, onCerrar) {
  const cerrarRef = useRef(onCerrar)
  useEffect(() => {
    cerrarRef.current = onCerrar
  })

  useEffect(() => {
    if (!abierto) return undefined

    window.history.pushState({ ...window.history.state, superposicion: true }, '')
    let cerradoPorAtras = false

    const alAtras = () => {
      if (ignorarPopstate) {
        ignorarPopstate = false
        return
      }
      cerradoPorAtras = true
      cerrarRef.current()
    }
    window.addEventListener('popstate', alAtras)

    return () => {
      window.removeEventListener('popstate', alAtras)
      if (!cerradoPorAtras && window.history.state?.superposicion) {
        ignorarPopstate = true
        window.history.back()
      }
    }
  }, [abierto])
}
