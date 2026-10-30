import { useState } from 'react'
import { Interruptor } from './Interruptor'
import { PERMISOS_EMPLEADO } from '../../lib/seccionesAdmin'

function TarjetaUsuario({ usuario, onEliminar, onToggleActivo, onTogglePermiso }) {
  const [abierta, setAbierta] = useState(false)

  return (
    <li className="tarjeta usuario-admin-item">
      <button
        type="button"
        className="usuario-admin-item__encabezado"
        onClick={() => setAbierta((actual) => !actual)}
        aria-expanded={abierta}
      >
        <span className="usuario-admin-item__resumen">
          <span className="usuario-admin-item__nombre">{usuario.nombre}</span>
          <span className="texto-suave">{usuario.numero}</span>
        </span>
        <span className={`usuario-admin-item__flecha${abierta ? ' usuario-admin-item__flecha--abierta' : ''}`} aria-hidden="true">
          ▾
        </span>
      </button>

      {abierta && (
        <div className="usuario-admin-item__detalle">
          <div className="usuario-admin-item__fila">
            <span>Activo</span>
            <Interruptor activo={usuario.activo} etiqueta="" onCambiar={(valor) => onToggleActivo(usuario.id, valor)} />
          </div>
          <p className="usuario-admin-item__subtitulo">Secciones del panel</p>
          {PERMISOS_EMPLEADO.map((permiso) => (
            <div key={permiso.columna} className="usuario-admin-item__fila">
              <span className="usuario-admin-item__permiso">
                <span>{permiso.etiqueta}</span>
                <span className="texto-suave">{permiso.descripcion}</span>
              </span>
              <Interruptor
                activo={usuario[permiso.columna] === true}
                etiqueta=""
                onCambiar={(valor) => onTogglePermiso(usuario.id, permiso.columna, valor)}
              />
            </div>
          ))}
          <p className="texto-suave usuario-admin-item__nota">
            Inicio lo ven todos. Usuarios es solo del dueño.
          </p>
          <button type="button" className="carrito__quitar" onClick={() => onEliminar(usuario.id)}>
            Eliminar
          </button>
        </div>
      )}
    </li>
  )
}

export function TablaUsuarios({ usuarios, onEliminar, onToggleActivo, onTogglePermiso }) {
  if (usuarios.length === 0) {
    return <p className="texto-suave admin-vacio">Todavía no hay usuarios. Crea el primero.</p>
  }

  return (
    <ul className="lista-usuarios-admin">
      {usuarios.map((usuario) => (
        <TarjetaUsuario
          key={usuario.id}
          usuario={usuario}
          onEliminar={onEliminar}
          onToggleActivo={onToggleActivo}
          onTogglePermiso={onTogglePermiso}
        />
      ))}
    </ul>
  )
}
