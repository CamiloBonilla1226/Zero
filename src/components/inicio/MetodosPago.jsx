import { EncabezadoSeccion } from './EncabezadoSeccion'
import { mediosDisponibles } from '../../lib/mediosPago'

// Ícono de línea por método (esquinas rectas, mismo trazo que el resto de Inicio).
function Icono({ clave }) {
  const comun = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'square' }
  if (clave === 'efectivo') {
    return (
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
        <rect x="2.5" y="6" width="19" height="12" {...comun} />
        <circle cx="12" cy="12" r="2.6" {...comun} />
        <path d="M6 9.5v5M18 9.5v5" {...comun} />
      </svg>
    )
  }
  if (clave === 'bancolombia') {
    return (
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
        <path d="M3 9.5L12 4l9 5.5M4.5 20h15M6.5 11v6.5M10.5 11v6.5M13.5 11v6.5M17.5 11v6.5" {...comun} />
      </svg>
    )
  }
  if (clave === 'breb') {
    return (
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
        <path d="M13.5 3L6 13.5h5.5L10.5 21 18 10.5h-5.5z" {...comun} />
      </svg>
    )
  }
  // Nequi (y cualquier medio nuevo): celular.
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
      <rect x="6.5" y="2.5" width="11" height="19" {...comun} />
      <path d="M10.5 18.5h3" {...comun} />
    </svg>
  )
}

// "Métodos de pago" en Inicio: efectivo siempre (el checkout lo ofrece siempre) y, de las
// transferencias, solo los medios que el admin activó con número o llave en Admin → Negocio
// (los mismos que salen al pagar, ver mediosDisponibles). Los números no se muestran aquí:
// aparecen en el checkout, junto al total que hay que transferir. Mientras carga la
// configuración no se pinta nada, para no mostrar "solo efectivo" y luego saltar.
export function MetodosPago({ datosPago, cargando }) {
  if (cargando) return null

  const metodos = [
    { clave: 'efectivo', nombre: 'Efectivo', detalle: 'Pagas al recibir tu pedido' },
    ...mediosDisponibles(datosPago).map((medio) => ({
      clave: medio.clave,
      nombre: medio.nombre,
      detalle: 'Transferencia antes de enviar el pedido',
    })),
  ]

  return (
    <section className="inicio-seccion" aria-labelledby="titulo-metodos-pago">
      <EncabezadoSeccion id="titulo-metodos-pago" rotulo="Pagos" titulo="Métodos de pago" />
      <ul className="metodos-pago">
        {metodos.map((metodo) => (
          <li key={metodo.clave} className="metodos-pago__item">
            <span className="metodos-pago__icono">
              <Icono clave={metodo.clave} />
            </span>
            <span className="metodos-pago__textos">
              <strong>{metodo.nombre}</strong>
              <span>{metodo.detalle}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
