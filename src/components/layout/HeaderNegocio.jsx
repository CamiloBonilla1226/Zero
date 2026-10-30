import { negocioConfig } from '../../config/negocio.config'
import { useNegocioConfig } from '../../hooks/useNegocioConfig'
import { useAhora } from '../../hooks/useAhora'
import { calcularEstadoAbierto } from '../../lib/horario'

// Header fijo de la carta de domicilios: logo y nombre del negocio + estado Abierto/Cerrado.
// El estado se recalcula cada minuto (useAhora). Sin horario configurado (o mientras carga)
// no se muestra el indicador; tampoco con `mostrarEstado` en false (Inicio, donde lo muestra
// la portada).
export function HeaderNegocio({ mostrarEstado = true }) {
  const { config } = useNegocioConfig()
  const ahora = useAhora()

  const estado = calcularEstadoAbierto(config?.horario, ahora)

  return (
    <header className="header-negocio">
      <div className="contenedor header-negocio__contenido">
        <span className="header-negocio__marca">
          <img src="/logo.webp" alt="" className="header-negocio__logo" width="32" height="32" />
          {negocioConfig.nombre}
        </span>
        {mostrarEstado && estado && (
          <span className={`estado-negocio estado-negocio--${estado}`}>
            {estado === 'abierto' && <span className="estado-negocio__punto" aria-hidden="true" />}
            {estado === 'abierto' ? 'Abierto' : 'Cerrado'}
          </span>
        )}
      </div>
    </header>
  )
}
