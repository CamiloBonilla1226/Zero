import { useState } from 'react'
import { AdminNav } from '../../components/admin/AdminNav'
import { EncabezadoPagina, BotonCrear } from '../../components/admin/EncabezadoPagina'
import { TablaCategorias } from '../../components/admin/TablaCategorias'
import { FormularioCategoria } from '../../components/admin/FormularioCategoria'
import { useCategorias } from '../../hooks/useCategorias'
import { useProductos } from '../../hooks/useProductos'
import { productoEnCategoria } from '../../lib/productosVisibles'
import { useSwipeParaCerrar } from '../../hooks/useSwipeParaCerrar'
import { alSoltarFondo } from '../../lib/superposicion'
import { useToast } from '../../hooks/useToast'
import { useConfirmacion } from '../../hooks/useConfirmacion'
import { mensajeAmigablePostgres } from '../../lib/erroresAmigables'
import { cantidadValida, estadoAncladas } from '../../lib/categoriasInicio'

export function Categorias() {
  const {
    categorias,
    cargando,
    error,
    crearCategoria,
    actualizarCategoria,
    eliminarCategoria,
    toggleActivo,
    asignarProductos,
    limpiarCategoria,
  } = useCategorias()
  // Todos los productos (con sus categorías), para elegir desde la categoría cuáles le pertenecen.
  const {
    productos,
    cargando: cargandoProductos,
    error: errorProductos,
    recargar: recargarProductos,
  } = useProductos()
  const idsEnCategoria = (categoriaId) =>
    productos.filter((producto) => productoEnCategoria(producto, categoriaId)).map((producto) => producto.id)

  const [categoriaEnEdicion, setCategoriaEnEdicion] = useState(null) // objeto o 'nuevo'
  const cerrarModal = () => setCategoriaEnEdicion(null)
  const swipe = useSwipeParaCerrar(cerrarModal)
  const mostrarToast = useToast()
  const confirmar = useConfirmacion()

  // Ancladas al inicio de la carta (deben ser 2 o 4 para mostrarse, ver lib/categoriasInicio.js).
  const ancladas = categorias.filter((categoria) => categoria.en_inicio)
  const ancladasOtras = ancladas.filter((categoria) => categoria.id !== categoriaEnEdicion?.id).length

  const guardarCategoria = async (datos, productoIds) => {
    const esNueva = categoriaEnEdicion === 'nuevo'
    const resultado = esNueva
      ? await crearCategoria(datos)
      : await actualizarCategoria(categoriaEnEdicion.id, datos)
    if (!resultado.exito) return resultado

    // Después de guardar la categoría se ajustan sus productos (agregar los marcados, quitar
    // los desmarcados). Si eso falla, la categoría ya quedó guardada y se avisa aparte.
    const categoriaId = esNueva ? resultado.id : categoriaEnEdicion.id
    const asignacion =
      productoIds === null
        ? { exito: true, cambios: 0 }
        : await asignarProductos(categoriaId, productoIds, esNueva ? [] : idsEnCategoria(categoriaId))
    if (asignacion.cambios > 0) await recargarProductos(true)

    setCategoriaEnEdicion(null)
    if (asignacion.exito) {
      mostrarToast(esNueva ? 'Categoría creada' : 'Categoría actualizada')
    } else {
      mostrarToast(
        `Categoría guardada, pero no se pudieron actualizar sus productos: ${mensajeAmigablePostgres(asignacion.error, 'intenta de nuevo.')}`,
        'error'
      )
    }
    return { exito: true }
  }

  const confirmarLimpiar = async () => {
    const cantidad = idsEnCategoria(categoriaEnEdicion.id).length
    const confirmado = await confirmar(
      `¿Quitar los ${cantidad} producto${cantidad === 1 ? '' : 's'} de "${categoriaEnEdicion.nombre}"? Los productos no se borran: solo dejan de estar en esta categoría.`,
      { textoConfirmar: 'Limpiar categoría' }
    )
    if (!confirmado) return { exito: false }

    const resultado = await limpiarCategoria(categoriaEnEdicion.id)
    if (resultado.exito) {
      await recargarProductos(true)
      mostrarToast(`Se quitaron ${resultado.quitados} producto${resultado.quitados === 1 ? '' : 's'} de la categoría`)
    } else {
      mostrarToast(mensajeAmigablePostgres(resultado.error, 'No se pudo limpiar la categoría.'), 'error')
    }
    return resultado
  }

  // Solo se ofrece dentro del formulario de la categoría (no en la lista), para evitar
  // borrados por un toque accidental. Si se elimina, el formulario se cierra.
  const confirmarEliminar = async () => {
    const { id, nombre } = categoriaEnEdicion
    const confirmado = await confirmar(`¿Eliminar la categoría "${nombre}"? Esta acción no se puede deshacer.`, {
      textoConfirmar: 'Eliminar categoría',
    })
    if (!confirmado) return

    const { exito, error: errorEliminar } = await eliminarCategoria(id)
    if (exito) setCategoriaEnEdicion(null)
    mostrarToast(
      exito ? 'Categoría eliminada' : mensajeAmigablePostgres(errorEliminar, 'No se pudo eliminar la categoría.'),
      exito ? 'exito' : 'error'
    )
  }

  const cambiarActivo = async (id, valor) => {
    const { exito, error: errorActualizar } = await toggleActivo(id, valor)
    mostrarToast(
      exito
        ? valor
          ? 'Categoría activada'
          : 'Categoría desactivada'
        : mensajeAmigablePostgres(errorActualizar, 'No se pudo actualizar la categoría.'),
      exito ? 'exito' : 'error'
    )
  }

  return (
    <>
      <AdminNav />
      <main className="contenedor admin-categorias">
        <EncabezadoPagina
          titulo="Categorías"
          descripcion="Ordenan la carta. Toca una para editarla y elegir sus productos."
          accion={<BotonCrear onClick={() => setCategoriaEnEdicion('nuevo')}>Nueva categoría</BotonCrear>}
        />

        {cargando && <p className="texto-suave">Cargando categorías…</p>}
        {error && <p className="campo__error">No se pudieron cargar las categorías.</p>}
        {!cargando && !error && categorias.length > 0 && (
          <p className={`estado-inicio-categorias${cantidadValida(ancladas.length) ? ' estado-inicio-categorias--ok' : ''}`}>
            <strong>Inicio de la carta:</strong> {estadoAncladas(ancladas.length)}
          </p>
        )}
        {!cargando && !error && (
          <TablaCategorias
            categorias={categorias}
            cantidadProductos={(categoriaId) => idsEnCategoria(categoriaId).length}
            onEditar={setCategoriaEnEdicion}
            onToggleActivo={cambiarActivo}
          />
        )}
      </main>

      {categoriaEnEdicion && (
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
            <h2>{categoriaEnEdicion === 'nuevo' ? 'Nueva categoría' : 'Editar categoría'}</h2>
            {cargandoProductos ? (
              <p className="texto-suave">Cargando productos…</p>
            ) : (
              // Se espera a que carguen los productos: si el formulario abriera con la lista
              // vacía, al guardar sacaría de la categoría todos sus productos.
              <FormularioCategoria
                categoriaInicial={categoriaEnEdicion === 'nuevo' ? null : categoriaEnEdicion}
                ancladasOtras={ancladasOtras}
                productos={productos}
                productosIniciales={categoriaEnEdicion === 'nuevo' ? [] : idsEnCategoria(categoriaEnEdicion.id)}
                productosNoDisponibles={Boolean(errorProductos)}
                onGuardar={guardarCategoria}
                onLimpiar={confirmarLimpiar}
                onEliminar={confirmarEliminar}
                onCancelar={() => setCategoriaEnEdicion(null)}
              />
            )}
          </div>
        </div>
      )}
    </>
  )
}
