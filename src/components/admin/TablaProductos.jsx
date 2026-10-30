import { Interruptor } from './Interruptor'
import { ImagenProducto } from '../menu/ImagenProducto'
import { precioMinimo, variantesDisponibles } from '../../lib/variantes'
import { preciosCartaFisica, tienePrecioCartaFisica, varianteCartaFisica } from '../../lib/preciosCartaFisica'
import { useMantenerPresionado } from '../../hooks/useMantenerPresionado'

const formatoPrecio = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

// Selección para las acciones masivas de Productos.jsx: mantener presionado un producto lo
// selecciona; mientras haya al menos uno seleccionado, tocar una tarjeta la marca o desmarca
// en vez de abrir el editor (como en las apps de galería o de correo). La tarjeta conserva su
// diseño; la selección solo se ve con un borde resaltado.
export function TablaProductos({
  productos,
  seleccionados,
  onMantenerPresionado,
  onAlternarSeleccion,
  onEditar,
  onEliminar,
  onToggleDisponible,
}) {
  const presion = useMantenerPresionado(onMantenerPresionado, { ignorar: '.producto-admin-item__acciones' })

  if (productos.length === 0) {
    return <p className="texto-suave admin-vacio">No hay productos para mostrar.</p>
  }

  const modoSeleccion = seleccionados.size > 0

  return (
    <ul className="lista-productos-admin">
      {productos.map((producto) => {
        const variantes = variantesDisponibles(producto)
        const fisica = preciosCartaFisica(producto)
        const seleccionado = seleccionados.has(producto.id)
        const nombresCategorias = producto.categorias.map((categoria) => categoria.nombre).join(' · ')
        return (
          <li
            key={producto.id}
            className={`tarjeta producto-admin-item producto-admin-item--clicable${
              modoSeleccion ? ' producto-admin-item--modo-seleccion' : ''
            }${seleccionado ? ' producto-admin-item--seleccionado' : ''}`}
            aria-selected={modoSeleccion ? seleccionado : undefined}
            {...presion(producto.id)}
            onClick={() => (modoSeleccion ? onAlternarSeleccion(producto.id) : onEditar(producto))}
          >
            <div className="producto-admin-item__imagen">
              <ImagenProducto src={producto.imagen_url} alt={producto.nombre} />
              {modoSeleccion && (
                <span className="producto-admin-item__marca" aria-hidden="true">
                  {seleccionado && (
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 12.5l4 4L18 8" />
                    </svg>
                  )}
                </span>
              )}
            </div>
            <div className="producto-admin-item__info">
              <strong className="producto-admin-item__nombre" title={producto.nombre}>
                {producto.nombre}
              </strong>
              <span className="texto-suave producto-admin-item__categoria" title={nombresCategorias}>
                {nombresCategorias || 'Sin categoría'}
              </span>
              <span className="producto-admin-item__precio">
                {variantes.length > 0
                  ? `Desde ${formatoPrecio.format(precioMinimo(variantes))}`
                  : formatoPrecio.format(producto.precio_oferta ?? producto.precio)}
              </span>
              <span className="producto-admin-item__etiquetas">
                {/* Precio distinto en la carta física (ver lib/preciosCartaFisica.js). */}
                {tienePrecioCartaFisica(producto, variantes) && (
                  <span className="producto-admin-item__etiqueta">
                    Local{' '}
                    {variantes.length > 0
                      ? `desde ${formatoPrecio.format(precioMinimo(variantes.map(varianteCartaFisica)))}`
                      : formatoPrecio.format(fisica.precioOferta ?? fisica.precio)}
                  </span>
                )}
                {producto.destacado && <span className="producto-admin-item__etiqueta">★ Destacado</span>}
                {!producto.disponible && (
                  <span className="producto-admin-item__etiqueta producto-admin-item__etiqueta--agotado">
                    Agotado
                  </span>
                )}
                {/* Ligado a un sabor apagado: no sale en las cartas aunque esté disponible. */}
                {producto.disponible && producto.sabor?.disponible === false && (
                  <span className="producto-admin-item__etiqueta producto-admin-item__etiqueta--agotado">
                    Sabor {producto.sabor.nombre} apagado
                  </span>
                )}
              </span>
            </div>
            <div className="producto-admin-item__acciones" onClick={(evento) => evento.stopPropagation()}>
              <Interruptor
                activo={producto.disponible}
                onCambiar={(valor) => onToggleDisponible(producto.id, valor)}
              />
              <button type="button" className="carrito__quitar" onClick={() => onEliminar(producto.id)}>
                Eliminar
              </button>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
