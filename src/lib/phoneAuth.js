// Supabase Auth exige un correo por cuenta, aunque el panel admin solo use número de
// teléfono. Aquí se transforma el número en un correo interno, nunca visible para el
// usuario, que sirve únicamente para autenticarse contra Supabase Auth.
//
// Decisión importante: el número (`numero`) es único por negocio, no globalmente
// (ver contexto-proyecto-base.md), pero todos los negocios comparten la misma base de
// datos y por lo tanto el mismo espacio de auth.users, donde el email SÍ debe ser único
// a nivel global. Si dos negocios distintos tuvieran un dueño con el mismo número, un
// correo interno basado solo en el número colisionaría entre negocios.
// Por eso el correo interno combina número + negocioId (fijo por proyecto/deploy, ver
// negocio.config.js) para garantizar unicidad global sin pedirle nada extra al usuario.
const DOMINIO_INTERNO = 'interno.local'

export function normalizarNumero(numero) {
  return String(numero).replace(/\D/g, '')
}

export function numeroACorreoInterno(numero, negocioId) {
  const numeroLimpio = normalizarNumero(numero)
  return `${numeroLimpio}.${negocioId}@${DOMINIO_INTERNO}`
}

// Inverso de numeroACorreoInterno: recupera el número desde el correo interno de la sesión
// (todo lo que hay antes del primer punto — negocioId es un UUID, que solo usa guiones, así
// que no hay ambigüedad). Se usa para que el panel pueda consultar la propia fila de
// usuarios_admin del usuario autenticado (nombre, permisos), ya que esa tabla no guarda un
// id de auth.users, solo `numero` + `negocio_id`.
export function correoInternoANumero(correo) {
  return correo.split('.')[0]
}
