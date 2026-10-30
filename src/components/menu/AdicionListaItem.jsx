import { ImagenProducto } from './ImagenProducto'
import { PrecioProducto } from '../promociones/BadgeOferta'

// Adición pedida sola en la pestaña Menú (solo si el negocio activa "Mostrar adiciones en el
// menú"). Mismo diseño que ProductoListaItem, pero sin detalle que abrir: no tiene variantes
// ni opciones, así que tocar la tarjeta o el "+" la agrega directo al carrito.
export function AdicionListaItem({ adicion, onAgregar }) {
  return (
    <article
      className="producto-lista-item"
      role="button"
      tabIndex={0}
      aria-label={`Agregar ${adicion.nombre}`}
      onClick={() => onAgregar(adicion)}
      onKeyDown={(e) => e.key === 'Enter' && onAgregar(adicion)}
    >
      <div className="producto-lista-item__imagen">
        <ImagenProducto src={adicion.imagen_url} alt={adicion.nombre} relacionAspecto="1 / 1" />
      </div>

      <div className="producto-lista-item__info">
        <strong className="producto-lista-item__nombre">{adicion.nombre}</strong>
        <span className="texto-suave producto-lista-item__categoria">Adición</span>
        <div className="producto-lista-item__pie">
          <PrecioProducto precio={adicion.precio} />
        </div>
      </div>

      <button
        type="button"
        className="boton producto-lista-item__agregar"
        aria-label={`Agregar ${adicion.nombre}`}
        onClick={(evento) => {
          evento.stopPropagation()
          onAgregar(adicion)
        }}
      >
        +
      </button>
    </article>
  )
}
