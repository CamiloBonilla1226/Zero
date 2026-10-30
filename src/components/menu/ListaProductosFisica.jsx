import { ImagenProducto } from './ImagenProducto'
import { PrecioProducto } from '../promociones/BadgeOferta'
import { precioMinimo, variantesDisponibles } from '../../lib/variantes'
import { preciosCartaFisica, varianteCartaFisica } from '../../lib/preciosCartaFisica'

const formatoPrecio = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

// Productos de la carta física, como en una carta impresa: foto pequeña | nombre y
// descripción corta (máximo dos líneas) | precio en su propia columna a la derecha, para
// que todos los precios se lean en la misma línea vertical. Si el producto tiene variantes,
// el precio dice "Desde" y debajo del nombre se indica cuántas opciones tiene. Toda la fila
// abre el detalle. Los precios son los de la carta física (ver lib/preciosCartaFisica.js).
export function ListaProductosFisica({ productos, onSeleccionar }) {
  if (productos.length === 0) return null

  return (
    <ul className="productos-fisica">
      {productos.map((producto) => {
        const variantes = variantesDisponibles(producto).map(varianteCartaFisica)
        const { precio, precioOferta } = preciosCartaFisica(producto)
        return (
          <li key={producto.id}>
            <button type="button" className="producto-fisica" onClick={() => onSeleccionar(producto)}>
              <span className="producto-fisica__imagen">
                <ImagenProducto src={producto.imagen_url} alt="" relacionAspecto="1 / 1" />
              </span>
              <span className="producto-fisica__info">
                <span className="producto-fisica__nombre">{producto.nombre}</span>
                {producto.descripcion && <span className="producto-fisica__descripcion">{producto.descripcion}</span>}
                {variantes.length > 1 && <span className="producto-fisica__meta">{variantes.length} opciones</span>}
              </span>
              <span className="producto-fisica__precio">
                {variantes.length > 0 ? (
                  <>
                    <span className="producto-fisica__desde">Desde</span>
                    <span className="precio-producto">{formatoPrecio.format(precioMinimo(variantes))}</span>
                  </>
                ) : (
                  <PrecioProducto precio={precio} precioOferta={precioOferta} />
                )}
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
