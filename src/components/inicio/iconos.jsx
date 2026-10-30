// Íconos de línea de la sección Inicio (trazo `currentColor`, sin relleno).

const trazo = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' }

function Svg({ tamano = 24, children }) {
  return (
    <svg viewBox="0 0 24 24" width={tamano} height={tamano} aria-hidden="true" {...trazo}>
      {children}
    </svg>
  )
}

// Vaso de granizado con pitillo (sirve para paletas y granizados): imagen de respaldo de las tarjetas sin foto.
export const IconoVaso = ({ tamano }) => (
  <Svg tamano={tamano}>
    <path d="M6 8h12l-1.6 12.2a1 1 0 0 1-1 .8H8.6a1 1 0 0 1-1-.8L6 8Z" />
    <path d="M5 8h14M13 8l2.5-5H18" />
    <path d="M7 13h10" />
  </Svg>
)

export const IconoReloj = ({ tamano }) => (
  <Svg tamano={tamano}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </Svg>
)

export const IconoUbicacion = ({ tamano }) => (
  <Svg tamano={tamano}>
    <path d="M12 21s7-6.2 7-11.5a7 7 0 1 0-14 0C5 14.8 12 21 12 21Z" />
    <circle cx="12" cy="9.5" r="2.5" />
  </Svg>
)

export const IconoRedes = ({ tamano }) => (
  <Svg tamano={tamano}>
    <rect x="3.5" y="3.5" width="17" height="17" />
    <circle cx="12" cy="12" r="4" />
    <path d="M17 7h.01" />
  </Svg>
)

export const IconoInstagram = ({ tamano }) => (
  <Svg tamano={tamano}>
    <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
    <circle cx="12" cy="12" r="4" />
    <path d="M17 7h.01" />
  </Svg>
)

export const IconoFacebook = ({ tamano }) => (
  <Svg tamano={tamano}>
    <path d="M14.5 21v-7.5h2.5l.5-3h-3V8.7c0-.9.3-1.5 1.6-1.5h1.5V4.5c-.3 0-1.2-.1-2.3-.1-2.3 0-3.8 1.4-3.8 3.9v2.2H9v3h2.5V21" />
  </Svg>
)

export const IconoWhatsapp = ({ tamano }) => (
  <Svg tamano={tamano}>
    <path d="M4 20l1.3-4A8 8 0 1 1 8.4 19L4 20Z" />
    <path d="M9 8.5c0 3.5 3 6.5 6.5 6.5l1-1.6-2-1-1 .8a5 5 0 0 1-2.7-2.7l.8-1-1-2L9 8.5Z" />
  </Svg>
)
