import { useState } from 'react'
import { Interruptor } from './Interruptor'
import { MEDIOS_PAGO, TIPOS_CUENTA } from '../../lib/mediosPago'
import { subirImagenQr } from '../../lib/storage'
import { negocioConfig } from '../../config/negocio.config'

// Un bloque por medio de transferencia (Nequi, Bancolombia, Bre-B). Lo que se llena aquí es
// lo que ve el cliente en el checkout al elegir "Transferencia"; un medio apagado no aparece.
// El estado vive en FormularioNegocio y se guarda con el resto en negocio_config.datos_pago.
export function ConfiguracionPagos({ datosPago, onCambiar }) {
  return (
    <section className="tarjeta negocio-seccion">
      <header className="negocio-seccion__encabezado">
        <h2>Pagos por transferencia</h2>
        <p>
          Activa los medios que aceptas. El cliente verá el número o la llave con un botón para copiarlo (y el QR si
          lo subes), y tendrá que subir el comprobante antes de enviar el pedido.
        </p>
      </header>
      {MEDIOS_PAGO.map((medio) => (
        <MedioPago
          key={medio.clave}
          medio={medio}
          datos={datosPago[medio.clave]}
          onCambiar={(campo, valor) =>
            onCambiar({ ...datosPago, [medio.clave]: { ...datosPago[medio.clave], [campo]: valor } })
          }
        />
      ))}
    </section>
  )
}

function MedioPago({ medio, datos, onCambiar }) {
  const [subiendo, setSubiendo] = useState(false)
  const [errorQr, setErrorQr] = useState(null)

  const subirQr = async (evento) => {
    const archivo = evento.target.files?.[0]
    evento.target.value = ''
    if (!archivo) return
    setSubiendo(true)
    setErrorQr(null)
    const { url, error } = await subirImagenQr(negocioConfig.negocioId, archivo)
    setSubiendo(false)
    if (error) {
      setErrorQr('No se pudo subir el QR. Intenta de nuevo.')
      console.error(error)
      return
    }
    onCambiar('qr_url', url)
  }

  return (
    <div className={`medio-pago-admin${datos.activo ? ' medio-pago-admin--activo' : ''}`}>
      <div className="medio-pago-admin__encabezado">
        <strong>{medio.nombre}</strong>
        <Interruptor activo={datos.activo} etiqueta={datos.activo ? 'Activo' : 'Apagado'} onCambiar={(v) => onCambiar('activo', v)} />
      </div>

      {datos.activo && (
        <div className="medio-pago-admin__campos">
          {medio.conTipoCuenta && (
            <label className="campo">
              <span>Tipo de cuenta</span>
              <select value={datos.tipo_cuenta} onChange={(e) => onCambiar('tipo_cuenta', e.target.value)}>
                {TIPOS_CUENTA.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {tipo}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="campo">
            <span>{medio.etiquetaNumero}</span>
            <input
              type="text"
              value={datos.numero}
              onChange={(e) => onCambiar('numero', e.target.value)}
              maxLength={60}
              placeholder={medio.placeholderNumero}
            />
          </label>
          <label className="campo">
            <span>Titular</span>
            <input
              type="text"
              value={datos.titular}
              onChange={(e) => onCambiar('titular', e.target.value)}
              maxLength={80}
              placeholder="Nombre que ve el cliente al transferir"
            />
          </label>
          <div className="campo">
            <span>Código QR (opcional)</span>
            {datos.qr_url && <img className="medio-pago-admin__qr" src={datos.qr_url} alt={`QR de ${medio.nombre}`} />}
            <div className="medio-pago-admin__acciones-qr">
              <label className="boton boton--secundario boton--pequeno campo-imagen__subir">
                {subiendo ? 'Subiendo…' : datos.qr_url ? 'Cambiar QR' : 'Subir QR'}
                <input type="file" accept="image/*" hidden onChange={subirQr} disabled={subiendo} />
              </label>
              {datos.qr_url && (
                <button type="button" className="boton boton--secundario boton--pequeno" onClick={() => onCambiar('qr_url', '')}>
                  Quitar
                </button>
              )}
            </div>
            {errorQr && <span className="campo__error">{errorQr}</span>}
          </div>
        </div>
      )}
    </div>
  )
}
