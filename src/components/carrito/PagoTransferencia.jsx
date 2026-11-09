import { useEffect, useState } from 'react'
import { enlaceSeguro } from '../../lib/mediosPago'
import { formatoPrecio } from '../../lib/tiposOferta'

// Lo que ve el cliente al elegir "Transferencia": una pestaña por medio activo, los datos para
// transferir (con botón de copiar), el QR, el botón al enlace directo y el campo del
// comprobante. El comprobante solo se elige aquí; lo sube Checkout al enviar.
// `vistaPrevia`: URL temporal (createObjectURL) del comprobante elegido; la maneja Checkout para
// que no se pierda si el cliente cambia a efectivo y vuelve.
export function PagoTransferencia({ medios, medioClave, onCambiarMedio, total, vistaPrevia, onCambiarComprobante, error }) {
  const medio = medios.find((m) => m.clave === medioClave) ?? medios[0]
  const enlace = enlaceSeguro(medio.datos.enlace)

  const elegirArchivo = (evento) => {
    const archivo = evento.target.files?.[0]
    evento.target.value = ''
    if (archivo) onCambiarComprobante(archivo)
  }

  return (
    <div className="pago-transferencia">
      {medios.length > 1 && (
        <div className="pago-transferencia__medios" role="tablist" aria-label="Medio de transferencia">
          {medios.map((m) => (
            <button
              key={m.clave}
              type="button"
              role="tab"
              aria-selected={m.clave === medio.clave}
              className={`pago-transferencia__medio${m.clave === medio.clave ? ' pago-transferencia__medio--activo' : ''}`}
              onClick={() => onCambiarMedio(m.clave)}
            >
              {m.nombre}
            </button>
          ))}
        </div>
      )}

      <div className="pago-transferencia__datos">
        <p className="pago-transferencia__monto">
          Transfiere <strong>{formatoPrecio.format(total).replace(/\s/g, '')}</strong> a {medio.nombre}
        </p>

        {medio.datos.numero?.trim() && (
          <DatoCopiable
            etiqueta={medio.conTipoCuenta ? `Cuenta ${medio.datos.tipo_cuenta?.toLowerCase() ?? ''}`.trim() : medio.etiquetaNumero}
            valor={medio.datos.numero.trim()}
          />
        )}
        {medio.datos.titular?.trim() && (
          <p className="pago-transferencia__titular">
            <span>Titular</span>
            {medio.datos.titular.trim()}
          </p>
        )}

        {enlace && (
          <a className="boton pago-transferencia__enlace" href={enlace} target="_blank" rel="noopener noreferrer">
            Pagar con {medio.nombre}
          </a>
        )}

        {medio.datos.qr_url && (
          <figure className="pago-transferencia__qr">
            <img src={medio.datos.qr_url} alt={`Código QR para pagar con ${medio.nombre}`} loading="lazy" />
            <figcaption>
              Escanéalo desde la app de tu banco.{' '}
              <a href={medio.datos.qr_url} target="_blank" rel="noopener noreferrer">
                Abrir imagen
              </a>{' '}
              para guardarla si pagas desde este celular.
            </figcaption>
          </figure>
        )}
      </div>

      <div className="campo pago-transferencia__comprobante">
        <span>Comprobante de pago</span>
        {vistaPrevia ? (
          <div className="pago-transferencia__vista">
            <img src={vistaPrevia} alt="Comprobante elegido" />
            <label className="boton boton--secundario boton--pequeno">
              Cambiar
              <input type="file" accept="image/*" hidden onChange={elegirArchivo} />
            </label>
          </div>
        ) : (
          <label className="pago-transferencia__subir">
            <strong>Subir captura del comprobante</strong>
            <small>Cuando hayas transferido, sube la captura de pantalla o foto del pago.</small>
            <input type="file" accept="image/*" hidden onChange={elegirArchivo} />
          </label>
        )}
        {error && <span className="campo__error">{error}</span>}
      </div>
    </div>
  )
}

function DatoCopiable({ etiqueta, valor }) {
  const [copiado, setCopiado] = useState(false)

  useEffect(() => {
    if (!copiado) return undefined
    const temporizador = setTimeout(() => setCopiado(false), 2000)
    return () => clearTimeout(temporizador)
  }, [copiado])

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(valor)
      setCopiado(true)
    } catch {
      // Sin permiso de portapapeles (navegador viejo o http): el dato queda visible igual.
    }
  }

  return (
    <div className="pago-transferencia__dato">
      <div>
        <span>{etiqueta}</span>
        <strong>{valor}</strong>
      </div>
      <button type="button" className="boton boton--secundario boton--pequeno" onClick={copiar} aria-live="polite">
        {copiado ? 'Copiado' : 'Copiar'}
      </button>
    </div>
  )
}
