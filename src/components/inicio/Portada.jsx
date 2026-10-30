import { negocioConfig } from '../../config/negocio.config'
import { useAhora } from '../../hooks/useAhora'
import { detalleEstado } from '../../lib/horario'

// Primera pantalla de Inicio, armada como el letrero del local: el logo encendido, qué vende
// y si está atendiendo (con la hora de cierre o de la próxima apertura), y la frase grande con
// los dos tubos de neón debajo.
export function Portada({ lema, cargandoLema, horario }) {
  const ahora = useAhora()
  const detalle = detalleEstado(horario, ahora)

  return (
    <section className="portada" aria-labelledby="portada-lema">
      <div className="portada__logo">
        <img src="/logo.webp" alt={negocioConfig.nombre} width="800" height="800" fetchPriority="high" />
      </div>

      <div className="portada__ficha">
        {negocioConfig.rubro && <p className="portada__rubro">{negocioConfig.rubro}</p>}
        {detalle && (
          <p className={`portada__estado portada__estado--${detalle.estado}`}>
            <span className="portada__estado-letrero">{detalle.estado === 'abierto' ? 'Abierto' : 'Cerrado'}</span>
            <span>{detalle.texto}</span>
          </p>
        )}
      </div>

      <h1 id="portada-lema" className={`portada__lema${cargandoLema ? ' portada__lema--cargando' : ''}`}>
        {lema}
      </h1>

      <span className="portada__tubos" aria-hidden="true">
        <span />
        <span />
      </span>
    </section>
  )
}
