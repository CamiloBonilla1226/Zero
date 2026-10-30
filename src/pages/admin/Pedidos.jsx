import { useState } from 'react'
import { AdminNav } from '../../components/admin/AdminNav'
import { EncabezadoPagina } from '../../components/admin/EncabezadoPagina'
import {
  FiltrosPedidos,
  aplicarFiltrosPedidos,
  FILTROS_PEDIDOS_INICIALES,
} from '../../components/admin/FiltrosPedidos'
import { TablaPedidos } from '../../components/admin/TablaPedidos'
import { usePedidos } from '../../hooks/usePedidos'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'

export function Pedidos() {
  const { pedidos, cargando, error, actualizarEstadoPedido } = usePedidos({ tiempoReal: true })
  const { nombre } = useAuth()
  const mostrarToast = useToast()
  const [filtros, setFiltros] = useState(FILTROS_PEDIDOS_INICIALES)
  // El "total" del contador son los pedidos de los últimos 30 días (lo máximo consultable),
  // no todos los de la base: así "14 de 26" no cuenta pedidos que esta pantalla nunca muestra.
  const pedidosConsultables = aplicarFiltrosPedidos(pedidos, FILTROS_PEDIDOS_INICIALES)
  const pedidosFiltrados = aplicarFiltrosPedidos(pedidos, filtros)

  const cambiarEstado = async (id, estado) => {
    const { exito } = await actualizarEstadoPedido(id, estado, nombre)
    mostrarToast(exito ? 'Estado del pedido actualizado' : 'No se pudo actualizar el estado', exito ? 'exito' : 'error')
  }

  return (
    <>
      <AdminNav />
      <main className="contenedor admin-pedidos">
        <EncabezadoPagina
          titulo="Pedidos"
          descripcion="Llegan en tiempo real. Cambia el estado de cada uno a medida que lo atiendes."
        />
        {cargando && <p className="texto-suave">Cargando pedidos…</p>}
        {error && <p className="campo__error">No se pudieron cargar los pedidos.</p>}
        {!cargando && !error && (
          <>
            <FiltrosPedidos
              filtros={filtros}
              onCambiar={setFiltros}
              total={pedidosConsultables.length}
              mostrados={pedidosFiltrados.length}
            />
            <TablaPedidos pedidos={pedidosFiltrados} onActualizarEstado={cambiarEstado} />
          </>
        )}
      </main>
    </>
  )
}
