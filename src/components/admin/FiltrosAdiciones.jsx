import { FiltrosAdmin, GrupoFiltro } from './FiltrosAdmin'

export const FILTROS_ADICIONES_INICIALES = {
  estado: 'todas',
  carta: 'todas',
  orden: 'nombre',
}

export function aplicarFiltrosAdiciones(adiciones, filtros) {
  const filtradas = adiciones.filter((adicion) => {
    if (filtros.estado === 'disponibles' && !adicion.disponible) return false
    if (filtros.estado === 'no-disponibles' && adicion.disponible) return false
    if (filtros.carta === 'domicilios' && !adicion.visible_domicilios) return false
    if (filtros.carta === 'fisica' && !adicion.visible_carta_fisica) return false
    return true
  })

  if (filtros.orden === 'mayor-precio') return [...filtradas].sort((a, b) => b.precio - a.precio)
  if (filtros.orden === 'menor-precio') return [...filtradas].sort((a, b) => a.precio - b.precio)
  return filtradas
}

export function FiltrosAdiciones({ filtros, onCambiar, total, mostrados }) {
  const cambiar = (clave) => (valor) => onCambiar({ ...filtros, [clave]: valor })
  const activos = Object.keys(FILTROS_ADICIONES_INICIALES).filter(
    (clave) => filtros[clave] !== FILTROS_ADICIONES_INICIALES[clave]
  ).length

  return (
    <FiltrosAdmin
      total={total}
      mostrados={mostrados}
      activos={activos}
      onLimpiar={() => onCambiar(FILTROS_ADICIONES_INICIALES)}
    >
      <GrupoFiltro
        titulo="Estado"
        valor={filtros.estado}
        onCambiar={cambiar('estado')}
        opciones={[
          { valor: 'todas', texto: 'Todas' },
          { valor: 'disponibles', texto: 'Disponibles' },
          { valor: 'no-disponibles', texto: 'No disponibles' },
        ]}
      />
      <GrupoFiltro
        titulo="Carta"
        valor={filtros.carta}
        onCambiar={cambiar('carta')}
        opciones={[
          { valor: 'todas', texto: 'Todas' },
          { valor: 'domicilios', texto: 'Domicilios' },
          { valor: 'fisica', texto: 'Carta física' },
        ]}
      />
      <GrupoFiltro
        titulo="Ordenar"
        valor={filtros.orden}
        onCambiar={cambiar('orden')}
        opciones={[
          { valor: 'nombre', texto: 'Nombre' },
          { valor: 'mayor-precio', texto: 'Mayor precio' },
          { valor: 'menor-precio', texto: 'Menor precio' },
        ]}
      />
    </FiltrosAdmin>
  )
}
