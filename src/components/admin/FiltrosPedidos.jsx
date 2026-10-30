import { FiltrosAdmin, GrupoFiltro } from './FiltrosAdmin'

// Los pedidos se pueden consultar como máximo 30 días hacia atrás: el periodo más largo
// disponible es "30 días", así que nunca se listan pedidos más antiguos.
export const DIAS_MAXIMOS = 30
const MS_DIA = 24 * 60 * 60 * 1000

// Fecha local en formato YYYY-MM-DD, sin pasar por UTC (el día del pedido es el del negocio).
function aTexto(fecha) {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const dia = String(fecha.getDate()).padStart(2, '0')
  return `${fecha.getFullYear()}-${mes}-${dia}`
}

function haceDias(dias) {
  return aTexto(new Date(Date.now() - dias * MS_DIA))
}

export const FILTROS_PEDIDOS_INICIALES = { periodo: '30', estado: 'todos' }

// Rango [desde, hasta] de cada periodo, en fechas locales YYYY-MM-DD.
const RANGOS = {
  hoy: () => [haceDias(0), haceDias(0)],
  ayer: () => [haceDias(1), haceDias(1)],
  7: () => [haceDias(6), haceDias(0)],
  30: () => [haceDias(DIAS_MAXIMOS), haceDias(0)],
}

export function aplicarFiltrosPedidos(pedidos, filtros) {
  const [desde, hasta] = (RANGOS[filtros.periodo] ?? RANGOS[30])()

  return pedidos.filter((pedido) => {
    const dia = aTexto(new Date(pedido.creado_en))
    if (dia < desde || dia > hasta) return false
    if (filtros.estado !== 'todos' && pedido.estado !== filtros.estado) return false
    return true
  })
}

export function FiltrosPedidos({ filtros, onCambiar, total, mostrados }) {
  const cambiar = (clave) => (valor) => onCambiar({ ...filtros, [clave]: valor })
  const activos = Object.keys(FILTROS_PEDIDOS_INICIALES).filter(
    (clave) => filtros[clave] !== FILTROS_PEDIDOS_INICIALES[clave]
  ).length

  return (
    <FiltrosAdmin
      total={total}
      mostrados={mostrados}
      activos={activos}
      onLimpiar={() => onCambiar(FILTROS_PEDIDOS_INICIALES)}
    >
      <GrupoFiltro
        titulo="Periodo"
        valor={filtros.periodo}
        onCambiar={cambiar('periodo')}
        opciones={[
          { valor: 'hoy', texto: 'Hoy' },
          { valor: 'ayer', texto: 'Ayer' },
          { valor: '7', texto: '7 días' },
          { valor: '30', texto: '30 días' },
        ]}
      />
      <GrupoFiltro
        titulo="Estado"
        valor={filtros.estado}
        onCambiar={cambiar('estado')}
        opciones={[
          { valor: 'todos', texto: 'Todos' },
          { valor: 'nuevo', texto: 'Nuevo' },
          { valor: 'aprobado', texto: 'Aprobado' },
          { valor: 'en_preparacion', texto: 'En preparación' },
          { valor: 'entregado', texto: 'Entregado' },
          { valor: 'rechazado', texto: 'Rechazado' },
        ]}
      />
    </FiltrosAdmin>
  )
}
