import { useCallback, useEffect, useState } from 'react'

const SECCIONES = ['inicio', 'menu', 'carrito', 'checkout']

const seccionDeHistorial = () => {
  const seccion = window.history.state?.seccion
  return SECCIONES.includes(seccion) ? seccion : 'inicio'
}

// Estado de la sección activa de la carta (Inicio / Menú / Carrito / Checkout) ligado al
// historial del navegador: cada cambio de sección agrega una entrada, así el botón "atrás"
// del celular vuelve a la sección anterior (Carrito → Menú → Inicio) y solo al llegar al
// principio sale de la página. Se guarda en `history.state` (copiando lo que ya haya, porque
// React Router guarda ahí su índice de navegación). El `state` sobrevive a recargar la
// página, así que al recargar se vuelve a la sección en la que se estaba.
export function useSeccionesConHistorial() {
  const [seccion, setSeccion] = useState(() => {
    // Al recargar en pleno checkout se vuelve al carrito: el formulario no se conserva.
    const guardada = seccionDeHistorial()
    return guardada === 'checkout' ? 'carrito' : guardada
  })

  useEffect(() => {
    // Marca la entrada actual con su sección, para que "atrás" pueda volver a ella.
    window.history.replaceState({ ...window.history.state, seccion }, '')

    const alAtras = () => setSeccion(seccionDeHistorial())
    window.addEventListener('popstate', alAtras)
    return () => window.removeEventListener('popstate', alAtras)
    // Solo al montar: los cambios posteriores de `seccion` pasan por irASeccion.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // `reemplazar`: cambia la sección sin agregar entrada (la actual se sobrescribe). Sirve
  // cuando "atrás" no debería volver a la pantalla que se deja, ej. el checkout ya enviado.
  const irASeccion = useCallback((nueva, { reemplazar = false } = {}) => {
    if (window.history.state?.seccion === nueva) return
    const estado = { ...window.history.state, seccion: nueva, superposicion: undefined }
    if (reemplazar) window.history.replaceState(estado, '')
    else window.history.pushState(estado, '')
    setSeccion(nueva)
  }, [])

  return [seccion, irASeccion]
}
