import { ImagenProducto } from './ImagenProducto'
import { PrecioProducto } from '../promociones/BadgeOferta'
import { precioMinimo, variantesDisponibles } from '../../lib/variantes'

const formatoPrecio = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

export function ProductoCard({ producto, interactivo, onSeleccionar }) {
  const agotado = !producto.disponible
  const variantes = variantesDisponibles(producto)

  return (
    <article className={`tarjeta producto-card ${agotado ? 'producto-card--agotado' : ''}`}>
      <ImagenProducto src={producto.imagen_url} alt={producto.nombre} relacionAspecto="4 / 3" />
      <div className="producto-card__contenido">
        <div className="producto-card__encabezado">
          <h3 className="producto-card__nombre">{producto.nombre}</h3>
          {agotado && <span className="producto-card__agotado">Agotado</span>}
        </div>
        {producto.descripcion && <p className="texto-suave producto-card__descripcion">{producto.descripcion}</p>}
        <div className="producto-card__pie">
          {variantes.length > 0 ? (
            <span className="precio-producto">Desde {formatoPrecio.format(precioMinimo(variantes))}</span>
          ) : (
            <PrecioProducto precio={producto.precio} precioOferta={producto.precio_oferta} />
          )}
          {interactivo && (
            <button
              type="button"
              className="boton boton--pequeno"
              disabled={agotado}
              onClick={() => onSeleccionar(producto)}
            >
              Agregar
            </button>
          )}
        </div>
      </div>
    </article>
  )
}
