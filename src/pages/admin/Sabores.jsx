import { useState } from 'react'
import { AdminNav } from '../../components/admin/AdminNav'
import { EncabezadoPagina, BotonCrear } from '../../components/admin/EncabezadoPagina'
import { TablaSabores } from '../../components/admin/TablaSabores'
import { FormularioSabor } from '../../components/admin/FormularioSabor'
import { useSabores } from '../../hooks/useSabores'
import { useSwipeParaCerrar } from '../../hooks/useSwipeParaCerrar'
import { alSoltarFondo } from '../../lib/superposicion'
import { useToast } from '../../hooks/useToast'
import { useConfirmacion } from '../../hooks/useConfirmacion'
import { mensajeAmigablePostgres } from '../../lib/erroresAmigables'

// Catálogo de sabores del negocio (ver useSabores.js). El uso diario es prender y apagar los
// sabores que hay hoy; cuántos se eligen se configura en cada producto o variante.
export function Sabores() {
  const { sabores, cargando, error, crearSabor, actualizarSabor, eliminarSabor, toggleDisponible } = useSabores()

  const [saborEnEdicion, setSaborEnEdicion] = useState(null) // objeto o 'nuevo'
  const cerrarModal = () => setSaborEnEdicion(null)
  const swipe = useSwipeParaCerrar(cerrarModal)
  const mostrarToast = useToast()
  const confirmar = useConfirmacion()
  const disponibles = sabores.filter((sabor) => sabor.disponible).length

  const guardarSabor = async (datos) => {
    const esNuevo = saborEnEdicion === 'nuevo'
    const resultado = esNuevo ? await crearSabor(datos) : await actualizarSabor(saborEnEdicion.id, datos)

    if (resultado.exito) {
      setSaborEnEdicion(null)
      mostrarToast(esNuevo ? 'Sabor creado' : 'Sabor actualizado')
    }
    return resultado
  }

  const cambiarDisponible = async (id, valor) => {
    const { exito, error: errorCambio } = await toggleDisponible(id, valor)
    if (!exito) mostrarToast(mensajeAmigablePostgres(errorCambio, 'No se pudo cambiar el sabor.'), 'error')
  }

  const confirmarEliminar = async (id) => {
    const confirmado = await confirmar(
      '¿Eliminar este sabor? Si solo se acabó por hoy, mejor apágalo con el interruptor.'
    )
    if (!confirmado) return

    const { exito } = await eliminarSabor(id)
    mostrarToast(exito ? 'Sabor eliminado' : 'No se pudo eliminar el sabor', exito ? 'exito' : 'error')
  }

  return (
    <>
      <AdminNav />
      <main className="contenedor admin-adiciones">
        <EncabezadoPagina
          titulo="Sabores"
          descripcion="Prende los sabores que hay hoy. Cuántos se eligen se configura en cada producto o tamaño."
          accion={<BotonCrear onClick={() => setSaborEnEdicion('nuevo')}>Nuevo sabor</BotonCrear>}
        />

        {cargando && <p className="texto-suave">Cargando sabores…</p>}
        {error && <p className="campo__error">No se pudieron cargar los sabores.</p>}
        {!cargando && !error && (
          <>
            {sabores.length > 0 && (
              <p className="texto-suave">
                {disponibles} de {sabores.length} disponibles hoy
              </p>
            )}
            <TablaSabores
              sabores={sabores}
              onEditar={setSaborEnEdicion}
              onEliminar={confirmarEliminar}
              onToggleDisponible={cambiarDisponible}
            />
          </>
        )}
      </main>

      {saborEnEdicion && (
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
            <h2>{saborEnEdicion === 'nuevo' ? 'Nuevo sabor' : 'Editar sabor'}</h2>
            <FormularioSabor
              saborInicial={saborEnEdicion === 'nuevo' ? null : saborEnEdicion}
              onGuardar={guardarSabor}
              onCancelar={cerrarModal}
            />
          </div>
        </div>
      )}
    </>
  )
}
