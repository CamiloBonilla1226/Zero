import { useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { HeaderNegocio } from '../components/layout/HeaderNegocio'
import { NavInferior } from '../components/layout/NavInferior'
import { Inicio } from './Inicio'
import { BuscadorProductos } from '../components/menu/BuscadorProductos'
import { ProductoListaItem } from '../components/menu/ProductoListaItem'
import { AdicionListaItem } from '../components/menu/AdicionListaItem'
import { CategoriaFiltro } from '../components/menu/CategoriaFiltro'
import { OpcionesProducto } from '../components/menu/OpcionesProducto'
import { Carrito } from '../components/carrito/Carrito'
import { Checkout } from '../components/carrito/Checkout'
import { useCategorias } from '../hooks/useCategorias'
import { useProductos } from '../hooks/useProductos'
import { useAdiciones } from '../hooks/useAdiciones'
import { useSabores } from '../hooks/useSabores'
import { useOfertas } from '../hooks/useOfertas'
import { useNegocioConfig } from '../hooks/useNegocioConfig'
import { useCarrito } from '../hooks/useCarrito'
import { useToast } from '../hooks/useToast'
import { useSwipeNavegacion } from '../hooks/useSwipeNavegacion'
import { useCerrarConAtras } from '../hooks/useCerrarConAtras'
import { useSeccionesConHistorial } from '../hooks/useSeccionesConHistorial'
import { alSoltarFondo } from '../lib/superposicion'
import {
  categoriasConProductos,
  filtrarProductosVisibles,
  productoEnCategoria,
  productosDestacados,
  productosRecomendados,
} from '../lib/productosVisibles'
import { variantesDisponibles } from '../lib/variantes'
import { pideSabores } from '../lib/sabores'
import { categoriasDeInicio } from '../lib/categoriasInicio'
import { normalizarTexto } from '../lib/texto'

// Pestaña "Adiciones" del filtro del Menú: no es una categoría real, va siempre de última.
const SECCION_ADICIONES = '__adiciones__'

export function Carta() {
  // 'inicio' | 'menu' | 'carrito' | 'checkout'. Cada cambio queda en el historial del navegador,
  // así "atrás" del celular recorre las secciones antes de salir de la página.
  const [seccion, setSeccion] = useSeccionesConHistorial()
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null)
  const [busqueda, setBusqueda] = useState('')
  const [productoSeleccionado, setProductoSeleccionado] = useState(null)
  // Línea del carrito que se está modificando en el detalle (null = agregar uno nuevo).
  const [itemEditando, setItemEditando] = useState(null)

  // Al cambiar de sección o de categoría el alto de la página cambia de golpe (ej. de la
  // lista larga del Menú a Inicio). Si se conservaba el scroll, la página quedaba desplazada
  // más allá de su nuevo final y en iPhone (WebKit) el nav inferior fijo se quedaba pegado a
  // mitad de pantalla con espacio en blanco debajo. Se vuelve arriba antes de pintar.
  useLayoutEffect(() => {
    window.scrollTo(0, 0)
  }, [seccion, categoriaSeleccionada])

  // Las secciones viven en el historial (useSeccionesConHistorial): con la restauración
  // automática, "atrás" reaplicaba el scroll guardado de otra sección sobre una página más
  // corta y provocaba el mismo problema. Mientras la carta está montada, el scroll lo maneja
  // el efecto de arriba.
  useEffect(() => {
    const anterior = window.history.scrollRestoration
    window.history.scrollRestoration = 'manual'
    return () => {
      window.history.scrollRestoration = anterior
    }
  }, [])

  const {
    categorias: categoriasCargadas,
    cargando: cargandoCategorias,
    error: errorCategorias,
    recargar: recargarCategorias,
  } = useCategorias({
    soloActivas: true,
    soloVisibleDomicilios: true,
  })
  const {
    productos: productosCargados,
    cargando: cargandoProductos,
    error: errorProductos,
    recargar: recargarProductos,
  } = useProductos({ soloDisponibles: true, soloVisibleDomicilios: true })
  const productosVisibles = useMemo(
    () => filtrarProductosVisibles(productosCargados, 'visible_domicilios'),
    [productosCargados]
  )
  // Solo las categorías con productos: ni el filtro ni el swipe del Menú pasan por una vacía.
  const categorias = useMemo(
    () => categoriasConProductos(categoriasCargadas, productosVisibles),
    [categoriasCargadas, productosVisibles]
  )
  const destacados = useMemo(() => productosDestacados(productosVisibles), [productosVisibles])

  const productosMenu = useMemo(() => {
    const textoBuscado = normalizarTexto(busqueda)
    return productosVisibles.filter((producto) => {
      const coincideCategoria = !categoriaSeleccionada || productoEnCategoria(producto, categoriaSeleccionada)
      const coincideBusqueda = !textoBuscado || normalizarTexto(producto.nombre).includes(textoBuscado)
      return coincideCategoria && coincideBusqueda
    })
  }, [productosVisibles, categoriaSeleccionada, busqueda])

  const { adiciones } = useAdiciones({ soloDisponibles: true, soloVisibleDomicilios: true })
  // Solo los sabores prendidos hoy (Admin → Sabores); un negocio sin sabores recibe [] y nada cambia.
  const { sabores } = useSabores({ soloDisponibles: true })
  // Si el negocio lo activa (Admin → Adiciones), las adiciones también se pueden pedir solas
  // desde el Menú: pestaña "Adiciones" al final del filtro y, en "Todas", al final de la lista.
  const { config: configNegocio } = useNegocioConfig()
  const adicionesEnMenu = configNegocio?.adiciones_en_menu === true && adiciones.length > 0
  const adicionesMenu = useMemo(() => {
    if (!adicionesEnMenu) return []
    if (categoriaSeleccionada !== null && categoriaSeleccionada !== SECCION_ADICIONES) return []
    const textoBuscado = normalizarTexto(busqueda)
    return adiciones.filter((adicion) => !textoBuscado || normalizarTexto(adicion.nombre).includes(textoBuscado))
  }, [adicionesEnMenu, adiciones, categoriaSeleccionada, busqueda])
  // Solo hay una oferta activa: se muestra en la tarjeta de Inicio y es la única que aplica su
  // comportamiento (barra del carrito, línea en WhatsApp). Sin oferta activa no hay barra.
  const { ofertaActiva } = useOfertas({ soloActivas: true })
  const ofertas = useMemo(() => (ofertaActiva ? [ofertaActiva] : []), [ofertaActiva])

  // "Atrás" del celular cierra el detalle del producto en vez de salir de la página.
  useCerrarConAtras(Boolean(productoSeleccionado), () => {
    setProductoSeleccionado(null)
    setItemEditando(null)
  })

  const carrito = useCarrito()
  const mostrarToast = useToast()
  const recomendados = useMemo(
    () => productosRecomendados(productosVisibles, carrito.items),
    [productosVisibles, carrito.items]
  )

  // "Todas" (categoriaSeleccionada === null) cuenta como la primera posición, igual que ya
  // se ve en CategoriaFiltro. El swipe en Menú recorre esta lista antes de cambiar de
  // sección: solo pasa a Carrito/Inicio cuando ya está en el último/primer extremo.
  const categoriasConTodas = useMemo(
    () => [null, ...categorias.map((c) => c.id), ...(adicionesEnMenu ? [SECCION_ADICIONES] : [])],
    [categorias, adicionesEnMenu]
  )
  const indiceCategoria = categoriasConTodas.indexOf(categoriaSeleccionada)

  const swipe = useSwipeNavegacion({
    onSwipeIzquierda: ({ enNav } = {}) => {
      // Un swipe que arranca sobre el nav inferior cambia de sección directo, incluso en
      // Menú: el dedo ya tocó el control de navegación, no el contenido, así que no tiene
      // sentido recorrer categorías primero.
      if (enNav) {
        if (seccion === 'inicio') setSeccion('menu')
        else if (seccion === 'menu') setSeccion('carrito')
        return
      }
      if (seccion === 'inicio') {
        setSeccion('menu')
      } else if (seccion === 'menu') {
        if (indiceCategoria < categoriasConTodas.length - 1) {
          setCategoriaSeleccionada(categoriasConTodas[indiceCategoria + 1])
        } else {
          setSeccion('carrito')
        }
      }
    },
    onSwipeDerecha: ({ enNav } = {}) => {
      if (enNav) {
        if (seccion === 'carrito') setSeccion('menu')
        else if (seccion === 'menu') setSeccion('inicio')
        return
      }
      if (seccion === 'carrito') {
        setSeccion('menu')
      } else if (seccion === 'menu') {
        if (indiceCategoria > 0) {
          setCategoriaSeleccionada(categoriasConTodas[indiceCategoria - 1])
        } else {
          setSeccion('inicio')
        }
      }
    },
  })

  // Las adiciones son extras opcionales (ver useAdiciones): que el negocio tenga adiciones
  // configuradas no debe forzar el modal de "+" rápido. Solo la variante y los sabores son
  // obligatorios (un producto sin variantes también puede pedir sabores), así
  // que solo ella determina si hace falta abrir el detalle antes de poder agregar.
  const agregarRapido = (producto) => {
    if (variantesDisponibles(producto).length > 0 || pideSabores(producto)) {
      setProductoSeleccionado(producto)
    } else {
      carrito.agregarProducto(producto, [], 1)
      mostrarToast('Agregado al carrito')
    }
  }

  const agregarAdicion = (adicion) => {
    carrito.agregarAdicion(adicion)
    mostrarToast('Agregado al carrito')
  }

  // Tocar una línea del carrito abre el mismo detalle del producto con lo que eligió el cliente
  // (variante, adiciones, cantidad) para modificarlo. Si el producto ya no está en la carta
  // (agotado u oculto después de agregarlo), la línea no se puede editar.
  const editarItemCarrito = (item) => {
    const producto = productosVisibles.find((p) => p.id === item.productoId)
    if (!producto) return
    setItemEditando(item)
    setProductoSeleccionado(producto)
  }

  // Desde Inicio (oferta, "Ver todo", una categoría): abre el Menú con esa categoría (o todas)
  // y sin búsqueda previa, para que se vea exactamente lo que se tocó.
  const irAlMenu = (categoriaId = null) => {
    setCategoriaSeleccionada(categoriaId)
    setBusqueda('')
    setSeccion('menu')
  }

  const cerrarDetalle = () => {
    setProductoSeleccionado(null)
    setItemEditando(null)
  }

  const confirmarOpciones = (cantidad, opcionesElegidas, variante, saboresElegidos) => {
    if (itemEditando) {
      carrito.reemplazarItem(itemEditando.itemId, productoSeleccionado, opcionesElegidas, cantidad, variante, saboresElegidos)
      mostrarToast('Producto actualizado')
    } else {
      carrito.agregarProducto(productoSeleccionado, opcionesElegidas, cantidad, variante, saboresElegidos)
      mostrarToast('Agregado al carrito')
    }
    cerrarDetalle()
  }

  return (
    <>
      {/* El swipe se escucha en este contenedor, que ocupa toda la pantalla (encabezado,
          contenido, espacio vacío debajo de una lista corta y nav inferior): el gesto debe
          funcionar en cualquier parte. Si solo cubriera el contenido, en una categoría con
          pocos productos el dedo caía en el vacío de abajo y el swipe no hacía nada. */}
      <div
        className={`carta-zona-swipe${seccion === 'inicio' ? ' carta-zona-swipe--inicio' : ''}`}
        onTouchStart={swipe.onTouchStart}
        onTouchEnd={swipe.onTouchEnd}
      >
      {/* En Inicio el estado ya lo muestra la portada, con más detalle. */}
      <HeaderNegocio mostrarEstado={seccion !== 'inicio'} />

      <main className="contenedor pagina-carta pagina-carta--tabs">
        <section hidden={seccion !== 'inicio'} className="seccion-inicio">
          <Inicio
            ofertaActiva={ofertaActiva}
            destacados={destacados}
            categorias={categoriasDeInicio(categorias)}
            cargandoProductos={cargandoProductos}
            errorProductos={errorProductos}
            cargandoCategorias={cargandoCategorias}
            errorCategorias={errorCategorias}
            onReintentarProductos={() => recargarProductos()}
            onReintentarCategorias={() => recargarCategorias()}
            onIrAlMenu={irAlMenu}
            onAbrirDetalle={setProductoSeleccionado}
            onAgregar={agregarRapido}
          />
        </section>

        <section hidden={seccion !== 'menu'} className="seccion-menu">
          <BuscadorProductos valor={busqueda} onCambiar={setBusqueda} />

          {errorCategorias && <p className="campo__error">No se pudieron cargar las categorías.</p>}
          {!cargandoCategorias && categorias.length > 0 && (
            <CategoriaFiltro
              categorias={categorias}
              categoriaActivaId={categoriaSeleccionada}
              onSeleccionar={setCategoriaSeleccionada}
              tabsExtra={adicionesEnMenu ? [{ id: SECCION_ADICIONES, etiqueta: 'Adiciones' }] : []}
            />
          )}

          {cargandoProductos && <p className="texto-suave">Cargando productos…</p>}
          {errorProductos && <p className="campo__error">No se pudieron cargar los productos. Intenta de nuevo.</p>}
          {!cargandoProductos && !errorProductos && productosMenu.length === 0 && adicionesMenu.length === 0 && (
            <p className="texto-suave">No hay productos que coincidan con la búsqueda.</p>
          )}

          <div className="lista-productos-menu">
            {productosMenu.map((producto) => (
              <ProductoListaItem
                key={producto.id}
                producto={producto}
                onAbrirDetalle={setProductoSeleccionado}
                onAgregarRapido={agregarRapido}
              />
            ))}
          </div>

          {!cargandoProductos && adicionesMenu.length > 0 && (
            <div className="menu-adiciones">
              {categoriaSeleccionada === null && <h2 className="menu-adiciones__titulo">Adiciones</h2>}
              <div className="lista-productos-menu">
                {adicionesMenu.map((adicion) => (
                  <AdicionListaItem key={adicion.id} adicion={adicion} onAgregar={agregarAdicion} />
                ))}
              </div>
            </div>
          )}
        </section>

        <section hidden={seccion !== 'carrito'} className="seccion-carrito">
          <Carrito
            items={carrito.items}
            total={carrito.total}
            ofertas={ofertas}
            recomendados={recomendados}
            onQuitar={carrito.quitarItem}
            onCambiarCantidad={carrito.cambiarCantidad}
            onIrACheckout={() => setSeccion('checkout')}
            onAbrirDetalle={setProductoSeleccionado}
            onAgregarRapido={agregarRapido}
            onEditarItem={editarItemCarrito}
            puedeEditar={(item) => productosVisibles.some((p) => p.id === item.productoId)}
            onVerMenu={() => setSeccion('menu')}
          />
        </section>

        {seccion === 'checkout' && (
          <section className="seccion-checkout">
            <Checkout
              items={carrito.items}
              total={carrito.total}
              ofertas={ofertas}
              onPedidoConfirmado={() => {
                carrito.vaciarCarrito()
                setSeccion('inicio', { reemplazar: true })
              }}
            />
          </section>
        )}
      </main>

      <NavInferior
        seccionActiva={seccion === 'checkout' ? 'carrito' : seccion}
        onCambiarSeccion={(nueva) => setSeccion(nueva)}
        cantidadTotal={carrito.cantidadTotal}
      />
      </div>

      {productoSeleccionado && (
        <div
          className="superposicion"
          role="dialog"
          aria-modal="true"
          onClick={alSoltarFondo(cerrarDetalle)}
        >
          <OpcionesProducto
            key={itemEditando?.itemId ?? productoSeleccionado.id}
            producto={productoSeleccionado}
            adiciones={adiciones}
            sabores={sabores}
            itemInicial={itemEditando}
            onConfirmar={confirmarOpciones}
            onCancelar={cerrarDetalle}
          />
        </div>
      )}
    </>
  )
}
