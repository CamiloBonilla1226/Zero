const ICONOS = {
  cerrar: <path d="M6 6l12 12M18 6L6 18" />,
  activar: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.5l2.8 2.8L16.5 9.5" />
    </>
  ),
  desactivar: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M5.7 5.7l12.6 12.6" />
    </>
  ),
  categorias: (
    <>
      <path d="M3.5 12.2V4.5a1 1 0 0 1 1-1h7.7a1 1 0 0 1 .7.3l7.8 7.8a1 1 0 0 1 0 1.4l-7.7 7.7a1 1 0 0 1-1.4 0l-7.8-7.8a1 1 0 0 1-.3-.7z" />
      <circle cx="8" cy="8" r="1.4" />
    </>
  ),
  eliminar: (
    <>
      <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-12M9 7V4.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 .5.5V7" />
    </>
  ),
}

function Icono({ nombre }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICONOS[nombre]}
    </svg>
  )
}

// Barra flotante al pie de la pantalla mientras hay productos seleccionados en Productos.jsx.
export function AccionesMasivasProductos({
  cantidad,
  totalVisibles,
  ocupado,
  onSeleccionarTodos,
  onLimpiar,
  onActivar,
  onDesactivar,
  onCategorias,
  onEliminar,
}) {
  const acciones = [
    { id: 'activar', texto: 'Activar', onClick: onActivar },
    { id: 'desactivar', texto: 'Desactivar', onClick: onDesactivar },
    { id: 'categorias', texto: 'Categorías', onClick: onCategorias },
    { id: 'eliminar', texto: 'Eliminar', onClick: onEliminar, peligro: true },
  ]

  return (
    <div
      className={`acciones-masivas${ocupado ? ' acciones-masivas--ocupada' : ''}`}
      role="toolbar"
      aria-label="Acciones para los productos seleccionados"
      aria-busy={ocupado}
    >
      <div className="acciones-masivas__encabezado">
        <button
          type="button"
          className="acciones-masivas__cerrar"
          onClick={onLimpiar}
          disabled={ocupado}
          aria-label="Quitar selección"
          title="Quitar selección"
        >
          <Icono nombre="cerrar" />
        </button>
        <strong className="acciones-masivas__contador" aria-live="polite">
          {cantidad} seleccionado{cantidad === 1 ? '' : 's'}
        </strong>
        {cantidad < totalVisibles && (
          <button type="button" className="acciones-masivas__todos" onClick={onSeleccionarTodos} disabled={ocupado}>
            Seleccionar todos ({totalVisibles})
          </button>
        )}
      </div>

      <div className="acciones-masivas__botones">
        {acciones.map((accion) => (
          <button
            key={accion.id}
            type="button"
            className={`acciones-masivas__accion${accion.peligro ? ' acciones-masivas__accion--peligro' : ''}`}
            onClick={accion.onClick}
            disabled={ocupado}
          >
            <Icono nombre={accion.id} />
            <span>{accion.texto}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
