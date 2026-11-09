import { useEffect, useState } from 'react'
import { descargarQr, valorParaCopiar } from '../../lib/mediosPago'
import { formatoPrecio } from '../../lib/tiposOferta'

// Lo que ve el cliente al elegir "Transferencia": una pestaña por medio activo, los datos para
// transferir (el número, celular o llave en grande y con botón de copiar), el QR si el negocio
// lo subió (con botón de descarga) y el aviso de adjuntar el comprobante en WhatsApp. El
// comprobante NO se sube a la plataforma: el cliente lo adjunta en el chat.
export function PagoTransferencia({ medios, medioClave, onCambiarMedio, total }) {
  const medio = medios.find((m) => m.clave === medioClave) ?? medios[0]

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
            <figcaption>Escanéalo desde la app de tu banco o descárgalo si pagas desde este celular.</figcaption>
            <BotonDescargarQr key={medio.clave} qrUrl={medio.datos.qr_url} nombreMedio={medio.nombre} />
          </figure>
        )}
      </div>

      <p className="pago-transferencia__aviso">
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
          <g fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="4" y="3" width="16" height="18" />
            <path d="M8 8h8M8 12h8M8 16h5" />
          </g>
        </svg>
        <span>
          <strong>Guarda la captura del comprobante</strong>
          Al enviar el pedido se abre WhatsApp: adjunta ahí la captura del comprobante.
        </span>
      </p>
    </div>
  )
}

function BotonDescargarQr({ qrUrl, nombreMedio }) {
  const [estado, setEstado] = useState(null)

  useEffect(() => {
    if (estado !== 'listo') return undefined
    const temporizador = setTimeout(() => setEstado(null), 2500)
    return () => clearTimeout(temporizador)
  }, [estado])

  const descargar = async () => {
    setEstado('descargando')
    const resultado = await descargarQr(qrUrl, nombreMedio)
    setEstado(resultado === 'cancelado' ? null : 'listo')
  }

  return (
    <button
      type="button"
      className="boton boton--secundario pago-transferencia__descargar-qr"
      onClick={descargar}
      disabled={estado === 'descargando'}
    >
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
        <path d="M12 4v11m0 0l-4.5-4.5M12 15l4.5-4.5M5 19h14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
      </svg>
      {estado === 'descargando' ? 'Preparando…' : estado === 'listo' ? 'QR listo' : 'Descargar QR'}
    </button>
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
