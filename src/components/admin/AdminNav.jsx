import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { CONSULTA_ESCRITORIO, useMediaQuery } from '../../hooks/useMediaQuery'
import { negocioConfig } from '../../config/negocio.config'
import { seccionesAdminVisibles } from '../../lib/seccionesAdmin'
import { BotonTema } from './BotonTema'
import { BotonSonido } from './BotonSonido'

// Ícono de línea por sección (mismo trazo en el menú del celular y en la barra lateral).
const ICONOS_SECCION = {
  '/admin': <path d="M4 11.5 12 5l8 6.5M6.5 10v9h11v-9" />,
  '/admin/pedidos': <path d="M6 3.5h12v17l-3-2-3 2-3-2-3 2zM9 8.5h6M9 12h6M9 15.5h3" />,
  '/admin/productos': <path d="M6 7h12l-1.4 13H7.4zM9 7V5.5a3 3 0 0 1 6 0V7" />,
  '/admin/categorias': <path d="M4.5 4.5h6v6h-6zM13.5 4.5h6v6h-6zM4.5 13.5h6v6h-6zM13.5 13.5h6v6h-6z" />,
  '/admin/adiciones': <path d="M12 4.5v15M4.5 12h15" />,
  '/admin/sabores': <path d="M12 3.5c3.2 3.8 6 7.3 6 10.5a6 6 0 0 1-12 0c0-3.2 2.8-6.7 6-10.5zM9.3 14.3a2.8 2.8 0 0 0 2.7 2.7" />,
  '/admin/ofertas': <path d="M3.5 12.5V4h8.5l8.5 8.5-8 8zM8 8.5h.01" />,
  '/admin/usuarios': <path d="M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM3 20c.6-3.4 3-5 6-5s5.4 1.6 6 5M16 4.6a3.5 3.5 0 0 1 0 6.3M18 15.3c1.6.7 2.7 2.2 3 4.7" />,
  '/admin/negocio': <path d="M4 9.5 5.5 4h13L20 9.5M4 9.5h16M4 9.5c0 1.7 1.3 2.5 2.7 2.5S9.3 11.2 9.3 9.5c0 1.7 1.3 2.5 2.7 2.5s2.7-.8 2.7-2.5c0 1.7 1.3 2.5 2.6 2.5S20 11.2 20 9.5M5.5 12v8h13v-8M10 20v-5h4v5" />,
}

function IconoSeccion({ ruta }) {
  return (
    <svg
      className="admin-drawer__icono"
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICONOS_SECCION[ruta]}
    </svg>
  )
}

// En el celular, la navegación vive en un panel lateral (drawer) detrás de la hamburguesa.
// Desde 1024px el mismo panel queda fijo a la izquierda como barra lateral, siempre visible,
// y la hamburguesa desaparece.
export function AdminNav() {
  const auth = useAuth()
  const { cerrarSesion } = auth
  const escritorio = useMediaQuery(CONSULTA_ESCRITORIO)
  const [abierto, setAbierto] = useState(false)
  const secciones = seccionesAdminVisibles(auth)
  // En computador el panel no "se abre": siempre está. Solo en celular bloquea el fondo.
  const panelAbierto = abierto && !escritorio

  // Cierra el panel con Escape, y evita el scroll del fondo mientras está abierto: son
  // dos detalles esperables de cualquier panel lateral moderno (drawer) y evitan que el
  // usuario quede "atrapado" con el fondo scrolleando detrás del panel.
  useEffect(() => {
    if (!panelAbierto) return

    const alPresionarTecla = (evento) => {
      if (evento.key === 'Escape') setAbierto(false)
    }
    document.addEventListener('keydown', alPresionarTecla)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', alPresionarTecla)
      document.body.style.overflow = ''
    }
  }, [panelAbierto])

  const cerrar = () => setAbierto(false)

  const claseEnlace = ({ isActive }) => `admin-drawer__enlace${isActive ? ' admin-drawer__enlace--activo' : ''}`

  return (
    <>
      <header className="admin-header">
        <button
          type="button"
          className={`admin-header__hamburguesa${panelAbierto ? ' admin-header__hamburguesa--abierta' : ''}`}
          onClick={() => setAbierto(true)}
          aria-label="Abrir menú"
          aria-expanded={panelAbierto}
        >
          <span />
          <span />
          <span />
        </button>
        <span className="admin-header__titulo">Administrador</span>
        {auth.puedePedidos && <BotonSonido />}
        <BotonTema />
      </header>

      {panelAbierto && <div className="admin-drawer__fondo" onClick={cerrar} />}

      <nav
        className={`admin-drawer${panelAbierto ? ' admin-drawer--abierto' : ''}`}
        aria-label="Secciones del panel"
        aria-hidden={!escritorio && !abierto}
      >
        <div className="admin-drawer__encabezado">
          <span className="admin-drawer__negocio">{negocioConfig.nombre}</span>
          <button type="button" className="admin-drawer__cerrar" onClick={cerrar} aria-label="Cerrar menú">
            ×
          </button>
        </div>

        <div className="admin-drawer__enlaces">
          {secciones.map(({ ruta, etiqueta }) => (
            <NavLink key={ruta} to={ruta} end={ruta === '/admin'} className={claseEnlace} onClick={cerrar}>
              <IconoSeccion ruta={ruta} />
              {etiqueta}
            </NavLink>
          ))}
        </div>

        <div className="admin-drawer__pie">
          <button type="button" className="boton boton--secundario" onClick={cerrarSesion}>
            Cerrar sesión
          </button>
        </div>
      </nav>
    </>
  )
}
