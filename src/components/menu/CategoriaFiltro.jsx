import { useEffect, useRef } from 'react'

// `tabsExtra` permite agregar pestañas que no son categorías reales (ej. "Adiciones" en
// la carta física, ver CartaFisica.jsx), identificadas por un id propio en vez de un
// categoria.id.
export function CategoriaFiltro({ categorias, categoriaActivaId, onSeleccionar, tabsExtra = [] }) {
  const activaRef = useRef(null)

  // Cuando la categoría activa cambia sin que la persona haya tocado directamente su chip
  // (ej. al recorrer categorías con swipe en Carta.jsx), el chip activo puede quedar fuera
  // de la parte visible de esta fila con scroll horizontal. Lo traemos a la vista para que
  // siempre se pueda ver en qué categoría se está.
  useEffect(() => {
    activaRef.current?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }, [categoriaActivaId])

  return (
    <nav className="filtro-categorias" aria-label="Filtrar por categoría">
      <button
        ref={categoriaActivaId === null ? activaRef : null}
        type="button"
        className={`filtro-categorias__item ${categoriaActivaId === null ? 'filtro-categorias__item--activo' : ''}`}
        onClick={() => onSeleccionar(null)}
      >
        Todas
      </button>
      {categorias.map((categoria) => (
        <button
          key={categoria.id}
          ref={categoriaActivaId === categoria.id ? activaRef : null}
          type="button"
          className={`filtro-categorias__item ${
            categoriaActivaId === categoria.id ? 'filtro-categorias__item--activo' : ''
          }`}
          onClick={() => onSeleccionar(categoria.id)}
        >
          {categoria.nombre}
        </button>
      ))}
      {tabsExtra.map((tab) => (
        <button
          key={tab.id}
          ref={categoriaActivaId === tab.id ? activaRef : null}
          type="button"
          className={`filtro-categorias__item ${
            categoriaActivaId === tab.id ? 'filtro-categorias__item--activo' : ''
          }`}
          onClick={() => onSeleccionar(tab.id)}
        >
          {tab.etiqueta}
        </button>
      ))}
    </nav>
  )
}
