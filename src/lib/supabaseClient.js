import { createClient } from '@supabase/supabase-js'
import { negocioConfig, NEGOCIO_ID_EJEMPLO } from '../config/negocio.config'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Faltan las variables de entorno VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY. Revisa tu archivo .env.local.'
  )
}

// Un negocioId sin reemplazar arma un correo interno que no coincide con ningún usuario
// real en Supabase Auth: el login falla con un 400 que parece un problema de credenciales
// pero es este desajuste de configuración (ver CHANGELOG.md, lección del 2026-09-24).
if (negocioConfig.negocioId === NEGOCIO_ID_EJEMPLO) {
  console.warn(
    'negocioConfig.negocioId sigue siendo el UUID de ejemplo. Reemplázalo en src/config/negocio.config.js por el negocio_id real, o el login de cualquier usuario fallará con un error 400.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
