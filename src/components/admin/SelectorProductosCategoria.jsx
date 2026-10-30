import { useMemo, useState } from 'react'
import { normalizarTexto } from '../../lib/texto'

// Lista de productos con casilla, dentro del formulario de categoría: marcar un producto lo
// mete en esta categoría y desmarcarlo lo saca (al guardar). Tiene buscador, contador y
// atajos para marcar o desmarcar los que se ven. "Limpiar categoría" (`onLimpiar`) quita
// todos sus productos al instante, con confirmación; los productos no se borran.
export function SelectorProductosCategoria({ productos, seleccionados, onCambiar, onLimpiar, puedeLimpiar }) {
  const [busqueda, setBusqueda] = useState('')

  const visibles = useMemo(() => {
    const texto = normalizarTexto(busqueda)
    return texto ? productos.filter((producto) => normalizarTexto(producto.nombre).includes(texto)) : productos
  }, [productos, busqueda])

  const marcados = new Set(seleccionados)

  const alternar = (id) => {
    const siguiente = new Set(marcados)
    if (siguiente.has(id)) siguiente.delete(id)
    else siguiente.add(id)
    onCambiar([...siguiente])
  }

  const marcarVisibles = (marcar) => {
    const siguiente = new Set(marcados)
    for (const producto of visibles) {
      if (marcar) siguiente.add(producto.id)
      else siguiente.delete(producto.id)
    }
    onCambiar([...siguiente])
  }

  return (
    <fieldset className="categoria-productos">
      <legend>Productos de esta categoría</legend>

      <div className="categoria-productos__barra">
        <span className="categoria-productos__contador">
          {marcados.size} de {productos.length} seleccionados
        </span>
        {puedeLimpiar && (
          <button type="button" className="categoria-productos__limpiar" onClick={onLimpiar}>
            Limpiar categoría
          </button>
        )}
      </div>

      {productos.length === 0 ? (
        <p className="texto-suave categoria-productos__vacio">Todavía no hay productos creados.</p>
      ) : (
        <>
          <input
            type="search"
            className="categoria-productos__buscar"
            placeholder="Buscar producto"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            aria-label="Buscar producto"
          />
          <div className="categoria-productos__atajos">
            <button type="button" onClick={() => marcarVisibles(true)}>
              Marcar {busqueda ? 'resultados' : 'todos'}
            </button>
            <button type="button" onClick={() => marcarVisibles(false)}>
              Desmarcar {busqueda ? 'resultados' : 'todos'}
            </button>
          </div>
          <ul className="categoria-productos__lista">
            {visibles.map((producto) => (
              <li key={producto.id}>
                <label className="categoria-productos__fila">
                  <input type="checkbox" checked={marcados.has(producto.id)} onChange={() => alternar(producto.id)} />
                  <span className="categoria-productos__nombre">{producto.nombre}</span>
                  {producto.disponible === false && <span className="categoria-productos__etiqueta">Agotado</span>}
                </label>
              </li>
            ))}
            {visibles.length === 0 && <li className="texto-suave categoria-productos__vacio">Sin resultados.</li>}
          </ul>
        </>
      )}
    </fieldset>
  )
}
