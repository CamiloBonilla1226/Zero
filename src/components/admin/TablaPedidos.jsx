import { textoSabores } from '../../lib/sabores'

const formatoPrecio = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

const formatoFecha = new Intl.DateTimeFormat('es-CO', {
  dateStyle: 'short',
  timeStyle: 'short',
})

// Estados libres: cualquier pedido puede pasar a cualquier otro estado (el selector
// permite "devolver" un pedido, ej. de "entregado" de vuelta a "en preparación" si se marcó
// por error) — ya no es una cadena fija de un solo sentido nuevo → en_preparacion → entregado.
const ESTADOS_PEDIDO = ['nuevo', 'aprobado', 'en_preparacion', 'entregado', 'rechazado']

const ETIQUETA_ESTADO = {
  nuevo: 'Nuevo',
  aprobado: 'Aprobado',
  en_preparacion: 'En preparación',
  entregado: 'Entregado',
  rechazado: 'Rechazado',
}

export function TablaPedidos({ pedidos, onActualizarEstado }) {
  if (pedidos.length === 0) {
    return <p className="texto-suave admin-vacio">No hay pedidos en este periodo.</p>
  }

  return (
    <ul className="lista-pedidos">
      {pedidos.map((pedido) => (
        <li key={pedido.id} className="tarjeta pedido-item">
          <div className="pedido-item__encabezado">
            <strong className="pedido-item__cliente" title={pedido.cliente_nombre}>
              {pedido.cliente_nombre}
            </strong>
            <span className={`pedido-item__estado pedido-item__estado--${pedido.estado}`}>
              {ETIQUETA_ESTADO[pedido.estado] ?? pedido.estado}
            </span>
          </div>
          <div className="pedido-item__meta texto-suave">
            <span>
              {formatoFecha.format(new Date(pedido.creado_en))} · {pedido.cliente_telefono}
            </span>
            {pedido.direccion && <span>{pedido.direccion}</span>}
            {pedido.atendido_por && <span>Atendido por {pedido.atendido_por}</span>}
          </div>

          <ul className="pedido-item__detalle">
            {pedido.productos_detalle.map((item, indice) => {
              const detalles = [
                item.variante_elegida,
                textoSabores(item.sabores_elegidos),
                ...(item.opciones_elegidas?.map((o) => o.nombre) ?? []),
              ].filter(Boolean)
              return (
                <li key={indice}>
                  {item.cantidad}x {item.nombre}
                  {detalles.length > 0 && ` (${detalles.join(', ')})`}
                </li>
              )
            })}
          </ul>

          <div className="pedido-item__pie">
            <strong>{formatoPrecio.format(pedido.total)}</strong>
            <label className="pedido-item__selector-estado">
              <span className="visualmente-oculto">Cambiar estado del pedido</span>
              <select value={pedido.estado} onChange={(evento) => onActualizarEstado(pedido.id, evento.target.value)}>
                {ESTADOS_PEDIDO.map((estado) => (
                  <option key={estado} value={estado}>
                    {ETIQUETA_ESTADO[estado]}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </li>
      ))}
    </ul>
  )
}
