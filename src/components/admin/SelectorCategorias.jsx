// Casillas para elegir una o varias categorías (un producto puede estar en varias). Se usa
// en el formulario de producto y en la acción masiva de categorías de Productos.jsx.
export function SelectorCategorias({ categorias, seleccionadas, onCambiar, titulo = 'Categorías' }) {
  const alternar = (id) =>
    onCambiar(seleccionadas.includes(id) ? seleccionadas.filter((actual) => actual !== id) : [...seleccionadas, id])

  return (
    <fieldset className="selector-categorias">
      <legend className="selector-categorias__titulo">{titulo}</legend>
      {categorias.length === 0 ? (
        <p className="texto-suave">Todavía no hay categorías creadas.</p>
      ) : (
        <div className="selector-categorias__opciones">
          {categorias.map((categoria) => {
            const marcada = seleccionadas.includes(categoria.id)
            return (
              <label
                key={categoria.id}
                className={`selector-categorias__opcion${marcada ? ' selector-categorias__opcion--marcada' : ''}`}
              >
                <input type="checkbox" checked={marcada} onChange={() => alternar(categoria.id)} />
                <span>{categoria.nombre}</span>
                {categoria.activo === false && <span className="selector-categorias__nota">desactivada</span>}
              </label>
            )
          })}
        </div>
      )}
    </fieldset>
  )
}
