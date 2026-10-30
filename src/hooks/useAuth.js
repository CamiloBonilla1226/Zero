import { createContext, createElement, useCallback, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { correoInternoANumero, numeroACorreoInterno } from '../lib/phoneAuth'
import { negocioConfig } from '../config/negocio.config'
import { PERMISOS_EMPLEADO } from '../lib/seccionesAdmin'
import { desuscribirAlCerrarSesion } from '../lib/notificacionesPush'

const AuthContext = createContext(null)

function extraerSesion(session) {
  if (!session?.user) {
    return { usuario: null, rol: null, negocioId: null }
  }

  // rol/negocio_id se leen de app_metadata, no de user_metadata: app_metadata solo lo
  // puede escribir el servidor (con la service_role key, ver la Edge Function
  // crear-usuario-admin), mientras que user_metadata lo puede modificar el propio
  // usuario autenticado con supabase.auth.updateUser(). Si el rol/negocio_id vivieran en
  // user_metadata, cualquier admin podría cambiarse a sí mismo el negocio_id y acceder a
  // datos de otro negocio. Las políticas RLS ya se corrigieron para exigir app_metadata.
  const metadata = session.user.app_metadata ?? {}
  return {
    usuario: session.user,
    rol: metadata.rol ?? null,
    negocioId: metadata.negocio_id ?? null,
  }
}

// Lógica real de autenticación. Vive en una función aparte (no exportada) porque solo debe
// correr UNA VEZ por toda la app, dentro de AuthProvider — antes, cada componente que llamaba
// useAuth() directamente (Login.jsx, RutaProtegida.jsx, AdminNav.jsx, Dashboard.jsx) traía su
// propia copia de este estado y disparaba su propia consulta a usuarios_admin por separado,
// todas casi al mismo tiempo justo después de iniciar sesión. Con 3-4 consultas idénticas
// corriendo en paralelo, bastaba con que UNA de ellas se comportara distinto (en la build de
// producción minificada, donde esto se reprodujo de forma consistente aunque los datos y el
// RLS estaban bien) para que ese componente en particular concluyera "cuenta inválida" — con
// una sola fuente de verdad compartida, ese modo de falla ya no puede ocurrir.
function useAuthInterno() {
  const [estado, setEstado] = useState({
    usuario: null,
    rol: null,
    negocioId: null,
    cargando: true,
  })
  const [error, setError] = useState(null)
  // Perfil propio en usuarios_admin (nombre + permisos por módulo): vive aparte de
  // app_metadata porque, igual que `activo`, son datos que el dueño puede cambiar en
  // cualquier momento sin que eso reescriba el JWT ya emitido del empleado.
  const [perfil, setPerfil] = useState(null)
  // Para qué usuario (por id) están al día `perfil`/`perfilError` — null mientras no hay
  // ningún resultado calculado todavía. Que "cargando el perfil" sea un booleano de estado
  // aparte (en vez de derivarse de esto) causaba un bug real y siempre reproducible: justo
  // al iniciar sesión, `estado.usuario` cambiaba de null a el usuario real en un render,
  // pero el booleano de "cargando" — que el chequeo inicial de "no hay usuario" ya había
  // dejado en `false` — no se ponía en `true` hasta el siguiente efecto, un render después.
  // En ese único render intermedio, cuentaValida veía cargandoPerfil=false y perfil=null (el
  // resultado viejo, de cuando no había usuario) y concluía "cuenta inválida", rebotando al
  // login antes de que la consulta nueva siquiera empezara — en todo navegador, siempre.
  // Derivar "cargando" de si el id del usuario actual coincide con el id para el que ya hay
  // resultado, en vez de guardarlo aparte, hace imposible ese desfase: no hay ningún render
  // donde puedan quedar desincronizados.
  const [perfilUsuarioId, setPerfilUsuarioId] = useState(null)
  const cargandoPerfil = Boolean(estado.usuario) && estado.usuario.id !== perfilUsuarioId
  // Distingue "la consulta corrió bien y no encontró fila" (usuario realmente eliminado) de
  // "la consulta falló" (RLS, red, lo que sea — ver el log de abajo, este problema ya se
  // había visto antes). Solo el primer caso debe poder cerrar la sesión de alguien: si se
  // tratara cualquier error de red/RLS como "cuenta inválida", una consulta que falla una
  // vez por lo que sea sacaría del panel hasta al dueño con credenciales correctas.
  const [perfilError, setPerfilError] = useState(false)

  useEffect(() => {
    let activo = true

    supabase.auth.getSession().then(({ data, error: errorSesion }) => {
      if (!activo) return
      // getSession() intenta renovar automáticamente el token guardado en localStorage. Si
      // ese token quedó de una sesión que el servidor ya invalidó (visto en producción tras
      // mucho probar login/logout: queda "atascado" ahí, y hasta un login nuevo con
      // credenciales correctas se ve afectado porque el cliente de Supabase arranca en un
      // estado roto), se limpia esa sesión local para que la app arranque desde cero.
      if (errorSesion) {
        console.warn('[useAuth] Sesión guardada inválida al arrancar, se limpia:', errorSesion)
        setEstado({ usuario: null, rol: null, negocioId: null, cargando: false })
        supabase.auth.signOut({ scope: 'local' })
        return
      }
      setEstado({ ...extraerSesion(data.session), cargando: false })
    })

    const { data: suscripcion } = supabase.auth.onAuthStateChange((_evento, session) => {
      if (!activo) return
      setEstado({ ...extraerSesion(session), cargando: false })
    })

    return () => {
      activo = false
      suscripcion.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    let activo = true

    if (!estado.usuario?.email) {
      setPerfil(null)
      setPerfilError(false)
      setPerfilUsuarioId(null)
      return undefined
    }

    const usuarioId = estado.usuario.id
    const numero = correoInternoANumero(estado.usuario.email)

    const consultarPerfil = () =>
      supabase
        .from('usuarios_admin')
        .select(`nombre, activo, ${PERMISOS_EMPLEADO.map((permiso) => permiso.columna).join(', ')}`)
        .eq('negocio_id', negocioConfig.negocioId)
        .eq('numero', numero)
        .maybeSingle()

    async function cargarPerfil() {
      let { data, error: errorPerfil } = await consultarPerfil()

      // Si no se encontró fila (sin error), se reintenta una vez tras una pausa corta antes
      // de darlo por definitivo. Justo después de un login recién hecho, la sesión puede
      // tardar un instante en propagarse del lado del cliente/RLS; sin este reintento, esa
      // demora se confundía con "la cuenta fue eliminada" y cerraba la sesión de una cuenta
      // recién autenticada y perfectamente válida (visto en producción: login correcto
      // seguido de un logout inmediato).
      if (!errorPerfil && !data) {
        await new Promise((resolver) => setTimeout(resolver, 600))
        if (!activo) return
        ;({ data, error: errorPerfil } = await consultarPerfil())
      }

      if (!activo) return

      // Caso aparte: el error no es "no se pudo verificar" (RLS, red) sino "esta sesión ya
      // no existe" — el token que quedó guardado en el navegador apunta a una sesión que el
      // servidor ya invalidó (ej. quedó de una prueba anterior, o se revocó desde otro
      // dispositivo). Tratarlo como perfilError (fail-open) no sirve de nada acá: si la
      // sesión en sí está rota, ninguna consulta va a funcionar aunque se deje pasar. Hay
      // que limpiarla para que la persona vea el formulario de login de nuevo, en vez de
      // quedar atascada sin poder hacer nada.
      if (errorPerfil?.code === 'session_not_found') {
        console.warn('[useAuth] La sesión guardada ya no existe en el servidor, se limpia:', errorPerfil)
        setPerfil(null)
        setPerfilError(false)
        setPerfilUsuarioId(usuarioId)
        setError('Tu sesión expiró. Inicia sesión de nuevo.')
        await supabase.auth.signOut({ scope: 'local' })
        return
      }

      // Log temporal de diagnóstico: si la consulta falla (RLS, columna inexistente,
      // numero que no matchea) o no encuentra fila, se ve en la consola en vez de fallar
      // en silencio con "sin permisos" como único síntoma visible.
      if (errorPerfil) {
        console.error('[useAuth] No se pudo cargar el perfil de usuarios_admin:', errorPerfil, { numero })
      } else if (!data) {
        console.warn('[useAuth] usuarios_admin no tiene ninguna fila para este usuario (tras reintento):', { numero })
      }
      setPerfil(data ?? null)
      setPerfilError(Boolean(errorPerfil))
      setPerfilUsuarioId(usuarioId)
    }

    cargarPerfil()

    return () => {
      activo = false
    }
  }, [estado.usuario])

  // Si la sesión de Auth sigue viva (JWT todavía válido) pero la fila en usuarios_admin ya
  // no existe o quedó desactivada, hay que cerrar esa sesión activamente. Sin esto,
  // `autenticado` se queda en true con datos viejos y RutaProtegida.jsx, al redirigir a
  // /admin/login, rebotaría de vuelta a /admin en un loop (Login.jsx también navega a
  // /admin mientras `autenticado` sea true).
  //
  // `scope: 'local'` en vez del 'global' por defecto: si la cuenta de Auth ya no existe
  // (ej. se eliminó con eliminar-usuario-admin), el servidor no puede revocar esa sesión y
  // /logout devuelve 403 una y otra vez — con scope 'global' eso deja la sesión local sin
  // limpiar nunca y el rebote se vuelve infinito de verdad. 'local' borra el almacenamiento
  // del navegador de inmediato sin depender de que el servidor confirme nada.
  //
  // Como este efecto ahora corre una sola vez para toda la app (useAuthInterno vive dentro
  // de AuthProvider, no en cada componente que consume useAuth), ya no hace falta el flag de
  // módulo que antes evitaba que 3-4 instancias dispararan signOut a la vez.
  const [cerrandoSesionInvalida, setCerrandoSesionInvalida] = useState(false)
  useEffect(() => {
    if (!estado.usuario || cargandoPerfil) return
    // `!perfilError`: si la consulta falló (en vez de correr bien y no encontrar nada), no
    // se puede saber si la cuenta sigue existiendo — no cerrar sesión en ese caso ambiguo.
    const confirmadoInvalido = !perfilError && (perfil === null || perfil.activo === false)
    if (confirmadoInvalido && !cerrandoSesionInvalida) {
      setCerrandoSesionInvalida(true)
      supabase.auth.signOut({ scope: 'local' }).finally(() => {
        setCerrandoSesionInvalida(false)
      })
    }
  }, [estado.usuario, cargandoPerfil, perfil, perfilError, cerrandoSesionInvalida])

  const iniciarSesion = useCallback(async (numero, contrasena) => {
    setError(null)
    const correoInterno = numeroACorreoInterno(numero, negocioConfig.negocioId)

    const { data, error: errorLogin } = await supabase.auth.signInWithPassword({
      email: correoInterno,
      password: contrasena,
    })

    if (errorLogin) {
      setError('Número o contraseña incorrectos.')
      return { exito: false, error: errorLogin }
    }

    // Verificación adicional (no es la seguridad real, esa la aplica RLS): un usuario
    // autenticado solo debe poder operar en el negocio para el que este proyecto está
    // configurado. Si por alguna razón la sesión trae otro negocio_id, se cierra.
    const negocioIdSesion = data.user?.app_metadata?.negocio_id
    if (negocioIdSesion !== negocioConfig.negocioId) {
      // scope 'local' (no el 'global' por defecto): si esta cuenta no es válida aquí, no
      // hay garantía de que el servidor pueda revocarla igual (ver el efecto de abajo, que
      // tiene el mismo motivo) — 'local' limpia el navegador sin depender de esa respuesta.
      await supabase.auth.signOut({ scope: 'local' })
      setError('Este usuario no pertenece a este negocio.')
      return { exito: false, error: new Error('negocio_id no coincide') }
    }

    // El chequeo de `activo` en usuarios_admin (desactivar una cuenta no reescribe el JWT ya
    // emitido, así que no basta con lo que ya verificó signInWithPassword) NO se repite aquí:
    // ya lo hace `cuentaValida` justo después de navegar (ver el efecto de perfil y el de
    // auto-signout más abajo), con reintento incluido para no confundir una sesión recién
    // creada (que puede tardar un instante en propagarse) con una cuenta eliminada. Tener esa
    // misma validación duplicada en este punto, corriendo en el mismo instante que el login,
    // era justamente lo que causaba el cierre de sesión inmediato de cuentas válidas (visto en
    // producción: login correcto seguido de un logout automático).
    return { exito: true }
  }, [])

  const cerrarSesion = useCallback(async () => {
    // Antes del signOut: borrar la fila de suscripciones_push necesita la sesión (RLS).
    await desuscribirAlCerrarSesion()
    await supabase.auth.signOut()
  }, [])

  const esDueno = estado.rol === 'dueño'
  // Que Supabase Auth acepte la sesión no basta: si el dueño ya borró (o desactivó) la
  // fila de este usuario en usuarios_admin, la cuenta de Auth puede seguir viva un rato
  // (ver eliminarUsuario en useUsuariosAdmin.js) o el JWT seguir siendo válido hasta que
  // expire. `cuentaValida` es lo que RutaProtegida.jsx usa como el verdadero portón de
  // acceso, no `autenticado` a secas — evita el "flash" de contenido admin para un usuario
  // ya eliminado/desactivado mientras esta consulta todavía está en camino.
  // Igual que en el efecto de arriba: si la consulta falló (perfilError), no se trata como
  // cuenta inválida — solo una fila confirmada ausente/inactiva bloquea el acceso.
  const cuentaValida =
    Boolean(estado.usuario) && !cargandoPerfil && (perfilError || (perfil !== null && perfil.activo !== false))

  return {
    usuario: estado.usuario,
    rol: estado.rol,
    negocioId: estado.negocioId,
    cargando: estado.cargando,
    cargandoPerfil,
    autenticado: Boolean(estado.usuario),
    cuentaValida,
    esDueno,
    esEmpleado: estado.rol === 'empleado',
    nombre: perfil?.nombre ?? null,
    // El dueño siempre tiene acceso completo, sin depender de estas columnas (que solo
    // aplican a empleados): puedePedidos, puedeProductos, puedeCategorias, puedeAdiciones,
    // puedeSabores, puedeOfertas, puedeNegocio (ver PERMISOS_EMPLEADO).
    ...Object.fromEntries(
      PERMISOS_EMPLEADO.map((permiso) => [permiso.clave, esDueno || perfil?.[permiso.columna] === true])
    ),
    error,
    iniciarSesion,
    cerrarSesion,
  }
}

export function AuthProvider({ children }) {
  const auth = useAuthInterno()
  return createElement(AuthContext.Provider, { value: auth }, children)
}

export function useAuth() {
  const auth = useContext(AuthContext)
  if (!auth) {
    throw new Error('useAuth() debe usarse dentro de <AuthProvider>.')
  }
  return auth
}
