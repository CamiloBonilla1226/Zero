import { useState } from 'react'
import { AdminNav } from '../../components/admin/AdminNav'
import { EncabezadoPagina, BotonCrear } from '../../components/admin/EncabezadoPagina'
import { TablaProductos } from '../../components/admin/TablaProductos'
import {
  FiltrosProductos,
  FILTROS_PRODUCTOS_INICIALES,
  aplicarFiltrosProductos,
} from '../../components/admin/FiltrosProductos'
import { FormularioProducto } from '../../components/admin/FormularioProducto'
import { FormularioCategoriasMasivo } from '../../components/admin/FormularioCategoriasMasivo'
import { AccionesMasivasProductos } from '../../components/admin/AccionesMasivasProductos'
import { useCategorias } from '../../hooks/useCategorias'
import { useProductos } from '../../hooks/useProductos'
import { useSwipeParaCerrar } from '../../hooks/useSwipeParaCerrar'
import { alSoltarFondo } from '../../lib/superposicion'
import { useToast } from '../../hooks/useToast'
import { useConfirmacion } from '../../hooks/useConfirmacion'
import { mensajeAmigablePostgres } from '../../lib/erroresAmigables'

const plural = (cantidad) => `${cantidad} producto${cantidad === 1 ? '' : 's'}`

