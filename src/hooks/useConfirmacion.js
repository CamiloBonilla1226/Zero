import { useContext } from 'react'
import { ConfirmContext } from '../lib/confirmContext'

// Devuelve `confirmar(mensaje, { textoConfirmar, peligroso })`, que resuelve en
// `true`/`false` según lo que elija la persona. `peligroso` (default true) pinta el botón
// de confirmar en rojo; pásalo en `false` para confirmaciones neutras (no destructivas).
export function useConfirmacion() {
  const contexto = useContext(ConfirmContext)
  if (!contexto) throw new Error('useConfirmacion debe usarse dentro de <ConfirmProvider>.')
  return contexto
}
