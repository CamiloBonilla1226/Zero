import { useRef, useState } from 'react'
import { precioMinimo, variantesDisponibles } from '../../lib/variantes'
import { formatoPrecio } from '../../lib/tiposOferta'
import { IconoVaso } from './iconos'
import { EncabezadoSeccion } from './EncabezadoSeccion'

// Etiqueta opcional de la tarjeta (columna productos.etiqueta, ver explicacion-script-bd.txt
// sección 19). Mientras la columna no exista ningún producto la trae y no se muestra nada.
const ETIQUETAS = {
  mas_vendido: { texto: 'Más vendido', variante: 'claro' },
  nuevo: { texto: 'Nuevo', variante: 'salvia' },
}

// Color del fondo de las tarjetas sin foto, rotando igual que los íconos de las categorías.
const ACENTOS = ['dorado', 'claro', 'salvia', 'cobre']

const precio = (valor) => formatoPrecio.format(valor).replace(/\s/g, '')

function preciosTarjeta(producto) {
  const variantes = variantesDisponibles(producto)
  if (variantes.length > 0) return { actual: `Desde ${precio(precioMinimo(variantes))}` }
  if (producto.precio_oferta != null && producto.precio_oferta < producto.precio) {
    return { actual: precio(producto.precio_oferta), anterior: precio(producto.precio) }
  }
  return { actual: precio(producto.precio) }
}

function TarjetaEsqueleto() {
  return (
    <div className="tarjeta-pedido tarjeta-pedido--cargando" aria-hidden="true">
      <span className="tarjeta-pedido__imagen" />
      <span className="esqueleto" />
      <span className="esqueleto esqueleto--corta" />
    </div>
  )
}

// "Los más pedidos" de Inicio: los productos marcados como destacados en el admin (columna
// productos.destacado, máximo 5), numerados como un top (01, 02...) en el orden en que
// llegan. Carrusel con scroll-snap nativo, sin barra de scroll, y
// rayitas de posición debajo (decorativas: el carrusel se recorre deslizando). Tocar la
// tarjeta abre el detalle; el "+" agrega directo, salvo que el producto tenga variantes
// obligatorias, en cuyo caso `onAgregar` abre el detalle (ver agregarRapido en Carta.jsx).
// Sin destacados la sección no se muestra.
export function CarruselMasPedidos({ productos, cargando, error, onReintentar, onVerTodo, onAbrirDetalle, onAgregar }) {
  const pistaRef = useRef(null)
  const [indiceActivo, setIndiceActivo] = useState(0)

  if (!cargando && !error && productos.length === 0) return null

  const alHacerScroll = () => {
    const pista = pistaRef.current
    const tarjeta = pista?.firstElementChild
    if (!tarjeta) return
    // Al final de la pista el scrollLeft nunca llega a (n - 1) * paso porque se ven varias
    // tarjetas a la vez: se fuerza la última rayita (mismo caso que CarruselDestacados).
    if (pista.scrollLeft + pista.clientWidth >= pista.scrollWidth - 1) {
      setIndiceActivo(productos.length - 1)
      return
    }
    const paso = tarjeta.getBoundingClientRect().width + (parseFloat(getComputedStyle(pista).columnGap) || 0)
    setIndiceActivo(Math.min(Math.max(Math.round(pista.scrollLeft / paso), 0), productos.length - 1))
  }

  return (
    <section className="inicio-seccion" aria-labelledby="titulo-mas-pedidos">
      <EncabezadoSeccion
        id="titulo-mas-pedidos"
        rotulo="Top de la casa"
        titulo="Los más pedidos"
        accion={
          <button type="button" className="inicio-seccion__enlace" onClick={onVerTodo}>
            Ver todo
          </button>
        }
      />

      {error ? (
        <div className="inicio-error" role="alert">
          <p>No pudimos cargar los productos.</p>
          <button type="button" className="inicio-error__boton" onClick={onReintentar}>
            Reintentar
          </button>
        </div>
      ) : (
        <>
          <div className="carrusel-pedidos__pista" ref={pistaRef} onScroll={alHacerScroll} aria-busy={cargando}>
            {cargando ? (
              <>
                <TarjetaEsqueleto />
                <TarjetaEsqueleto />
              </>
            ) : (
              productos.map((producto, indice) => {
                const etiqueta = ETIQUETAS[producto.etiqueta]
                const { actual, anterior } = preciosTarjeta(producto)
                return (
                  <article key={producto.id} className="tarjeta-pedido">
                    <button type="button" className="tarjeta-pedido__abrir" onClick={() => onAbrirDetalle(producto)}>
                      <span className={`tarjeta-pedido__imagen tarjeta-pedido__imagen--${ACENTOS[indice % ACENTOS.length]}`}>
                        {producto.imagen_url ? (
                          <img src={producto.imagen_url} alt="" width="150" height="113" loading="lazy" decoding="async" />
                        ) : (
                          <IconoVaso tamano={32} />
                        )}
                        <span className="tarjeta-pedido__puesto" aria-hidden="true">
                          {String(indice + 1).padStart(2, '0')}
                        </span>
                        {etiqueta && (
                          <span className={`tarjeta-pedido__etiqueta tarjeta-pedido__etiqueta--${etiqueta.variante}`}>
                            {etiqueta.texto}
                          </span>
                        )}
                      </span>
                      <span className="tarjeta-pedido__nombre">{producto.nombre}</span>
                      {producto.descripcion && <span className="tarjeta-pedido__descripcion">{producto.descripcion}</span>}
                    </button>
                    <div className="tarjeta-pedido__pie">
                      <span className="tarjeta-pedido__precio">
                        {anterior && (
                          <s className="tarjeta-pedido__precio-anterior">
                            <span className="visualmente-oculto">Antes </span>
                            {anterior}
                          </s>
                        )}
                        <strong>{actual}</strong>
                      </span>
                      <button
                        type="button"
                        className="tarjeta-pedido__agregar"
                        aria-label={`Agregar ${producto.nombre} al carrito`}
                        onClick={() => onAgregar(producto)}
                      >
                        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.4" fill="none" />
                        </svg>
                      </button>
                    </div>
                  </article>
                )
              })
            )}
          </div>

          {!cargando && productos.length > 1 && (
            <div className="carrusel-pedidos__rayitas" aria-hidden="true">
              {productos.map((producto, indice) => (
                <span
                  key={producto.id}
                  className={`carrusel-pedidos__rayita${indice === indiceActivo ? ' carrusel-pedidos__rayita--activa' : ''}`}
                />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  )
}
