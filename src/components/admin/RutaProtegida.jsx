import { Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

// Refuerza en la interfaz lo que ya garantiza RLS del lado de la base de datos: sin
// sesión no se entra al panel, las rutas marcadas `soloDueno` no se muestran a un empleado,
// y las que piden un `permiso` puntual (ej. "puedeProductos") solo se muestran al dueño o
// al empleado al que el dueño se lo haya activado (aunque, como pide el brief, la
// restricción real de datos vive en RLS, no aquí).
export function RutaProtegida({ children, soloDueno = false, permiso }) {
  const auth = useAuth()
  const { autenticado, cargando, cargandoPerfil, cuentaValida, esDueno } = auth

  if (cargando) return <p className="texto-suave admin-cargando">Cargando…</p>
  if (!autenticado) return <Navigate to="/admin/login" replace />

  // `autenticado` solo dice que Supabase Auth aceptó el token — no que la fila de este
  // usuario en usuarios_admin siga existiendo y activa (el dueño pudo haberla borrado o
  // desactivado). Sin esperar `cargandoPerfil` aquí, una cuenta recién eliminada alcanza a
  // ver el contenido admin durante uno o dos renders antes de que el signOut la saque.
  if (cargandoPerfil) return <p className="texto-suave admin-cargando">Cargando…</p>
  // `state` le avisa a Login.jsx por qué volvió aquí, ya que el chequeo de cuenta
  // eliminada/desactivada ya no se hace en el propio iniciarSesion (ver useAuth.js) sino
  // acá, un instante después de navegar — para entonces Login.jsx ya no tiene forma de
  // saberlo por sí mismo.
  if (!cuentaValida) return <Navigate to="/admin/login" replace state={{ cuentaInvalida: true }} />

  // Sin permiso se vuelve a Inicio, la única sección que ve cualquier usuario del panel.
  if (soloDueno && !esDueno) return <Navigate to="/admin" replace />
  if (permiso && !auth[permiso]) return <Navigate to="/admin" replace />

  return children
}
