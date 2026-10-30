// Traduce errores técnicos (de Postgres/PostgREST o de una Edge Function) a un mensaje en
// español que explica qué pasó, en vez de mostrar texto técnico tal cual — algo como
// "duplicate key value violates unique constraint" o "Edge Function returned a non-2xx
// status code" no le dice nada a quien administra el negocio, y hace parecer que la
// aplicación se rompió cuando en realidad es una validación esperada (ej. un número
// repetido).

// Códigos de error de Postgres más comunes al escribir desde el panel admin.
// Ver https://www.postgresql.org/docs/current/errcodes-appendix.html
const MENSAJES_POR_CODIGO_POSTGRES = {
  '23505': 'Ya existe un registro con ese mismo valor. Usa uno diferente.',
  '23503': 'No se puede completar esta acción porque hay otros datos que dependen de esto.',
  '42501': 'No tienes permiso para hacer esto.',
}

// Para errores que vienen de un `supabase.from(...)` (insert/update/delete). `error` trae
// `code`/`message` de Postgres tal cual los expone PostgREST.
export function mensajeAmigablePostgres(error, mensajePorDefecto) {
  if (!error) return null
  return MENSAJES_POR_CODIGO_POSTGRES[error.code] ?? error.message ?? mensajePorDefecto
}

// Para errores que vienen de `supabase.functions.invoke(...)`. Cuando una Edge Function
// responde con un status distinto de 2xx, supabase-js NO expone el cuerpo JSON que
// devolvimos (ej. `{ error: "Ya existe un usuario con ese número..." }`) en `error.message`
// — ese campo siempre dice el genérico "Edge Function returned a non-2xx status code". El
// mensaje real hay que leerlo de `error.context`, la Response cruda de esa petición.
export async function mensajeAmigableEdgeFunction(error, mensajePorDefecto) {
  if (!error) return null
  try {
    if (error.context && typeof error.context.json === 'function') {
      const cuerpo = await error.context.clone().json()
      if (cuerpo?.error) return cuerpo.error
    }
  } catch {
    // El cuerpo no era JSON, o ya se había consumido — se usa el mensaje por defecto.
  }
  return mensajePorDefecto
}
