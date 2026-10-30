import { Link } from 'react-router-dom'
import { aplicarFiltrosPedidos, FILTROS_PEDIDOS_INICIALES } from '../../components/admin/FiltrosPedidos'
import { AdminNav } from '../../components/admin/AdminNav'
import { AsistenteNegocio } from '../../components/admin/AsistenteNegocio'
import { Notificaciones } from '../../components/admin/Notificaciones'
import { useAuth } from '../../hooks/useAuth'
import { usePedidos } from '../../hooks/usePedidos'
import { useProductos } from '../../hooks/useProductos'
import { useUsuariosAdmin } from '../../hooks/useUsuariosAdmin'
import { negocioConfig } from '../../config/negocio.config'

// Si recibe `a`, toda la tarjeta es un enlace a esa sección del panel; sin `a` (el usuario
// no tiene permiso para esa sección) se muestra igual, pero sin ser clicable.
function Metrica({ titulo, valor, detalle, cargando, a }) {
  const contenido = (
    <>
      <span className="texto-suave">{titulo}</span>
      <strong>{cargando ? '—' : valor}</strong>
      {detalle && <span className="admin-dashboard__detalle">{cargando ? ' ' : detalle}</span>}
    </>
  )

  if (!a) return <div className="tarjeta admin-dashboard__metrica">{contenido}</div>

  return (
    <Link to={a} className="tarjeta admin-dashboard__metrica admin-dashboard__metrica--enlace">
      {contenido}
      <span className="admin-dashboard__flecha" aria-hidden="true">
        →
      </span>
    </Link>
  )
}

export function Dashboard() {
  const { puedeProductos, puedePedidos } = useAuth()
  const { pedidos, cargando: cargandoPedidos } = usePedidos()
  const { productos, cargando: cargandoProductos } = useProductos()
  const { usuarios, cargando: cargandoUsuarios } = useUsuariosAdmin()

  // Mismo criterio que la pantalla Pedidos (últimos 30 días), para que el número de aquí
  // coincida con los pedidos que se pueden listar allá.
  const pedidosRecientes = aplicarFiltrosPedidos(pedidos, FILTROS_PEDIDOS_INICIALES)
  const pedidosNuevos = pedidosRecientes.filter((p) => p.estado === 'nuevo').length
  const productosActivos = productos.filter((p) => p.disponible).length
  const dueno = usuarios.find((u) => u.rol === 'dueño')

  return (
    <>
      <AdminNav />
      <main className="contenedor admin-dashboard">
        <section className="tarjeta admin-dashboard__negocio">
          <span className="admin-dashboard__etiqueta">Negocio</span>
          <h1>{negocioConfig.nombre}</h1>
          <div className="admin-dashboard__dueno">
            <span className="texto-suave">Dueño</span>
            <strong>{cargandoUsuarios ? '—' : (dueno?.nombre ?? 'Sin registrar')}</strong>
          </div>
        </section>

        <div className="admin-dashboard__metricas">
          {puedePedidos && (
            <Metrica
              titulo="Pedidos"
              a="/admin/pedidos"
              valor={pedidosRecientes.length}
              detalle={`${pedidosNuevos} nuevos · últimos 30 días`}
              cargando={cargandoPedidos}
            />
          )}
          <Metrica
            titulo="Productos"
            a={puedeProductos ? '/admin/productos' : undefined}
            valor={productos.length}
            detalle={`${productosActivos} activos`}
            cargando={cargandoProductos}
          />
        </div>

        {/* Avisos push de pedidos nuevos en este dispositivo: solo para quien ve Pedidos. */}
        {puedePedidos && <Notificaciones />}

        {/* Las ventas y recomendaciones salen de los pedidos: solo con ese permiso. */}
        {puedePedidos && (
          <AsistenteNegocio pedidos={pedidos} productos={productos} cargando={cargandoPedidos || cargandoProductos} />
        )}
      </main>
    </>
  )
}
