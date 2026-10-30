// Búsqueda en tiempo real (sin Enter) dentro de la pestaña Menú; el filtro real vive en
// Carta.jsx, combinado con la categoría activa.
export function BuscadorProductos({ valor, onCambiar }) {
  return (
    <div className="buscador-productos">
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" className="buscador-productos__icono">
        <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <line x1="16" y1="16" x2="21" y2="21" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
      <input
        type="search"
        value={valor}
        onChange={(e) => onCambiar(e.target.value)}
        placeholder="Buscar producto…"
        aria-label="Buscar producto"
      />
    </div>
  )
}