export function Productos() {
  const { categorias } = useCategorias()
  const {
    productos,
    cargando,
    error,
    crearProducto,
    actualizarProducto,
    eliminarProducto,
    toggleDisponible,
    cambiarDisponibleVarios,
    eliminarVarios,
    agregarCategoriasVarios,
    reemplazarCategoriasVarios,
    quitarCategoriasVarios,
  } = useProductos()

  // Modal abierto: un producto (editar), 'nuevo' o 'categorias-masivo'.
  const [modal, setModal] = useState(null)
  const [filtros, setFiltrosEstado] = useState(FILTROS_PRODUCTOS_INICIALES)
  const [seleccion, setSeleccion] = useState(() => new Set())
  const [procesando, setProcesando] = useState(false)
  const productosFiltrados = aplicarFiltrosProductos(productos, filtros)
  const cerrarModal = () => setModal(null)
  const swipe = useSwipeParaCerrar(cerrarModal)
  const mostrarToast = useToast()
  const confirmar = useConfirmacion()

  // Solo cuentan los seleccionados que siguen a la vista: así una acción masiva nunca toca
  // productos que el filtro esconde o que ya se eliminaron.
  const idsSeleccionados = productosFiltrados.filter((producto) => seleccion.has(producto.id)).map((p) => p.id)
  const seleccionVisible = new Set(idsSeleccionados)

  const setFiltros = (nuevos) => {
    setFiltrosEstado(nuevos)
    setSeleccion(new Set())
  }

  const alternarSeleccion = (id) =>
    setSeleccion((actual) => {
      const nueva = new Set(actual)
      if (nueva.has(id)) nueva.delete(id)
      else nueva.add(id)
      return nueva
    })

  const guardarProducto = async (datos, variantes, categoriaIds) => {
    const esNuevo = modal === 'nuevo'
    const resultado = esNuevo
      ? await crearProducto(datos, variantes, categoriaIds)
      : await actualizarProducto(modal.id, datos, variantes, categoriaIds)

    if (resultado.exito) {
      setModal(null)
      mostrarToast(esNuevo ? 'Producto creado' : 'Producto actualizado')
    }
    return resultado
  }

  const confirmarEliminar = async (id) => {
    const confirmado = await confirmar('¿Eliminar este producto? Esta acción no se puede deshacer.')
    if (!confirmado) return

    const { exito } = await eliminarProducto(id)
    mostrarToast(exito ? 'Producto eliminado' : 'No se pudo eliminar el producto', exito ? 'exito' : 'error')
  }

  // Corre una acción masiva y avisa el resultado; si salió bien, limpia la selección.
  const ejecutarMasivo = async (accion, mensajeExito, mensajeError) => {
    setProcesando(true)
    const resultado = await accion(idsSeleccionados)
    setProcesando(false)
    mostrarToast(
      resultado.exito ? mensajeExito : mensajeAmigablePostgres(resultado.error, mensajeError),
      resultado.exito ? 'exito' : 'error'
    )
    if (resultado.exito) setSeleccion(new Set())
    return resultado
  }

  const cantidad = idsSeleccionados.length

  const activarSeleccionados = () =>
    ejecutarMasivo((ids) => cambiarDisponibleVarios(ids, true), `${plural(cantidad)} activados`, 'No se pudieron activar.')

  const desactivarSeleccionados = () =>
    ejecutarMasivo(
      (ids) => cambiarDisponibleVarios(ids, false),
      `${plural(cantidad)} desactivados`,
      'No se pudieron desactivar.'
    )

  const eliminarSeleccionados = async () => {
    const confirmado = await confirmar(`¿Eliminar ${plural(cantidad)}? Esta acción no se puede deshacer.`)
    if (!confirmado) return
    ejecutarMasivo(eliminarVarios, `${plural(cantidad)} eliminados`, 'No se pudieron eliminar.')
  }

  const aplicarCategoriasMasivo = async (modo, categoriaIds) => {
    const accion = {
      agregar: agregarCategoriasVarios,
      cambiar: reemplazarCategoriasVarios,
      quitar: quitarCategoriasVarios,
    }[modo]
    const resultado = await ejecutarMasivo(
      (ids) => accion(ids, categoriaIds),
      `Categorías actualizadas en ${plural(cantidad)}`,
      'No se pudieron cambiar las categorías.'
    )
    if (resultado.exito) setModal(null)
    return resultado
  }

  return (
    <>
      <AdminNav />
      <main className={`contenedor admin-productos${cantidad > 0 ? ' admin-productos--seleccionando' : ''}`}>
        <EncabezadoPagina
          titulo="Productos"
          descripcion="Toca un producto para editarlo. Mantén presionado uno para seleccionar varios."
          accion={<BotonCrear onClick={() => setModal('nuevo')}>Nuevo producto</BotonCrear>}
        />

        {cargando && <p className="texto-suave">Cargando productos…</p>}
        {error && <p className="campo__error">No se pudieron cargar los productos.</p>}
        {!cargando && !error && (
          <>
            <FiltrosProductos
              filtros={filtros}
              onCambiar={setFiltros}
              total={productos.length}
              mostrados={productosFiltrados.length}
              categorias={categorias}
            />
            <TablaProductos
              productos={productosFiltrados}
              seleccionados={seleccionVisible}
              onMantenerPresionado={(id) => setSeleccion((actual) => new Set(actual).add(id))}
              onAlternarSeleccion={alternarSeleccion}
              onEditar={setModal}
              onEliminar={confirmarEliminar}
              onToggleDisponible={toggleDisponible}
            />
          </>
        )}

        {cantidad > 0 && (
          <AccionesMasivasProductos
            cantidad={cantidad}
            totalVisibles={productosFiltrados.length}
            ocupado={procesando}
            onSeleccionarTodos={() => setSeleccion(new Set(productosFiltrados.map((producto) => producto.id)))}
            onLimpiar={() => setSeleccion(new Set())}
            onActivar={activarSeleccionados}
            onDesactivar={desactivarSeleccionados}
            onCategorias={() => setModal('categorias-masivo')}
            onEliminar={eliminarSeleccionados}
          />
        )}
      </main>

      {modal && (
        <div className="superposicion" role="dialog" aria-modal="true" onClick={alSoltarFondo(cerrarModal)}>
          <div
            className="superposicion__panel"
            style={swipe.estilo}
            onTouchStart={swipe.onTouchStart}
            onTouchMove={swipe.onTouchMove}
            onTouchEnd={swipe.onTouchEnd}
          >
            <button type="button" className="superposicion__cerrar-x" onClick={cerrarModal} aria-label="Cerrar">
              ×
            </button>
            {modal === 'categorias-masivo' ? (
              <>
                <h2>Categorías de {plural(cantidad)}</h2>
                <FormularioCategoriasMasivo
                  categorias={categorias}
                  cantidad={cantidad}
                  onAplicar={aplicarCategoriasMasivo}
                  onCancelar={cerrarModal}
                />
              </>
            ) : (
              <>
                <h2>{modal === 'nuevo' ? 'Nuevo producto' : 'Editar producto'}</h2>
                <FormularioProducto
                  categorias={categorias}
                  productoInicial={modal === 'nuevo' ? null : modal}
                  onGuardar={guardarProducto}
                  onCancelar={cerrarModal}
                />
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
