import { negocioConfig } from '../config/negocio.config'
import { TarjetaOferta } from '../components/layout/TarjetaOferta'
import { SobreNosotros } from '../components/layout/SobreNosotros'
import { CarruselMasPedidos } from '../components/inicio/CarruselMasPedidos'
import { CategoriasInicio } from '../components/inicio/CategoriasInicio'
import { PasosPedido } from '../components/inicio/PasosPedido'
import { BotonWhatsapp } from '../components/inicio/BotonWhatsapp'
import { Portada } from '../components/inicio/Portada'
import { montoDomicilioGratis } from '../lib/tiposOferta'
import { useNegocioConfig } from '../hooks/useNegocioConfig'

// Sección Inicio de la carta de domicilios. Vive dentro de Carta.jsx (no es una ruta propia)
// porque comparte con Menú y Carrito el carrito, la nav inferior, el detalle del producto y
// el filtro de categorías: Carta le pasa los datos ya cargados y las acciones.
// `onIrAlMenu(categoriaId?)` abre el Menú, filtrado por esa categoría si se indica.
export function Inicio({
  ofertaActiva,
  destacados,
  categorias,
  cargandoProductos,
  errorProductos,
  cargandoCategorias,
  errorCategorias,
  onReintentarProductos,
  onReintentarCategorias,
  onIrAlMenu,
  onAbrirDetalle,
  onAgregar,
}) {
  // Frase grande de la portada: la que el dueño escribe en /admin/negocio ("Frase de inicio",
  // columna negocio_config.descripcion). Sin frase guardada (o si falla la carga) se usa la de
  // negocio.config.js. Mientras carga el espacio queda reservado para que nada salte.
  const { config, cargando: cargandoConfig } = useNegocioConfig()
  const lema = config?.descripcion?.trim() || negocioConfig.lema

  return (
    <div className="inicio">
      <Portada lema={lema} cargandoLema={cargandoConfig} horario={config?.horario} />

      <TarjetaOferta oferta={ofertaActiva} onClick={() => onIrAlMenu()} />

      <CarruselMasPedidos
        productos={destacados}
        cargando={cargandoProductos}
        error={errorProductos}
        onReintentar={onReintentarProductos}
        onVerTodo={() => onIrAlMenu()}
        onAbrirDetalle={onAbrirDetalle}
        onAgregar={onAgregar}
      />

      {/* Las categorías visibles dependen también de los productos (solo las que tienen
          alguno), así que se esperan ambas cargas. Si fallaron los productos, el error ya
          se muestra en el carrusel y esta sección queda oculta. */}
      <CategoriasInicio
        categorias={categorias}
        cargando={cargandoCategorias || cargandoProductos}
        error={errorCategorias}
        onReintentar={onReintentarCategorias}
        onSeleccionar={(categoriaId) => onIrAlMenu(categoriaId)}
      />

      <PasosPedido montoDomicilioGratis={montoDomicilioGratis(ofertaActiva)} />

      {/* Cierre de la página: datos del local y el contacto directo, en un mismo bloque. */}
      <div className="inicio-cierre">
        <SobreNosotros />
        <BotonWhatsapp />
      </div>
    </div>
  )
}
