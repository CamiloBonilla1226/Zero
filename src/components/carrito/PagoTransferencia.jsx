import { useEffect, useState } from 'react'
import { valorParaCopiar } from '../../lib/mediosPago'
import { formatoPrecio } from '../../lib/tiposOferta'

// Lo que ve el cliente al elegir "Transferencia": una pestaña por medio activo, los datos para
// transferir (el número, celular o llave en grande y con botón de copiar), el QR si el negocio
// lo subió y el campo del comprobante. El comprobante solo se elige aquí; lo sube Checkout al enviar.
// `vistaPrevia`: URL temporal (createObjectURL) del comprobante elegido; la maneja Checkout para
// que no se pierda si el cliente cambia a efectivo y vuelve.
export function PagoTransferencia({ medios, medioClave, onCambiarMedio, total, vistaPrevia, onCambiarComprobante, error }) {
  const medio = medios.find((m) => m.clave === medioClave) ?? medios[0]

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

        <DatoCopiable
          key={medio.clave}
          etiqueta={
            medio.conTipoCuenta
              ? `Cuenta de ${medio.datos.tipo_cuenta?.toLowerCase() ?? 'ahorros'} ${medio.nombre}`
              : `${medio.etiquetaNumero} ${medio.clave === 'nequi' ? medio.nombre : ''}`.trim()
          }
          valor={medio.datos.numero.trim()}
          valorCopia={valorParaCopiar(medio, medio.datos.numero)}
        />
        {medio.datos.titular?.trim() && (
          <p className="pago-transferencia__titular">
            <span>Titular</span>
            {medio.datos.titular.trim()}
          </p>
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

// Copia con la API del portapapeles y, si no está (navegador viejo, http o sin permiso), con
// el método clásico de seleccionar un textarea oculto, que funciona en casi todos los celulares.
async function copiarAlPortapapeles(texto) {
  try {
    await navigator.clipboard.writeText(texto)
    return true
  } catch {
    const area = document.createElement('textarea')
    area.value = texto
    area.setAttribute('readonly', '')
    area.style.position = 'fixed'
    area.style.opacity = '0'
    document.body.appendChild(area)
    area.select()
    area.setSelectionRange(0, texto.length)
    let copiado = false
    try {
      copiado = document.execCommand('copy')
    } catch {
      copiado = false
    }
    document.body.removeChild(area)
    return copiado
  }
}

// Todo el recuadro es el botón: se toca en cualquier parte y copia. `valor` es lo que se ve
// (como lo escribió el negocio) y `valorCopia` lo que va al portapapeles (ver valorParaCopiar).
function DatoCopiable({ etiqueta, valor, valorCopia }) {
  const [estado, setEstado] = useState(null)

  useEffect(() => {
    if (!estado) return undefined
    const temporizador = setTimeout(() => setEstado(null), 2500)
    return () => clearTimeout(temporizador)
  }, [estado])

  const copiar = async () => {
    setEstado((await copiarAlPortapapeles(valorCopia)) ? 'copiado' : 'error')
  }

  return (
    <button
      type="button"
      className={`pago-transferencia__dato${estado === 'copiado' ? ' pago-transferencia__dato--copiado' : ''}`}
      onClick={copiar}
      aria-label={`Copiar ${etiqueta}: ${valor}`}
    >
      <span className="pago-transferencia__dato-texto">
        <span>{etiqueta}</span>
        <strong>{valor}</strong>
      </span>
      <span className="pago-transferencia__copiar" aria-live="polite">
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
          {estado === 'copiado' ? (
            <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="square" />
          ) : (
            <g fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="8" y="8" width="12" height="12" />
              <path d="M16 8V4H4v12h4" />
            </g>
          )}
        </svg>
        {estado === 'copiado' ? 'Copiado' : estado === 'error' ? 'Cópialo a mano' : 'Copiar'}
      </span>
    </button>
  )
}
