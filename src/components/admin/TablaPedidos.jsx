import { useState } from 'react'
import { textoSabores } from '../../lib/sabores'
import { urlComprobantePago } from '../../lib/storage'
import { Interruptor } from './Interruptor'

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

// Método de pago del pedido (null en los anteriores a la sección 24: no se muestra nada).
function PagoPedido({ pedido, onMarcarPagoVerificado }) {
  const [abriendo, setAbriendo] = useState(false)
  const [error, setError] = useState(null)

  if (!pedido.metodo_pago) return null
  if (pedido.metodo_pago === 'efectivo') {
    return (
      <div className="pedido-item__pago">
        <span className="pedido-item__metodo">Efectivo</span>
      </div>
    )
  }

  // El bucket es privado: se pide un enlace firmado de 5 minutos. La pestaña se abre antes
  // del await porque Safari bloquea un window.open que no sale directo del toque.
  const verComprobante = async () => {
    setError(null)
    setAbriendo(true)
    const pestana = window.open('', '_blank')
    const { url, error: errorUrl } = await urlComprobantePago(pedido.comprobante_path)
    setAbriendo(false)
    if (errorUrl || !url) {
      pestana?.close()
      setError('No se pudo abrir el comprobante.')
      console.error(errorUrl)
      return
    }
    if (pestana) {
      pestana.opener = null
      pestana.location.href = url
    } else {
      window.location.href = url
    }
  }

  return (
    <div className="pedido-item__pago">
      <span className={`pedido-item__metodo${pedido.pago_verificado ? ' pedido-item__metodo--verificado' : ' pedido-item__metodo--pendiente'}`}>
        Transferencia · {pedido.pago_verificado ? 'Verificada' : 'Por verificar'}
      </span>
      {pedido.comprobante_path && (
        <button type="button" className="boton boton--secundario boton--pequeno" onClick={verComprobante} disabled={abriendo}>
          {abriendo ? 'Abriendo…' : 'Ver comprobante'}
        </button>
      )}
      <Interruptor
        activo={pedido.pago_verificado}
        etiqueta="Pago verificado"
        onCambiar={(valor) => onMarcarPagoVerificado(pedido.id, valor)}
      />
      {error && <span className="campo__error">{error}</span>}
    </div>
  )
}

export function TablaPedidos({ pedidos, onActualizarEstado, onMarcarPagoVerificado }) {
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

          <PagoPedido pedido={pedido} onMarcarPagoVerificado={onMarcarPagoVerificado} />

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
