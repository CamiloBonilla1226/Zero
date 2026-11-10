import { useState } from 'react'
import { AdminNav } from '../../components/admin/AdminNav'
import { EncabezadoPagina, BotonCrear } from '../../components/admin/EncabezadoPagina'
import { TablaUsuarios } from '../../components/admin/TablaUsuarios'
import { FormularioEmpleado } from '../../components/admin/FormularioEmpleado'
import { FormularioContrasena } from '../../components/admin/FormularioContrasena'
import { useAuth } from '../../hooks/useAuth'
import { useUsuariosAdmin } from '../../hooks/useUsuariosAdmin'
import { useSwipeParaCerrar } from '../../hooks/useSwipeParaCerrar'
import { alSoltarFondo } from '../../lib/superposicion'
import { useToast } from '../../hooks/useToast'
import { useConfirmacion } from '../../hooks/useConfirmacion'

export function Usuarios() {
  const { usuarios, cargando, error, crearEmpleado, eliminarUsuario, toggleActivo, togglePermiso } = useUsuariosAdmin()

  const { nombre, cambiarContrasena } = useAuth()
  // Un solo modal a la vez: 'empleado' (crear empleado) o 'contrasena' (cambiar la propia).
  const [modal, setModal] = useState(null)
  const cerrarModal = () => setModal(null)
  const swipe = useSwipeParaCerrar(cerrarModal)
  const mostrarToast = useToast()
  const confirmar = useConfirmacion()

  // Esta pantalla es para que el dueño administre a SUS empleados, así que se ocultan todas
  // las filas con rol "dueño": la suya y la de los otros dueños (ZÉRO tiene dos). Un dueño no
  // debe poder eliminar ni desactivar a otro desde aquí; los dueños se dan de alta y se editan
  // con scripts/cambiar-duenos-zero.sql.
  const empleados = usuarios.filter((usuario) => usuario.rol !== 'dueño')

  const guardarEmpleado = async (numero, contrasena, nombre) => {
    const resultado = await crearEmpleado(numero, contrasena, nombre)
    if (resultado.exito) {
      setModal(null)
      mostrarToast('Empleado creado')
    }
    return resultado
  }

  const guardarContrasena = async (actual, nueva) => {
    const resultado = await cambiarContrasena(actual, nueva)
    if (resultado.exito) {
      setModal(null)
      mostrarToast('Contraseña cambiada. Úsala la próxima vez que inicies sesión.')
    }
    return resultado
  }

  const confirmarEliminar = async (id) => {
    const confirmado = await confirmar('¿Eliminar este usuario? Ya no podrá iniciar sesión en el panel.')
    if (!confirmado) return

    const { exito, error: errorEliminar } = await eliminarUsuario(id)
    mostrarToast(
      exito ? 'Usuario eliminado' : errorEliminar?.message || 'No se pudo eliminar el usuario',
      exito ? 'exito' : 'error'
    )
  }

  const cambiarActivo = async (id, valor) => {
    const { exito } = await toggleActivo(id, valor)
    mostrarToast(
      exito ? (valor ? 'Usuario activado' : 'Usuario desactivado') : 'No se pudo actualizar el usuario',
      exito ? 'exito' : 'error'
    )
  }

  const cambiarPermiso = async (id, permiso, valor) => {
    const { exito } = await togglePermiso(id, permiso, valor)
    mostrarToast(exito ? 'Permiso actualizado' : 'No se pudo actualizar el permiso', exito ? 'exito' : 'error')
  }

  return (
    <>
      <AdminNav />
      <main className="contenedor admin-usuarios">
        <EncabezadoPagina
          titulo="Usuarios"
          descripcion="Cuentas de tus empleados y las secciones del panel que pueden ver."
          accion={<BotonCrear onClick={() => setModal('empleado')}>Crear empleado</BotonCrear>}
        />

        <section className="tarjeta mi-cuenta">
          <div>
            <p className="mi-cuenta__rotulo">Mi cuenta</p>
            <strong>{nombre ?? 'Dueño'}</strong>
          </div>
          <button type="button" className="boton boton--secundario boton--pequeno" onClick={() => setModal('contrasena')}>
            Cambiar mi contraseña
          </button>
        </section>

        {cargando && <p className="texto-suave">Cargando usuarios…</p>}
        {error && <p className="campo__error">No se pudieron cargar los usuarios.</p>}
        {!cargando && !error && (
          <TablaUsuarios
            usuarios={empleados}
            onEliminar={confirmarEliminar}
            onToggleActivo={cambiarActivo}
            onTogglePermiso={cambiarPermiso}
          />
        )}
      </main>

      {modal && (
        <div className="superposicion" role="dialog" aria-modal="true" onClick={alSoltarFondo(cerrarModal)}>
          <div
            className="superposicion__panel"
            style={swipe.estilo}
            onTouchStart={swipe.onTouchStart}
            onTouchMove={swipe.onTouchMove}
            onTouchEnd={swipe.onTouchEnd}
          >
            <button type="button" className="superposicion__cerrar-x" onClick={cerrarModal} aria-label="Cerrar">
              ×
            </button>
            {modal === 'empleado' ? (
              <>
                <h2>Crear empleado</h2>
                <FormularioEmpleado onGuardar={guardarEmpleado} onCancelar={cerrarModal} />
              </>
            ) : (
              <>
                <h2>Cambiar mi contraseña</h2>
                <FormularioContrasena onGuardar={guardarContrasena} onCancelar={cerrarModal} />
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
