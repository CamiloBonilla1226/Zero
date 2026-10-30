export function Interruptor({ activo, onCambiar, etiqueta = 'Disponible' }) {
  return (
    <label className="interruptor">
      <input type="checkbox" checked={activo} onChange={(e) => onCambiar(e.target.checked)} />
      <span className="interruptor__pista" aria-hidden="true" />
      {etiqueta && <span className="interruptor__etiqueta">{etiqueta}</span>}
    </label>
  )
}
