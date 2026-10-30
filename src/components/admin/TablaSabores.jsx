import { Interruptor } from './Interruptor'

// Lista de sabores del panel: el interruptor es el uso diario (qué sabores hay hoy), por eso va
// a la vista en cada fila; tocar la fila abre la edición.
export function TablaSabores({ sabores, onEditar, onEliminar, onToggleDisponible }) {
  if (sabores.length === 0) {
    return <p className="texto-suave admin-vacio">Todavía no hay sabores. Crea el primero con "Nuevo sabor".</p>
  }

  return (
    <ul className="lista-productos-admin">
      {sabores.map((sabor) => (
        <li
          key={sabor.id}
          className="tarjeta adicion-admin-item producto-admin-item--clicable"
          onClick={() => onEditar(sabor)}
        >
          <div className="producto-admin-item__info">
            <strong className="producto-admin-item__nombre" title={sabor.nombre}>
              {sabor.nombre}
            </strong>
            <span className="texto-suave producto-admin-item__categoria">{sabor.descripcion || 'Sin descripción'}</span>
            <span className="producto-admin-item__etiquetas">
              {!sabor.disponible && (
                <span className="producto-admin-item__etiqueta producto-admin-item__etiqueta--agotado">
                  No disponible hoy
                </span>
              )}
            </span>
          </div>
          <div className="producto-admin-item__acciones" onClick={(evento) => evento.stopPropagation()}>
            <Interruptor activo={sabor.disponible} onCambiar={(valor) => onToggleDisponible(sabor.id, valor)} />
            <button type="button" className="carrito__quitar" onClick={() => onEliminar(sabor.id)}>
              Eliminar
            </button>
          </div>
        </li>
      ))}
    </ul>
  )
}
