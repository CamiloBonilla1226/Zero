import { useCallback, useRef, useState } from 'react'
import { ToastContext } from '../../lib/toastContext'

// Tiempos cortos a propósito: el pedido fue "que se quite rápido". La salida se anima
// aparte (clase `toast--saliendo`) para que no desaparezca de golpe.
const DURACION_VISIBLE_MS = 1600
const DURACION_SALIDA_MS = 200

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const idRef = useRef(0)

  const mostrar = useCallback((mensaje, tipo = 'exito') => {
    const id = ++idRef.current
    setToasts((actuales) => [...actuales, { id, mensaje, tipo, saliendo: false }])

    setTimeout(() => {
      setToasts((actuales) => actuales.map((t) => (t.id === id ? { ...t, saliendo: true } : t)))
    }, DURACION_VISIBLE_MS)

    setTimeout(() => {
      setToasts((actuales) => actuales.filter((t) => t.id !== id))
    }, DURACION_VISIBLE_MS + DURACION_SALIDA_MS)
  }, [])

  return (
    <ToastContext.Provider value={mostrar}>
      {children}
      <div className="toast-contenedor" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast--${toast.tipo} ${toast.saliendo ? 'toast--saliendo' : ''}`}>
            {toast.mensaje}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
