import { useContext } from 'react'
import { ToastContext } from '../lib/toastContext'

// Devuelve `mostrar(mensaje, tipo)` con tipo: 'exito' (default) | 'error'.
export function useToast() {
  const contexto = useContext(ToastContext)
  if (!contexto) throw new Error('useToast debe usarse dentro de <ToastProvider>.')
  return contexto
}
