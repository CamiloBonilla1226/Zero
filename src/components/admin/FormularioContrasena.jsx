import { useState } from 'react'

function CampoContrasena({ etiqueta, valor, onCambiar, autoComplete, autoFocus = false }) {
  const [visible, setVisible] = useState(false)
  return (
    <label className="campo">
      <span>{etiqueta}</span>
      <div className="campo-contrasena">
        <input
          type={visible ? 'text' : 'password'}
          value={valor}
          onChange={(e) => onCambiar(e.target.value)}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          minLength={6}
          required
        />
        <button
          type="button"
          className="campo-contrasena__alternar"
          onClick={() => setVisible((actual) => !actual)}
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        >
          {visible ? '🙈' : '👁️'}
        </button>
      </div>
    </label>
  )
}

// Cambio de la contraseña propia (Usuarios → "Cambiar mi contraseña", solo dueños). Pide la
// actual para confirmar que es la persona dueña de la cuenta, y la nueva dos veces para evitar
// quedar por fuera por un error de tipeo. El cambio real lo hace useAuth.cambiarContrasena.
export function FormularioContrasena({ onGuardar, onCancelar }) {
  const [actual, setActual] = useState('')
  const [nueva, setNueva] = useState('')
  const [confirmacion, setConfirmacion] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)

  const enviar = async (evento) => {
    evento.preventDefault()
    if (!actual) return setError('Escribe tu contraseña actual.')
    if (nueva.length < 6) return setError('La contraseña nueva debe tener al menos 6 caracteres.')
    if (nueva !== confirmacion) return setError('La confirmación no coincide con la contraseña nueva.')
    if (nueva === actual) return setError('La contraseña nueva debe ser distinta de la actual.')

    setGuardando(true)
    setError(null)
    const { exito, error: errorCambio } = await onGuardar(actual, nueva)
    setGuardando(false)
    if (!exito) setError(errorCambio?.message || 'No se pudo cambiar la contraseña.')
  }

  return (
    <form className="checkout" onSubmit={enviar} noValidate>
      <CampoContrasena etiqueta="Contraseña actual" valor={actual} onCambiar={setActual} autoComplete="current-password" autoFocus />
      <CampoContrasena etiqueta="Contraseña nueva (mínimo 6 caracteres)" valor={nueva} onCambiar={setNueva} autoComplete="new-password" />
      <CampoContrasena etiqueta="Repite la contraseña nueva" valor={confirmacion} onCambiar={setConfirmacion} autoComplete="new-password" />

      {error && <p className="campo__error">{error}</p>}

      <div className="opciones-producto__acciones">
        <button type="button" className="boton boton--secundario" onClick={onCancelar}>
          Cancelar
        </button>
        <button type="submit" className="boton" disabled={guardando}>
          {guardando ? 'Guardando…' : 'Cambiar contraseña'}
        </button>
      </div>
    </form>
  )
}
