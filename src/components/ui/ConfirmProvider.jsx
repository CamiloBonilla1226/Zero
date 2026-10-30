import { useCallback, useRef, useState } from 'react'
import { ConfirmContext } from '../../lib/confirmContext'

// Reemplaza window.confirm por un diálogo con el mismo look & feel del resto del panel
// (en vez del cuadro genérico del navegador). Basado en promesas para poder seguir
// escribiendo `if (await confirmar(...)) { ... }` en el código que lo usa.
export function ConfirmProvider({ children }) {
  const [dialogo, setDialogo] = useState(null)
  const resolverRef = useRef(null)

  const confirmar = useCallback((mensaje, opciones = {}) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve
      setDialogo({
        mensaje,
        textoConfirmar: opciones.textoConfirmar ?? 'Eliminar',
        peligroso: opciones.peligroso ?? true,
      })
    })
  }, [])

  const cerrar = (resultado) => {
    const resolver = resolverRef.current
    resolverRef.current = null
    setDialogo(null)
    resolver?.(resultado)
  }

  const cancelar = () => cerrar(false)
  const confirmarClick = () => cerrar(true)

  // Cierra solo si el click empezó en el fondo mismo (no en el panel), sin depender de
  // `alSoltarFondo` aquí: se evita envolver una función que lee `resolverRef.current` en
  // otra función creada al vuelo dentro del JSX.
  const alSoltarFondo = (evento) => {
    if (evento.target === evento.currentTarget) cancelar()
  }

  return (
    <ConfirmContext.Provider value={confirmar}>
      {children}
      {dialogo && (
        <div
          className="superposicion superposicion--confirmacion"
          role="alertdialog"
          aria-modal="true"
          onClick={alSoltarFondo}
        >
          <div className="confirmacion">
            <p className="confirmacion__mensaje">{dialogo.mensaje}</p>
            <div className="confirmacion__acciones">
              <button type="button" className="boton boton--secundario" onClick={cancelar}>
                Cancelar
              </button>
              <button
                type="button"
                className={`boton ${dialogo.peligroso ? 'boton--peligro' : ''}`}
                onClick={confirmarClick}
                autoFocus
              >
                {dialogo.textoConfirmar}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}
