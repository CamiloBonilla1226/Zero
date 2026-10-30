import { useEffect, useLayoutEffect } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useSwipeNavegacion } from '../../hooks/useSwipeNavegacion'
import { seccionesAdminVisibles } from '../../lib/seccionesAdmin'
import { useTemaAdmin } from '../../hooks/useTemaAdmin'
import { useAvisoPedidos } from '../../hooks/useAvisoPedidos'
import { negocioConfig } from '../../config/negocio.config'
import { AvisoPedido } from './AvisoPedido'

const TITULO_PANEL = `${negocioConfig.nombre} — Panel admin`

// Donde un swipe horizontal no debe cambiar de sección: modales y confirmaciones (ahí
// deslizar ya sirve para cerrarlos, ver useSwipeParaCerrar), el menú lateral abierto,
// campos de texto (arrastrar ahí selecciona o mueve el cursor) y controles con scroll
// horizontal propio (filtros segmentados). Tampoco en la barra de acciones masivas de
// Productos: cambiar de sección ahí perdería la selección por un roce del dedo.
const SELECTOR_IGNORAR_ADMIN = [
  '.superposicion',
  '.admin-drawer',
  '.admin-drawer__fondo',
  '.filtros-admin__segmentos',
  '.acciones-masivas',
  'input',
  'textarea',
  'select',
  '[contenteditable="true"]',
].join(', ')

// Marca el <body> con la clase `admin` mientras se está en el panel: el tema del admin
// (index.css, sección "Tema del panel admin") se aplica solo a `body.admin`, y va en el
// body y no en un div envolvente porque los modales y confirmaciones también deben verse
// con el tema del admin sin importar dónde se monten.
export function AdminLayout() {
  const auth = useAuth()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  // Tema claro/oscuro del panel: las páginas lo leen con useOutletContext (ver BotonTema.jsx).
  const temaAdmin = useTemaAdmin()
  // Aviso de pedido nuevo en cualquier sección (sonido + aviso visual). Solo con sesión válida
  // y permiso de Pedidos: sin ese permiso RLS no le deja ver los pedidos de todas formas.
  const avisoPedidos = useAvisoPedidos({
    activo: auth.cuentaValida && auth.puedePedidos,
    enPedidos: pathname === '/admin/pedidos',
  })
  const { sinVer } = avisoPedidos

  useEffect(() => {
    document.body.classList.add('admin')
    return () => document.body.classList.remove('admin')
  }, [])

  // Título de la pestaña con los pedidos nuevos sin ver: "(2) ZÉRO — Panel admin". Se
  // pone a cero al abrir Pedidos (useAvisoPedidos). Al salir del panel vuelve el de la carta.
  useEffect(() => {
    const anterior = document.title
    return () => {
      document.title = anterior
    }
  }, [])

  useEffect(() => {
    document.title = sinVer > 0 ? `(${sinVer}) ${TITULO_PANEL}` : TITULO_PANEL
  }, [sinVer])

  // Cada sección arranca desde arriba, venga del menú lateral o de un swipe.
  useLayoutEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  // Swipe de derecha a izquierda → siguiente sección del menú lateral; de izquierda a
  // derecha → la anterior. Solo entre las secciones que este usuario puede ver, y sin dar
  // la vuelta en los extremos. En /admin/login no hay sección actual y no hace nada.
  const irARelativa = (paso) => {
    if (!auth.autenticado) return
    const secciones = seccionesAdminVisibles(auth)
    const actual = secciones.findIndex((seccion) => seccion.ruta === pathname)
    const destino = secciones[actual + paso]
    if (actual === -1 || !destino) return
    navigate(destino.ruta)
  }

  const swipe = useSwipeNavegacion({
    onSwipeIzquierda: () => irARelativa(1),
    onSwipeDerecha: () => irARelativa(-1),
    selectorIgnorar: SELECTOR_IGNORAR_ADMIN,
  })

  return (
    <div className="admin-zona-swipe" onTouchStart={swipe.onTouchStart} onTouchEnd={swipe.onTouchEnd}>
      <Outlet context={{ ...temaAdmin, avisoPedidos }} />
      <AvisoPedido aviso={avisoPedidos.aviso} onCerrar={avisoPedidos.cerrarAviso} />
    </div>
  )
}
