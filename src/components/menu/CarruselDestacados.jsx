import { useRef, useState } from 'react'
import { ImagenProducto } from './ImagenProducto'
import { precioMinimo, variantesDisponibles } from '../../lib/variantes'

const formatoPrecio = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

// Franja horizontal deslizable con scroll-snap nativo (sin librería de carrusel: el
// proyecto no usa ninguna todavía, y scroll-snap cubre el swipe táctil sin JS de arrastre).
// Como se ven varias tarjetas a la vez (no una por "página"), el índice activo y el scroll
// de los puntos de paginación se calculan con el ancho real de UNA tarjeta + su gap, no con
// el ancho completo de la pista (que sería el de ~3 tarjetas y desincroniza los puntos).
// Tocar la tarjeta abre el detalle del producto. Hoy solo lo usa el Carrito para sus
// recomendaciones, con "+" (`onAgregarRapido`, mismo comportamiento que el "+" del Menú); el
// Inicio tiene su propio carrusel (components/inicio/CarruselMasPedidos.jsx).
// `titulo`, `subtitulo` y `variante` (clase modificadora) cambian el encabezado.
export function CarruselDestacados({
  productos,
  onAbrirDetalle,
  onAgregarRapido,
  titulo = '¿Qué te vas a tomar hoy?',
  subtitulo = 'Más pedidos',
  variante,
}) {
  const contenedorRef = useRef(null)
  const [indiceActivo, setIndiceActivo] = useState(0)

  if (productos.length === 0) return null

  const obtenerPaso = () => {
    const contenedor = contenedorRef.current
    if (!contenedor) return 0
    const primeraTarjeta = contenedor.querySelector('.carrusel-destacados__tarjeta')
    if (!primeraTarjeta) return contenedor.clientWidth
    const gap = parseFloat(getComputedStyle(contenedor).columnGap) || 0
    return primeraTarjeta.getBoundingClientRect().width + gap
  }

  const alHacerScroll = () => {
    const contenedor = contenedorRef.current
    const paso = obtenerPaso()
    if (!contenedor || !paso) return

    // Como se ven varias tarjetas a la vez, el scroll máximo real (scrollWidth - clientWidth)
    // es menor que (cantidad - 1) * paso — nunca se llega a ese scrollLeft exacto, así que el
    // índice calculado por división nunca alcanzaba el último punto aunque la pista ya
    // estuviera pegada al final. Se detecta ese caso aparte (con 1px de margen por redondeo
    // de subpíxeles) y se fuerza el último punto.
    const alFinal = contenedor.scrollLeft + contenedor.clientWidth >= contenedor.scrollWidth - 1
    if (alFinal) {
      setIndiceActivo(productos.length - 1)
      return
    }

    const indice = Math.round(contenedor.scrollLeft / paso)
    setIndiceActivo(Math.min(Math.max(indice, 0), productos.length - 1))
  }

  const irATarjeta = (indice) => {
    const contenedor = contenedorRef.current
    const paso = obtenerPaso()
    if (!contenedor || !paso) return
    contenedor.scrollTo({ left: indice * paso, behavior: 'smooth' })
  }

  return (
    <section className={`carrusel-destacados${variante ? ` carrusel-destacados--${variante}` : ''}`}>
      <h2 className="carrusel-destacados__titulo">{titulo}</h2>
      {subtitulo && <p className="texto-suave carrusel-destacados__subtitulo">{subtitulo}</p>}
      <div className="carrusel-destacados__pista" ref={contenedorRef} onScroll={alHacerScroll}>
        {productos.map((producto) => {
          const variantes = variantesDisponibles(producto)
          return (
            <article
              key={producto.id}
              className="carrusel-destacados__tarjeta"
              role="button"
              tabIndex={0}
              onClick={() => onAbrirDetalle(producto)}
              onKeyDown={(e) => e.key === 'Enter' && onAbrirDetalle(producto)}
            >
              <div className="carrusel-destacados__imagen">
                <ImagenProducto src={producto.imagen_url} alt={producto.nombre} relacionAspecto="1 / 1" />
                {onAgregarRapido && (
                  <button
                    type="button"
                    className="carrusel-destacados__agregar"
                    aria-label={`Agregar ${producto.nombre}`}
                    onClick={(evento) => {
                      evento.stopPropagation()
                      onAgregarRapido(producto)
                    }}
                  >
                    +
                  </button>
                )}
              </div>
              <div className="carrusel-destacados__info">
                <strong className="carrusel-destacados__nombre">{producto.nombre}</strong>
                {/* Tarjeta angosta: se muestra un solo precio en una línea (sin el tachado de
                    oferta, que aquí no cabe sin desbordarse) para que todas midan igual sin
                    importar el producto. El detalle completo sí muestra precio original +
                    oferta (ver OpcionesProducto.jsx). */}
                <span className="carrusel-destacados__precio">
                  {variantes.length > 0
                    ? `Desde ${formatoPrecio.format(precioMinimo(variantes))}`
                    : formatoPrecio.format(producto.precio_oferta ?? producto.precio)}
                </span>
              </div>
            </article>
          )
        })}
      </div>

      {productos.length > 1 && (
        <div className="carrusel-destacados__puntos">
          {productos.map((producto, indice) => (
            <button
              key={producto.id}
              type="button"
              className={`carrusel-destacados__punto ${indice === Math.min(indiceActivo, productos.length - 1) ?'carrusel-destacados__punto--activo' : ''}`}
              aria-label={`Ir a la tarjeta ${indice + 1}`}
              onClick={() => irATarjeta(indice)}
            />
          ))}
        </div>
      )}
    </section>
  )
}
