import { Interruptor } from './Interruptor'
import { IconoCategoria } from '../inicio/IconoCategoria'
import { claveIcono } from '../../lib/categoriasInicio'

// Dónde se muestra la categoría, como etiquetas cortas de la tarjeta.
function etiquetasVisibilidad(categoria) {
  const etiquetas = []
  if (categoria.visible_domicilios) etiquetas.push('Domicilios')
  if (categoria.visible_carta_fisica) etiquetas.push('Carta física')
  return etiquetas
}

// Tarjetas de categorías: tocar la tarjeta abre el formulario (editar, productos, eliminar);
// el interruptor activa o desactiva sin abrirla. Eliminar vive solo dentro del formulario
// para que no se borre una categoría por un toque accidental en la lista.
// Todas las tarjetas tienen las mismas tres líneas (nombre, cantidad, etiquetas): "Inicio" va
// en la fila de etiquetas y no junto al nombre, para que ninguna quede más alta o corrida.
export function TablaCategorias({ categorias, cantidadProductos, onEditar, onToggleActivo }) {
  if (categorias.length === 0) {
    return <p className="texto-suave admin-vacio">Todavía no hay categorías. Crea la primera.</p>
  }

  return (
    <ul className="lista-categorias-admin">
      {categorias.map((categoria) => {
        const cantidad = cantidadProductos(categoria.id)
        const icono = claveIcono(categoria.emoji_inicio)
        const visibilidad = etiquetasVisibilidad(categoria)
        return (
          <li
            key={categoria.id}
            className={`tarjeta categoria-ficha${categoria.activo ? '' : ' categoria-ficha--inactiva'}`}
          >
            <button
              type="button"
              className="categoria-ficha__abrir"
              onClick={() => onEditar(categoria)}
              aria-label={`Editar ${categoria.nombre}`}
            >
              <span className="categoria-ficha__icono" aria-hidden="true">
                {icono ? (
                  <IconoCategoria clave={icono} tamano={22} />
                ) : (
                  categoria.nombre.trim().charAt(0).toUpperCase()
                )}
              </span>
              <span className="categoria-ficha__texto">
                <span className="categoria-ficha__nombre" title={categoria.nombre}>
                  {categoria.nombre}
                </span>
                <span className="categoria-ficha__detalle">
                  {cantidad} producto{cantidad === 1 ? '' : 's'}
                </span>
                <span className="producto-admin-item__etiquetas">
                  {categoria.en_inicio && (
                    <span className="producto-admin-item__etiqueta producto-admin-item__etiqueta--resaltada">
                      ★ Inicio
                    </span>
                  )}
                  {visibilidad.length > 0 ? (
                    visibilidad.map((texto) => (
                      <span key={texto} className="producto-admin-item__etiqueta">
                        {texto}
                      </span>
                    ))
                  ) : (
                    <span className="producto-admin-item__etiqueta producto-admin-item__etiqueta--agotado">
                      Oculta en las cartas
                    </span>
                  )}
                </span>
              </span>
            </button>
            <div className="categoria-ficha__estado">
              <Interruptor
                activo={categoria.activo}
                etiqueta={categoria.activo ? 'Activa' : 'Inactiva'}
                onCambiar={(valor) => onToggleActivo(categoria.id, valor)}
              />
            </div>
          </li>
        )
      })}
    </ul>
  )
}
