// Reserva el espacio de la imagen antes de cargar (evita saltos de layout) y difiere
// la carga de las que no son visibles de inmediato, sin que se sienta un "aparece
// después" brusco cuando el usuario llega a verlas (fade-in corto al terminar de cargar).
import { useState } from 'react'

export function ImagenProducto({ src, alt, relacionAspecto = '1 / 1', prioridad = false }) {
  const [cargada, setCargada] = useState(false)

  if (!src) {
    return (
      <div className="imagen-contenedor" style={{ '--relacion-aspecto': relacionAspecto }}>
        <span className="visualmente-oculto">{alt}</span>
      </div>
    )
  }

  return (
    <div className="imagen-contenedor" style={{ '--relacion-aspecto': relacionAspecto }}>
      <img
        src={src}
        alt={alt}
        loading={prioridad ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={() => setCargada(true)}
        style={{ opacity: cargada ? 1 : 0, transition: 'opacity 0.2s ease' }}
      />
    </div>
  )
}
