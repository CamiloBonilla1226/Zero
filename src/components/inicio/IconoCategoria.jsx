import { claveIcono } from '../../lib/categoriasInicio'

// Íconos de línea delgada para las categorías ancladas al Inicio (lista y claves en
// lib/categoriasInicio.js). Sin ícono reconocible se dibuja el vaso.

const trazo = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round', strokeLinejoin: 'round' }

const dibujos = {
  vaso: (
    <>
      <path d="M8 4h8l.6 3H7.4L8 4Z" />
      <path d="M6.5 7h11" />
      <path d="M7.6 7l1.1 13h6.6l1.1-13" />
    </>
  ),
  'vaso-pitillo': (
    <>
      <path d="M6 9h12" />
      <path d="M7 9l1.3 11h7.4L17 9" />
      <path d="M13 9l1.6-6H17" />
    </>
  ),
  jarra: (
    <>
      <path d="M5 8h10v11a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V8Z" />
      <path d="M15 11h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2" />
      <path d="M5 8a2.5 2.5 0 0 1 3-2.4A2.8 2.8 0 0 1 12.6 5 2.3 2.3 0 0 1 15 8" />
      <path d="M8.5 11v6M11.5 11v6" />
    </>
  ),
  botella: (
    <>
      <path d="M10 2.5h4" />
      <path d="M10.5 2.5V6L9 8.5V20a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1V8.5L13.5 6V2.5" />
      <path d="M9 13h6" />
    </>
  ),
  coctel: (
    <>
      <path d="M5 5h14l-7 7.5L5 5Z" />
      <path d="M12 12.5V20M8.5 20h7" />
      <path d="M14.5 5l2.5-2.5" />
    </>
  ),
  copa: (
    <>
      <path d="M8 3h8l-.4 5a3.6 3.6 0 0 1-7.2 0L8 3Z" />
      <path d="M12 11.6V20M8.5 20h7" />
    </>
  ),
  shot: (
    <>
      <path d="M7 6h10l-1.4 14H8.4L7 6Z" />
      <path d="M7.5 11h9" />
    </>
  ),
  hielo: (
    <>
      <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
      <path d="M4 7.5l8 4.5 8-4.5M12 12v9" />
    </>
  ),
  helado: (
    <>
      <path d="M8 10a4 4 0 1 1 8 0" />
      <path d="M7.5 10h9L12 21 7.5 10Z" />
    </>
  ),
  fruta: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="5.5" />
      <path d="M12 6.5v11M6.5 12h11M8.1 8.1l7.8 7.8M15.9 8.1l-7.8 7.8" />
    </>
  ),
  combo: (
    <>
      <path d="M3.5 9h17v4h-17zM5 13v7.5h14V13M12 9v11.5" />
      <path d="M12 9c-2-3.6-6-3.6-6-1.3S9 9 12 9Zm0 0c2-3.6 6-3.6 6-1.3S15 9 12 9Z" />
    </>
  ),
  snack: (
    <>
      <path d="M6.5 10h11l-1.6 11H8.1L6.5 10Z" />
      <path d="M8.5 10V4.5M11 10V3.5M13.5 10V3.5M16 10V4.5" />
    </>
  ),
  estrella: <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9L12 3.5Z" />,
  fuego: (
    <path d="M12 21c-3.6 0-6-2.4-6-5.6 0-3.4 2.6-5 3.4-8.4 1.9 1.3 2.8 3 2.8 4.6 1-.7 1.6-1.9 1.6-3.2 2 1.6 4.2 4.1 4.2 7 0 3.2-2.4 5.6-6 5.6Z" />
  ),
  rayo: <path d="M13 2.5 5 13.5h6l-1 8 8-11h-6l1-8Z" />,
  corazon: <path d="M12 20s-7.5-4.4-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.6-7.5 10-7.5 10Z" />,
}

export function IconoCategoria({ clave, tamano = 26 }) {
  return (
    <svg viewBox="0 0 24 24" width={tamano} height={tamano} aria-hidden="true" {...trazo}>
      {dibujos[claveIcono(clave) ?? 'vaso']}
    </svg>
  )
}
