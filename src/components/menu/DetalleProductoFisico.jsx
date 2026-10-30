import { ImagenProducto } from './ImagenProducto'
import { PrecioProducto } from '../promociones/BadgeOferta'
import { useSwipeParaCerrar } from '../../hooks/useSwipeParaCerrar'
import { useVariantesProducto } from '../../hooks/useVariantesProducto'
import { precioMinimo } from '../../lib/variantes'
import { preciosCartaFisica, varianteCartaFisica } from '../../lib/preciosCartaFisica'

const formatoPrecio = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

// Bloque de precios del detalle: título en versalitas, una nota corta que explica cómo se
// lee el precio (final o "se suma") y las filas nombre | precio alineadas a la derecha.
function ListaPrecios({ titulo, nota, filas }) {
  if (filas.length === 0) return null
  return (
    <section className="detalle-fisico__bloque">
      <div className="detalle-fisico__bloque-encabezado">
        <h3 className="detalle-fisico__bloque-titulo">{titulo}</h3>
        <span className="detalle-fisico__bloque-nota">{nota}</span>
      </div>
      <ul className="detalle-fisico__lista">
        {filas.map((fila) => (
          <li key={fila.id}>
            <span className="detalle-fisico__fila-texto">
              <span>{fila.nombre}</span>
              {fila.detalle && <span className="detalle-fisico__fila-detalle">{fila.detalle}</span>}
            </span>
            <span className={fila.suave ? 'texto-suave' : undefined}>{fila.precio}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

// Detalle de un producto en la carta física: solo lectura, sin cantidad ni botón de agregar
// (esa carta no tiene carrito). Foto, nombre, descripción y precio del local; debajo, las
// variantes con su precio (es el precio final, no un extra) y las adiciones disponibles
// (esas sí se suman: "+ $X"). Precios de la carta física, ver lib/preciosCartaFisica.js.
// Cada variante muestra lo que trae y cuántos sabores lleva; si el producto pide sabores, un
// bloque con los sabores disponibles hoy (sin precio: no lo cambian, ver lib/sabores.js).
function detalleVariante(variante) {
  const sabores = variante.cantidad_sabores ?? 0
  const textoSabores = sabores > 0 ? `${sabores} ${sabores === 1 ? 'sabor' : 'sabores'}` : null
  return [variante.descripcion, textoSabores].filter(Boolean).join(' · ') || null
}

export function DetalleProductoFisico({ producto, adiciones, sabores = [], onCerrar }) {
  const swipe = useSwipeParaCerrar(onCerrar)
  const { variantes: variantesBase } = useVariantesProducto(producto.id, { soloDisponibles: true })
  const variantes = variantesBase.map(varianteCartaFisica)
  const { precio, precioOferta } = preciosCartaFisica(producto)
  const pideSabores = (producto.cantidad_sabores ?? 0) > 0 || variantes.some((v) => (v.cantidad_sabores ?? 0) > 0)

  return (
    <div
      className="opciones-producto detalle-fisico"
      style={swipe.estilo}
      onTouchStart={swipe.onTouchStart}
      onTouchMove={swipe.onTouchMove}
      onTouchEnd={swipe.onTouchEnd}
    >
      <ImagenProducto src={producto.imagen_url} alt={producto.nombre} relacionAspecto="4 / 3" prioridad />

      <div className="opciones-producto__contenido detalle-fisico__contenido">
        <div className="detalle-fisico__intro">
          <h2 className="opciones-producto__nombre">{producto.nombre}</h2>
          {producto.descripcion && <p className="texto-suave detalle-fisico__descripcion">{producto.descripcion}</p>}
          <div className="detalle-fisico__precio">
            {variantes.length > 0 ? (
              <span className="precio-producto">
                <span className="detalle-fisico__desde">Desde</span>
                {formatoPrecio.format(precioMinimo(variantes))}
              </span>
            ) : (
              <PrecioProducto precio={precio} precioOferta={precioOferta} />
            )}
          </div>
        </div>

        <ListaPrecios
          titulo="Opciones"
          nota="Precio final"
          filas={variantes.map((v) => ({
            id: v.id,
            nombre: v.nombre,
            detalle: detalleVariante(v),
            precio: formatoPrecio.format(v.precio),
          }))}
        />
        {pideSabores && (
          <ListaPrecios
            titulo="Sabores"
            nota={
              producto.cantidad_sabores > 0 && variantes.length === 0
                ? `Elige ${producto.cantidad_sabores}`
                : 'Disponibles hoy'
            }
            filas={sabores.map((s) => ({ id: s.id, nombre: s.nombre, detalle: s.descripcion, precio: '' }))}
          />
        )}
        <ListaPrecios
          titulo="Adiciones"
          nota="Se suman al precio"
          filas={adiciones.map((a) => ({
            id: a.id,
            nombre: a.nombre,
            precio: a.precio > 0 ? `+ ${formatoPrecio.format(a.precio)}` : 'Sin costo',
            suave: true,
          }))}
        />

        <div className="opciones-producto__acciones">
          <button type="button" className="boton boton--secundario" onClick={onCerrar}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
