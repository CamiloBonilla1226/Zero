import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { negocioConfig } from '../config/negocio.config'

// Tabla propia `negocio_config` (aparte de `negocios`, que administra el panel maestro:
// activo, pago) para el contenido que el dueño edita libremente desde su panel: descripción,
// dirección, horario, redes sociales. Lectura pública (sin login), escritura solo para el
// dueño de este negocio_id — ver políticas RLS documentadas en CHANGELOG.md. Las ofertas ya no
// viven aquí (columna `oferta`, obsoleta): tienen su propia tabla, ver useOfertas.js.
export function useNegocioConfig() {
  const [config, setConfig] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  const recargar = useCallback(async () => {
    setCargando(true)
    setError(null)

    const { data, error: errorConsulta } = await supabase
      .from('negocio_config')
      .select('descripcion, direccion, horario, redes_sociales, adiciones_en_menu')
      .eq('negocio_id', negocioConfig.negocioId)
      .maybeSingle()

    if (errorConsulta) {
      setError(errorConsulta)
      setConfig(null)
    } else {
      setConfig(data)
    }
    setCargando(false)
  }, [])

  useEffect(() => {
    recargar()
  }, [recargar])

  // Upsert por `negocio_id` (columna única en negocio_config): si el negocio todavía no tiene
  // fila (primera vez que el dueño guarda), la crea; si ya existe, la actualiza. Hace merge
  // superficial sobre lo ya guardado, para que quien llama solo mande las claves que cambió.
  const guardarConfig = useCallback(
    async (cambios) => {
      const nuevaConfig = { ...(config ?? {}), ...cambios }

      const { error: errorGuardar } = await supabase
        .from('negocio_config')
        .upsert({ negocio_id: negocioConfig.negocioId, ...nuevaConfig }, { onConflict: 'negocio_id' })
        .select()
        .single()

      if (errorGuardar) return { exito: false, error: errorGuardar }

      await recargar()
      return { exito: true }
    },
    [config, recargar]
  )

  return { config, cargando, error, recargar, guardarConfig }
}
