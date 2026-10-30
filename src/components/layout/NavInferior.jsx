import { useEffect, useRef, useState } from 'react'

const TABS = [
  {
    id: 'inicio',
    etiqueta: 'Inicio',
    icono: (
      <path d="M3 11.5 12 4l9 7.5M5.5 10v9h13v-9" fill="none" stroke="currentColor" strokeWidth="1.8" />
    ),
  },
  {
    id: 'menu',
    etiqueta: 'Menú',
    icono: (
      <path
        d="M5 6h14M5 12h14M5 18h14"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    ),
  },
  {
    id: 'carrito',
    etiqueta: 'Carrito',
    icono: (
      <path
        d="M4 5h2l2 11h10l2-8H7M9 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm8 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    ),
  },
]

// Nav inferior fijo con 3 pestañas. El ícono de Carrito rebota brevemente cada vez que
// `cantidadTotal` sube (agregar un producto desde cualquier parte de la carta), como
// confirmación visual sin necesitar ninguna acción de quien usa la carta (se apaga sola).
export function NavInferior({ seccionActiva, onCambiarSeccion, cantidadTotal }) {
  const [rebotando, setRebotando] = useState(false)
  const cantidadAnterior = useRef(cantidadTotal)

  // Marca el body mientras este nav fijo está montado, para que el toast global (que
  // también es fixed al fondo, ver ToastProvider.jsx) se desplace por encima y no quede
  // tapado. Ninguna otra página del proyecto agrega esta clase.
  useEffect(() => {
    document.body.classList.add('body--con-nav-inferior')
    return () => document.body.classList.remove('body--con-nav-inferior')
  }, [])

  useEffect(() => {
    if (cantidadTotal > cantidadAnterior.current) {
      setRebotando(true)
      const temporizador = setTimeout(() => setRebotando(false), 300)
      cantidadAnterior.current = cantidadTotal
      return () => clearTimeout(temporizador)
    }
    cantidadAnterior.current = cantidadTotal
  }, [cantidadTotal])

  return (
    <nav className="nav-inferior" aria-label="Navegación principal">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className="nav-inferior__item"
          aria-current={seccionActiva === tab.id ? 'page' : undefined}
          onClick={() => onCambiarSeccion(tab.id)}
        >
          <span className={`nav-inferior__icono ${tab.id === 'carrito' && rebotando ? 'nav-inferior__icono--rebote' : ''}`}>
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
              {tab.icono}
            </svg>
            {tab.id === 'carrito' && cantidadTotal > 0 && (
              <span className="nav-inferior__contador">{cantidadTotal}</span>
            )}
          </span>
          <span className="nav-inferior__etiqueta">{tab.etiqueta}</span>
        </button>
      ))}
    </nav>
  )
}
