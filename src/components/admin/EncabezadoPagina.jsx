// Encabezado común de cada sección del panel: título, una línea que explica para qué sirve
// la sección y, a la derecha, la acción principal (ej. "Nuevo producto"). Así todas las
// pantallas arrancan igual y el botón de crear siempre está en el mismo lugar.
export function EncabezadoPagina({ titulo, descripcion, accion }) {
  return (
    <header className="admin-pagina__encabezado">
      <div className="admin-pagina__textos">
        <h1>{titulo}</h1>
        {descripcion && <p className="admin-pagina__descripcion">{descripcion}</p>}
      </div>
      {accion}
    </header>
  )
}

// Botón "+ Nuevo…" que va como acción del encabezado.
export function BotonCrear({ children, onClick }) {
  return (
    <button type="button" className="admin-crear admin-crear--boton" onClick={onClick}>
      <span className="admin-crear__icono" aria-hidden="true">
        +
      </span>
      {children}
    </button>
  )
}
