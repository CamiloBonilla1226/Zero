import { useState } from 'react'
import { mensajeAmigablePostgres } from '../../lib/erroresAmigables'
import { claveIcono, ICONOS_CATEGORIA, MAX_CATEGORIAS_INICIO } from '../../lib/categoriasInicio'
import { IconoCategoria } from '../inicio/IconoCategoria'
import { SelectorProductosCategoria } from './SelectorProductosCategoria'

// `ancladasOtras`: cuántas OTRAS categorías están ancladas al inicio de la carta, para no
// dejar anclar una quinta (la base de datos también lo impide) y avisar si queda en 2 o 4.
// `productos`: todos los productos del negocio; `productosIniciales`: ids de los que ya están
// en esta categoría. Al guardar, `onGuardar(datos, idsProductos)` recibe los marcados.
// `onLimpiar` quita al instante todos los productos de la categoría (con confirmación).
export function FormularioCategoria({
  categoriaInicial,
  ancladasOtras = 0,
  productos = [],
  productosIniciales = [],
  productosNoDisponibles = false,
  onGuardar,
  onLimpiar,
  onEliminar,
  onCancelar,
}) {
  const [nombre, setNombre] = useState(categoriaInicial?.nombre ?? '')
  const [visibleDomicilios, setVisibleDomicilios] = useState(categoriaInicial?.visible_domicilios ?? true)
  const [visibleCartaFisica, setVisibleCartaFisica] = useState(categoriaInicial?.visible_carta_fisica ?? true)
  const [enInicio, setEnInicio] = useState(categoriaInicial?.en_inicio ?? false)
  // Clave del ícono (las ancladas antes con emoji se traducen al ícono equivalente).
  const [icono, setIcono] = useState(() => claveIcono(categoriaInicial?.emoji_inicio))
  const [productoIds, setProductoIds] = useState(productosIniciales)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)

  const limpiar = async () => {
    const resultado = await onLimpiar()
    if (resultado?.exito) setProductoIds([])
  }

  const sinCupo = !enInicio && ancladasOtras >= MAX_CATEGORIAS_INICIO
  const totalAncladas = ancladasOtras + (enInicio ? 1 : 0)

  const enviar = async (evento) => {
    evento.preventDefault()
    if (enInicio && !icono) {
      setError('Elige el ícono que se mostrará en el inicio de la carta.')
      return
    }
    setGuardando(true)
    setError(null)

    const resultado = await onGuardar(
      {
      nombre: nombre.trim(),
      visible_domicilios: visibleDomicilios,
      visible_carta_fisica: visibleCartaFisica,
      en_inicio: enInicio,
      // Al desanclar se conserva el ícono, por si se vuelve a anclar después. La columna se
      // llama emoji_inicio por historia: hoy guarda la clave del ícono.
      emoji_inicio: icono,
      },
      productosNoDisponibles ? null : productoIds
    )

    setGuardando(false)
    if (resultado && !resultado.exito) {
      setError(mensajeAmigablePostgres(resultado.error, 'No se pudo guardar la categoría.'))
    }
  }

  return (
    <form className="checkout" onSubmit={enviar} noValidate>
      <label className="campo">
        <span>Nombre</span>
        <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required maxLength={80} autoFocus />
      </label>

      <label className="campo campo--linea">
        <input
          type="checkbox"
          checked={visibleDomicilios}
          onChange={(e) => setVisibleDomicilios(e.target.checked)}
        />
        <span>Mostrar en carta de domicilios</span>
      </label>

      <label className="campo campo--linea">
        <input
          type="checkbox"
          checked={visibleCartaFisica}
          onChange={(e) => setVisibleCartaFisica(e.target.checked)}
        />
        <span>Mostrar en carta física</span>
      </label>

      {productosNoDisponibles ? (
        <p className="campo__error">
          No se pudieron cargar los productos: se guardará la categoría sin cambiar sus productos.
        </p>
      ) : (
        <SelectorProductosCategoria
          productos={productos}
          seleccionados={productoIds}
          onCambiar={setProductoIds}
          onLimpiar={limpiar}
          puedeLimpiar={Boolean(categoriaInicial) && productosIniciales.length > 0}
        />
      )}

      <fieldset className="categoria-inicio">
        <legend>Inicio de la carta</legend>
        <label className="campo campo--linea">
          <input
            type="checkbox"
            checked={enInicio}
            disabled={sinCupo}
            onChange={(e) => setEnInicio(e.target.checked)}
          />
          <span>Anclar en el inicio de la carta de domicilios</span>
        </label>
        <p className="texto-suave categoria-inicio__ayuda">
          {sinCupo
            ? `Ya hay ${MAX_CATEGORIAS_INICIO} categorías ancladas. Desancla una para anclar esta.`
            : `Se muestran solo si hay 2 o 4 ancladas. Con esta quedarían ${totalAncladas}.`}
        </p>

        {enInicio && (
          <div className="categoria-inicio__emoji">
            <span className="categoria-inicio__etiqueta">Ícono</span>
            <div className="selector-emoji" role="group" aria-label="Elegir ícono">
              {ICONOS_CATEGORIA.map(([clave, etiqueta]) => (
                <button
                  key={clave}
                  type="button"
                  className="selector-emoji__opcion"
                  aria-pressed={icono === clave}
                  aria-label={etiqueta}
                  title={etiqueta}
                  onClick={() => {
                    setIcono(clave)
                    setError(null)
                  }}
                >
                  <IconoCategoria clave={clave} tamano={22} />
                </button>
              ))}
            </div>
          </div>
        )}
      </fieldset>

      {error && <p className="campo__error">{error}</p>}

      <div className="opciones-producto__acciones">
        <button type="button" className="boton boton--secundario" onClick={onCancelar}>
          Cancelar
        </button>
        <button type="submit" className="boton" disabled={guardando}>
          {guardando ? 'Guardando…' : 'Guardar'}
        </button>
      </div>

      {categoriaInicial && onEliminar && (
        <section className="zona-peligro" aria-label="Eliminar categoría">
          <div>
            <p className="zona-peligro__titulo">Eliminar categoría</p>
            <p className="zona-peligro__texto">
              Solo se puede eliminar si no tiene productos. Si solo quieres ocultarla, desactívala.
            </p>
          </div>
          <button type="button" className="zona-peligro__boton" onClick={onEliminar} disabled={guardando}>
            Eliminar categoría
          </button>
        </section>
      )}
    </form>
  )
}
