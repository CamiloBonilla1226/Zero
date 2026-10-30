import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { negocioConfig } from '../config/negocio.config'
import { mensajeAmigableEdgeFunction } from '../lib/erroresAmigables'
import { PERMISOS_EMPLEADO } from '../lib/seccionesAdmin'

// Gestión de usuarios_admin (dueño/empleados) del negocio. Igual que useGruposOpciones,
// no estaba en la lista original de hooks del brief, pero es necesaria para el punto 8
// ("gestión de usuarios empleados, solo visible para rol dueño").
export function useUsuariosAdmin() {
  const [usuarios, setUsuarios] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  const recargar = useCallback(async (silencioso = false) => {
    if (!silencioso) setCargando(true)
    setError(null)

    const { data, error: errorConsulta } = await supabase
      .from('usuarios_admin')
      .select(`id, numero, nombre, rol, activo, ${PERMISOS_EMPLEADO.map((permiso) => permiso.columna).join(', ')}, creado_en`)
      .eq('negocio_id', negocioConfig.negocioId)
      .order('creado_en', { ascending: true })

    if (errorConsulta) {
      setError(errorConsulta)
      setUsuarios([])
    } else {
      setUsuarios(data)
    }
    setCargando(false)
  }, [])

  useEffect(() => {
    recargar()
  }, [recargar])

  const crearEmpleado = useCallback(
    async (numero, contrasena, nombre) => {
      // La creación de la cuenta de Auth (con su app_metadata de negocio_id/rol) y el
      // registro en usuarios_admin ya no se hacen por separado desde el navegador: ambos
      // pasos ocurren dentro de la Edge Function `crear-usuario-admin`, con el cliente
      // service_role, como una sola operación. Antes, insertar la fila en usuarios_admin
      // desde aquí (con la sesión del dueño) dependía de que existieran políticas RLS para
      // esa tabla; cuando faltaron, el insert fallaba y dejaba un usuario "fantasma" en
      // auth.users sin fila en usuarios_admin. Ver CHANGELOG.md para el detalle completo.
      const { data, error: errorFuncion } = await supabase.functions.invoke('crear-usuario-admin', {
        body: { numero, contrasena, nombre, rol: 'empleado' },
      })

      // errorFuncion.message NUNCA trae el motivo real (ej. "Ya existe un usuario con ese
      // número en este negocio"): supabase-js lo reemplaza por un genérico "non-2xx status
      // code" en cualquier respuesta con error — el mensaje real hay que leerlo aparte.
      if (errorFuncion) {
        const mensaje = await mensajeAmigableEdgeFunction(
          errorFuncion,
          'No se pudo crear el empleado. Intenta de nuevo en un momento.'
        )
        return { exito: false, error: new Error(mensaje) }
      }
      if (data?.error) return { exito: false, error: new Error(data.error) }

      await recargar(true)
      return { exito: true }
    },
    [recargar]
  )

  const eliminarUsuario = useCallback(
    async (id) => {
      // Igual que crearEmpleado: se hace en una Edge Function con service_role, porque
      // borrar solo la fila de usuarios_admin desde aquí dejaba viva la cuenta de Auth
      // (con su correo interno derivado del número), bloqueando ese número para siempre —
      // ver eliminar-usuario-admin/index.ts para el detalle completo.
      const { data, error: errorFuncion } = await supabase.functions.invoke('eliminar-usuario-admin', {
        body: { id },
      })

      if (errorFuncion) {
        const mensaje = await mensajeAmigableEdgeFunction(
          errorFuncion,
          'No se pudo eliminar el usuario. Intenta de nuevo en un momento.'
        )
        return { exito: false, error: new Error(mensaje) }
      }
      if (data?.error) return { exito: false, error: new Error(data.error) }

      await recargar(true)
      return { exito: true }
    },
    [recargar]
  )

  const toggleActivo = useCallback(
    async (id, valor) => {
      const { error: errorActualizar } = await supabase.from('usuarios_admin').update({ activo: valor }).eq('id', id)
      if (!errorActualizar) await recargar(true)
      return { exito: !errorActualizar, error: errorActualizar }
    },
    [recargar]
  )

  // `permiso` es una columna de PERMISOS_EMPLEADO (lib/seccionesAdmin.js). Solo tiene
  // efecto real sobre un empleado — el dueño siempre tiene acceso completo sin depender de
  // estas columnas (ver useAuth.js).
  const togglePermiso = useCallback(
    async (id, permiso, valor) => {
      const { error: errorActualizar } = await supabase
        .from('usuarios_admin')
        .update({ [permiso]: valor })
        .eq('id', id)
      if (!errorActualizar) await recargar(true)
      return { exito: !errorActualizar, error: errorActualizar }
    },
    [recargar]
  )

  return { usuarios, cargando, error, recargar, crearEmpleado, eliminarUsuario, toggleActivo, togglePermiso }
}
