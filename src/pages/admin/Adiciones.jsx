import { useState } from 'react'
import { AdminNav } from '../../components/admin/AdminNav'
import { EncabezadoPagina, BotonCrear } from '../../components/admin/EncabezadoPagina'
import { TablaAdiciones } from '../../components/admin/TablaAdiciones'
import {
  FiltrosAdiciones,
  FILTROS_ADICIONES_INICIALES,
  aplicarFiltrosAdiciones,
} from '../../components/admin/FiltrosAdiciones'
import { FormularioAdicion } from '../../components/admin/FormularioAdicion'
import { useAdiciones } from '../../hooks/useAdiciones'
import { useSwipeParaCerrar } from '../../hooks/useSwipeParaCerrar'
import { alSoltarFondo } from '../../lib/superposicion'
import { useToast } from '../../hooks/useToast'
import { useConfirmacion } from '../../hooks/useConfirmacion'
import { useNegocioConfig } from '../../hooks/useNegocioConfig'
import { useAuth } from '../../hooks/useAuth'
import { Interruptor } from '../../components/admin/Interruptor'

export function Adiciones() {
  const { adiciones, cargando, error, crearAdicion, actualizarAdicion, eliminarAdicion, toggleDisponible } =
    useAdiciones()

  const [adicionEnEdicion, setAdicionEnEdicion] = useState(null) // objeto o 'nuevo'
  const [filtros, setFiltros] = useState(FILTROS_ADICIONES_INICIALES)
  const adicionesFiltradas = aplicarFiltrosAdiciones(adiciones, filtros)
  const cerrarModal = () => setAdicionEnEdicion(null)
  const swipe = useSwipeParaCerrar(cerrarModal)
  const mostrarToast = useToast()
  const confirmar = useConfirmacion()
  // Ajuste del negocio (negocio_config.adiciones_en_menu): por RLS solo lo cambia quien puede
  // editar Negocio; los demás lo ven pero sin poder moverlo.
  const { config, cargando: cargandoConfig, guardarConfig } = useNegocioConfig()
  const { puedeNegocio } = useAuth()
  const [guardandoAjuste, setGuardandoAjuste] = useState(false)

  const cambiarAdicionesEnMenu = async (valor) => {
    setGuardandoAjuste(true)
    const { exito } = await guardarConfig({ adiciones_en_menu: valor })
    setGuardandoAjuste(false)
    mostrarToast(
      exito
        ? valor
          ? 'Las adiciones ahora se pueden pedir solas desde el menú'
          : 'Las adiciones ya no aparecen en el menú'
        : 'No se pudo guardar el ajuste',
      exito ? 'exito' : 'error'
    )
  }

  const guardarAdicion = async (datos) => {
    const esNueva = adicionEnEdicion === 'nuevo'
    const resultado = esNueva ? await crearAdicion(datos) : await actualizarAdicion(adicionEnEdicion.id, datos)

    if (resultado.exito) {
      setAdicionEnEdicion(null)
      mostrarToast(esNueva ? 'Adición creada' : 'Adición actualizada')
    }
    return resultado
  }

  const confirmarEliminar = async (id) => {
    const confirmado = await confirmar('¿Eliminar esta adición? Esta acción no se puede deshacer.')
    if (!confirmado) return

    const { exito } = await eliminarAdicion(id)
    mostrarToast(exito ? 'Adición eliminada' : 'No se pudo eliminar la adición', exito ? 'exito' : 'error')
  }

  return (
    <>
      <AdminNav />
      <main className="contenedor admin-adiciones">
        <EncabezadoPagina
          titulo="Adiciones"
          descripcion="Extras que el cliente puede sumar a sus productos."
          accion={<BotonCrear onClick={() => setAdicionEnEdicion('nuevo')}>Nueva adición</BotonCrear>}
        />

        {!cargandoConfig && config && (
          <section className="tarjeta ajuste-adiciones-menu" aria-busy={guardandoAjuste}>
            <div>
              <p className="ajuste-adiciones-menu__titulo">Mostrar adiciones en el menú</p>
              <p className="ajuste-adiciones-menu__texto">
                El cliente puede pedirlas solas desde la carta de domicilios. Siempre aparecen al final del menú.
              </p>
              {!puedeNegocio && (
                <p className="ajuste-adiciones-menu__texto">Solo quien tiene el permiso de Negocio puede cambiarlo.</p>
              )}
            </div>
            {puedeNegocio ? (
              <Interruptor
                activo={config.adiciones_en_menu === true}
                etiqueta={config.adiciones_en_menu ? 'Sí' : 'No'}
                onCambiar={(valor) => !guardandoAjuste && cambiarAdicionesEnMenu(valor)}
              />
            ) : (
              <span className="ajuste-adiciones-menu__estado">{config.adiciones_en_menu ? 'Activado' : 'Desactivado'}</span>
            )}
          </section>
        )}

        {cargando && <p className="texto-suave">Cargando adiciones…</p>}
        {error && <p className="campo__error">No se pudieron cargar las adiciones.</p>}
        {!cargando && !error && (
          <>
            <FiltrosAdiciones
              filtros={filtros}
              onCambiar={setFiltros}
              total={adiciones.length}
              mostrados={adicionesFiltradas.length}
            />
            <TablaAdiciones
              adiciones={adicionesFiltradas}
              onEditar={setAdicionEnEdicion}
              onEliminar={confirmarEliminar}
              onToggleDisponible={toggleDisponible}
            />
          </>
        )}
      </main>

      {adicionEnEdicion && (
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
            <h2>{adicionEnEdicion === 'nuevo' ? 'Nueva adición' : 'Editar adición'}</h2>
            <FormularioAdicion
              adicionInicial={adicionEnEdicion === 'nuevo' ? null : adicionEnEdicion}
              onGuardar={guardarAdicion}
              onCancelar={() => setAdicionEnEdicion(null)}
            />
          </div>
        </div>
      )}
    </>
  )
}
