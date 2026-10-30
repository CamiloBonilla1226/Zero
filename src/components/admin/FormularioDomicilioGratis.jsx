import { useState } from 'react'
import { VistaPrevia } from './FormularioOferta'
import { formatoPrecio, textoDomicilioGratis } from '../../lib/tiposOferta'
import { mensajeAmigablePostgres } from '../../lib/erroresAmigables'

// Única configuración de la oferta fija de domicilio gratis: la compra mínima. El texto de la
// tarjeta se arma solo con ese monto (ver textoDomicilioGratis).
export function FormularioDomicilioGratis({ oferta, onGuardar, onCancelar }) {
  const [monto, setMonto] = useState(String(oferta.configuracion?.monto_minimo ?? ''))
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)
  const montoValido = Number(monto) > 0

  const enviar = async (evento) => {
    evento.preventDefault()
    setGuardando(true)
    setError(null)
    const resultado = await onGuardar(monto)
    setGuardando(false)
    if (resultado && !resultado.exito) {
      setError(mensajeAmigablePostgres(resultado.error, 'No se pudo guardar el monto.'))
    }
  }

  return (
    <form className="checkout formulario-oferta" onSubmit={enviar} noValidate>
      <VistaPrevia oferta={montoValido ? textoDomicilioGratis(Number(monto)) : { titulo: 'Domicilio gratis' }} />

      <label className="campo">
        <span>Compra mínima para el domicilio gratis</span>
        <input
          type="number"
          inputMode="numeric"
          min="1"
          step="1"
          value={monto}
          onChange={(evento) => setMonto(evento.target.value)}
          placeholder="Ej. 70000"
          required
        />
      </label>

      <p className="texto-suave formulario-oferta__ayuda">
        Mientras esté activa, el carrito muestra una barra que se llena con el pedido
        {montoValido ? ` hasta ${formatoPrecio.format(Number(monto))}` : ''}. Al llegar, el mensaje de WhatsApp avisa que el
        pedido tiene domicilio gratis.
      </p>

      {error && <p className="campo__error">{error}</p>}

      <div className="opciones-producto__acciones">
        <button type="button" className="boton boton--secundario" onClick={onCancelar}>
          Cancelar
        </button>
        <button type="submit" className="boton" disabled={guardando || !montoValido}>
          {guardando ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </form>
  )
}
