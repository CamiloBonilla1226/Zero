import { Interruptor } from './Interruptor'

const formatoPrecio = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

export function TablaAdiciones({ adiciones, onEditar, onEliminar, onToggleDisponible }) {
  if (adiciones.length === 0) {
    return <p className="texto-suave admin-vacio">No hay adiciones para mostrar.</p>
  }

  return (
    <ul className="lista-productos-admin">
      {adiciones.map((adicion) => (
        <li
          key={adicion.id}
          className="tarjeta adicion-admin-item producto-admin-item--clicable"
          onClick={() => onEditar(adicion)}
        >
          <div className="producto-admin-item__info">
            <strong className="producto-admin-item__nombre" title={adicion.nombre}>
              {adicion.nombre}
            </strong>
            <span className="texto-suave producto-admin-item__categoria">
              {adicion.descripcion || 'Sin descripción'}
            </span>
            <span className="producto-admin-item__precio">{formatoPrecio.format(adicion.precio)}</span>
            <span className="producto-admin-item__etiquetas">
              {!adicion.disponible && (
                <span className="producto-admin-item__etiqueta producto-admin-item__etiqueta--agotado">
                  No disponible
                </span>
              )}
            </span>
          </div>
          <div className="producto-admin-item__acciones" onClick={(evento) => evento.stopPropagation()}>
            <Interruptor activo={adicion.disponible} onCambiar={(valor) => onToggleDisponible(adicion.id, valor)} />
            <button type="button" className="carrito__quitar" onClick={() => onEliminar(adicion.id)}>
              Eliminar
            </button>
          </div>
        </li>
      ))}
    </ul>
  )
}
