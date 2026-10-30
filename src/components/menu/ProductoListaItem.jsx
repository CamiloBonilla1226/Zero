import { ImagenProducto } from './ImagenProducto'
import { PrecioProducto } from '../promociones/BadgeOferta'
import { precioMinimo, variantesDisponibles } from '../../lib/variantes'

const formatoPrecio = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

// Tarjeta horizontal de la pestaña Menú: tocar la tarjeta abre el detalle completo
// (OpcionesProducto); tocar "+" agrega rápido sin abrir nada, salvo que el producto tenga
// variante obligatoria, caso en el que igual hace falta elegirla (ver Carta.jsx:
// manejarSeleccionProducto).
export function ProductoListaItem({ producto, onAbrirDetalle, onAgregarRapido }) {
  const agotado = !producto.disponible
  const variantes = variantesDisponibles(producto)
  // Solo las categorías en las que el cliente puede encontrarlo en esta carta (domicilios).
  const nombresCategorias = producto.categorias
    .filter((categoria) => categoria.activo !== false && categoria.visible_domicilios !== false)
    .map((categoria) => categoria.nombre)
    .join(' · ')

  return (
    <article
      className={`producto-lista-item ${agotado ? 'producto-lista-item--agotado' : ''}`}
      role="button"
      tabIndex={0}
      onClick={() => onAbrirDetalle(producto)}
      onKeyDown={(e) => e.key === 'Enter' && onAbrirDetalle(producto)}
    >
      <div className="producto-lista-item__imagen">
        <ImagenProducto src={producto.imagen_url} alt={producto.nombre} relacionAspecto="1 / 1" />
      </div>

      <div className="producto-lista-item__info">
        <strong className="producto-lista-item__nombre">{producto.nombre}</strong>
        {nombresCategorias && (
          <span className="texto-suave producto-lista-item__categoria">{nombresCategorias}</span>
        )}
        <div className="producto-lista-item__pie">
          {variantes.length > 0 ? (
            <span className="precio-producto">Desde {formatoPrecio.format(precioMinimo(variantes))}</span>
          ) : (
            <PrecioProducto precio={producto.precio} precioOferta={producto.precio_oferta} />
          )}
          {agotado && (
            <span className="producto-lista-item__estado producto-lista-item__estado--agotado">Agotado</span>
          )}
        </div>
      </div>

      <button
        type="button"
        className="boton producto-lista-item__agregar"
        disabled={agotado}
        aria-label={`Agregar ${producto.nombre}`}
        onClick={(evento) => {
          evento.stopPropagation()
          onAgregarRapido(producto)
        }}
      >
        +
      </button>
    </article>
  )
}
