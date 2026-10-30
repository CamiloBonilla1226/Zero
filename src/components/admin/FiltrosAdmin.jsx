import { useState } from 'react'

// Grupo de opciones (una seleccionada a la vez) con el estilo de "segmentado": una sola
// píldora gris con la opción activa resaltada en blanco, mucho más compacta que una fila
// de botones sueltos.
export function GrupoFiltro({ titulo, opciones, valor, onCambiar }) {
  return (
    <div className="filtros-admin__grupo" role="group" aria-label={titulo}>
      <span className="filtros-admin__titulo">{titulo}</span>
      <div className="filtros-admin__segmentos">
        {opciones.map((opcion) => (
          <button
            key={opcion.valor}
            type="button"
            className={`filtros-admin__segmento${valor === opcion.valor ? ' filtros-admin__segmento--activo' : ''}`}
            aria-pressed={valor === opcion.valor}
            onClick={() => onCambiar(opcion.valor)}
          >
            {opcion.texto}
          </button>
        ))}
      </div>
    </div>
  )
}

// Barra de una sola línea (botón "Filtros" con contador de filtros activos + cantidad de
// resultados). Las opciones viven en un panel que se despliega solo al tocar el botón, así
// la lista arranca casi arriba de la pantalla.
export function FiltrosAdmin({ children, total, mostrados, activos = 0, onLimpiar }) {
  const [abierto, setAbierto] = useState(false)

  return (
    <section className="filtros-admin" aria-label="Filtros">
      <div className="filtros-admin__barra">
        <button
          type="button"
          className={`filtros-admin__boton${abierto ? ' filtros-admin__boton--abierto' : ''}`}
          onClick={() => setAbierto((actual) => !actual)}
          aria-expanded={abierto}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M4 6h16M7 12h10M10 18h4" />
          </svg>
          Filtros
          {activos > 0 && <span className="filtros-admin__contador">{activos}</span>}
        </button>

        <span className="filtros-admin__resultado">
          {mostrados === total ? `${total} en total` : `${mostrados} de ${total}`}
        </span>

        {activos > 0 && (
          <button type="button" className="filtros-admin__limpiar" onClick={onLimpiar}>
            Limpiar
          </button>
        )}
      </div>

      {abierto && <div className="filtros-admin__panel">{children}</div>}
    </section>
  )
}
