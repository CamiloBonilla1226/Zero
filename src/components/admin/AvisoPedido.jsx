import { useNavigate } from 'react-router-dom'

const formatoPrecio = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

// Aviso de pedido nuevo (ver useAvisoPedidos): arriba de la pantalla, en cualquier sección
// del panel. Dura unos 10 segundos o hasta que se toque. La barra del pie muestra cuánto
// le queda; la `key` del pedido la reinicia cuando llega otro.
export function AvisoPedido({ aviso, onCerrar }) {
  const navigate = useNavigate()
  if (!aviso) return null

  const { pedido, extras } = aviso
  const verPedido = () => {
    onCerrar()
    navigate('/admin/pedidos')
  }

  return (
    <div className="aviso-pedido" role="alert" key={pedido.id}>
      <div className="aviso-pedido__cuerpo">
        <span className="aviso-pedido__rotulo">
          Pedido nuevo{extras > 0 && <span className="aviso-pedido__extras"> · y {extras} más</span>}
        </span>
        <strong className="aviso-pedido__cliente">{pedido.cliente_nombre || 'Cliente'}</strong>
        {pedido.total != null && <span className="aviso-pedido__total">{formatoPrecio.format(pedido.total)}</span>}
      </div>
      <div className="aviso-pedido__acciones">
        <button type="button" className="aviso-pedido__ver" onClick={verPedido}>
          Ver pedido
        </button>
        <button type="button" className="aviso-pedido__cerrar" onClick={onCerrar} aria-label="Cerrar aviso">
          ×
        </button>
      </div>
      <span className="aviso-pedido__tiempo" aria-hidden="true" />
    </div>
  )
}
