import { useMemo, useState } from 'react'
import { ImagenProducto } from './ImagenProducto'
import { ListaAdiciones } from './ListaAdiciones'
import { SelectorSabores } from './SelectorSabores'
import { PrecioProducto } from '../promociones/BadgeOferta'
import { useSwipeParaCerrar } from '../../hooks/useSwipeParaCerrar'
import { useVariantesProducto } from '../../hooks/useVariantesProducto'
import { precioMinimo } from '../../lib/variantes'
import { cantidadSabores } from '../../lib/sabores'

const formatoPrecio = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

// Cuando el producto tiene variantes (tamaños, sabores), su precio (y precio de oferta) ya
// no aplican: el precio real lo da la variante elegida. Ver FormularioProducto.jsx.
function precioEfectivo(producto, variante) {
  if (variante) return variante.precio
  return producto.precio_oferta ?? producto.precio
}

// Panel de detalle de un producto con adiciones: catálogo plano del negocio completo
// (ver useAdiciones.js), no de un producto puntual — cualquier producto puede recibir
// cualquier adición, y todas son siempre opcionales (no hay grupos ni obligatoriedad).
// Las variantes, en cambio, son propias de este producto (`useVariantesProducto`) y la
// elección es obligatoria: cambian el precio final en vez de sumarse.
// `itemInicial`: una línea del carrito (ver useCarrito.js) para editarla. El panel arranca con
// su variante, adiciones y cantidad, y el botón dice "Actualizar" en vez de "Agregar".
// Sabores (`sabores`: los disponibles hoy del catálogo del negocio, ver useSabores.js): si el
// producto o la variante elegida pide N, hay que elegir exactamente N (se pueden repetir) antes
// de poder agregar. No cambian el precio.
function conteoInicial(saboresElegidos = []) {
  const conteo = {}
  for (const sabor of saboresElegidos) conteo[sabor.id] = (conteo[sabor.id] ?? 0) + 1
  return conteo
}

export function OpcionesProducto({ producto, adiciones = [], sabores = [], itemInicial = null, onConfirmar, onCancelar }) {
  const { variantes } = useVariantesProducto(producto.id, { soloDisponibles: true })
  // Las adiciones elegidas se guardan con la forma de la tabla (`precio`), ver opcionesElegidas.
  const [seleccionadas, setSeleccionadas] = useState(() =>
    (itemInicial?.opcionesElegidas ?? []).map((o) => ({ id: o.id, nombre: o.nombre, precio: o.precio_extra }))
  )
  // Se guarda el id y no el objeto: las variantes llegan después (consulta aparte), y así la
  // variante de la línea que se edita queda marcada apenas cargan.
  const [varianteId, setVarianteId] = useState(itemInicial?.varianteId ?? null)
  const varianteSeleccionada = variantes.find((variante) => variante.id === varianteId) ?? null
  // { [saborId]: veces }. Solo cuentan los sabores que siguen disponibles: si uno se apagó
  // después de agregarlo al carrito, al editar la línea hay que volver a elegir ese hueco.
  const [conteoSabores, setConteoSabores] = useState(() => conteoInicial(itemInicial?.saboresElegidos))
  const [cantidad, setCantidad] = useState(itemInicial?.cantidad ?? 1)
  const swipe = useSwipeParaCerrar(onCancelar)
  const editando = Boolean(itemInicial)

  const tieneVariantes = variantes.length > 0
  const faltaElegirVariante = tieneVariantes && !varianteSeleccionada
  // Con variantes, la cantidad de sabores se conoce cuando ya se eligió la variante.
  const saboresPedidos = tieneVariantes && !varianteSeleccionada ? 0 : cantidadSabores(producto, varianteSeleccionada)
  const saboresElegidos = useMemo(
    () => sabores.flatMap((sabor) => Array.from({ length: conteoSabores[sabor.id] ?? 0 }, () => ({ id: sabor.id, nombre: sabor.nombre }))),
    [sabores, conteoSabores]
  )
  const faltanSabores = Math.max(0, saboresPedidos - saboresElegidos.length)

  // Si la nueva variante pide menos sabores de los que ya se marcaron, se empieza de cero en vez
  // de adivinar cuáles quitar.
  const elegirVariante = (variante) => {
    setVarianteId(variante.id)
    if (saboresElegidos.length > (variante.cantidad_sabores ?? 0)) setConteoSabores({})
  }

  const cambiarSabor = (saborId, delta) => {
    setConteoSabores((actual) => {
      const total = Object.values(actual).reduce((suma, veces) => suma + veces, 0)
      const veces = actual[saborId] ?? 0
      if (delta > 0 && total >= saboresPedidos) return actual
      if (delta < 0 && veces === 0) return actual
      return { ...actual, [saborId]: veces + delta }
    })
  }

  // Con un solo sabor se elige como un radio: tocar otro reemplaza el anterior.
  const elegirSaborUnico = (saborId) => setConteoSabores({ [saborId]: 1 })

  const alternarAdicion = (adicion) => {
    setSeleccionadas((actuales) => {
      const yaElegida = actuales.some((a) => a.id === adicion.id)
      return yaElegida ? actuales.filter((a) => a.id !== adicion.id) : [...actuales, adicion]
    })
  }

  // Se traduce `precio` (campo de la tabla `adiciones`) a `precio_extra`, que es el nombre
  // que ya esperan useCarrito.js/whatsapp.js/Checkout.jsx desde que existían las opciones
  // agrupadas — evita tocar esos archivos por un simple cambio de nombre de columna.
  const opcionesElegidas = useMemo(
    () => seleccionadas.map((adicion) => ({ id: adicion.id, nombre: adicion.nombre, precio_extra: adicion.precio })),
    [seleccionadas]
  )

  const subtotal = useMemo(() => {
    const extras = opcionesElegidas.reduce((suma, o) => suma + (o.precio_extra ?? 0), 0)
    return (precioEfectivo(producto, varianteSeleccionada) + extras) * cantidad
  }, [producto, varianteSeleccionada, opcionesElegidas, cantidad])

  return (
    <div
      className="opciones-producto"
      style={swipe.estilo}
      onTouchStart={swipe.onTouchStart}
      onTouchMove={swipe.onTouchMove}
      onTouchEnd={swipe.onTouchEnd}
    >
      <ImagenProducto src={producto.imagen_url} alt={producto.nombre} relacionAspecto="4 / 3" prioridad />

      <div className="opciones-producto__contenido">
        <h2 className="opciones-producto__nombre">{producto.nombre}</h2>
        {producto.descripcion && <p className="texto-suave">{producto.descripcion}</p>}

        {tieneVariantes ? (
          varianteSeleccionada ? (
            <PrecioProducto precio={varianteSeleccionada.precio} />
          ) : (
            <span className="precio-producto">Desde {formatoPrecio.format(precioMinimo(variantes))}</span>
          )
        ) : (
          <PrecioProducto precio={producto.precio} precioOferta={producto.precio_oferta} />
        )}

        {tieneVariantes && (
          <fieldset className="grupo-opciones">
            <legend className="grupo-opciones__titulo">
              Elige una opción <span className="grupo-opciones__obligatorio"> · obligatorio</span>
            </legend>
            {variantes.map((variante) => (
              <label key={variante.id} className="opcion-item">
                <input
                  type="radio"
                  name="variante-producto"
                  checked={varianteSeleccionada?.id === variante.id}
                  onChange={() => elegirVariante(variante)}
                />
                <span className="opcion-item__texto">
                  <span>{variante.nombre}</span>
                  {variante.descripcion && <span className="opcion-item__descripcion">{variante.descripcion}</span>}
                </span>
                <span className="texto-suave">{formatoPrecio.format(variante.precio)}</span>
              </label>
            ))}
          </fieldset>
        )}

        {saboresPedidos > 0 && (
          <SelectorSabores
            sabores={sabores}
            pedidos={saboresPedidos}
            conteo={conteoSabores}
            elegidos={saboresElegidos.length}
            onCambiar={cambiarSabor}
            onElegirUnico={elegirSaborUnico}
          />
        )}

        <ListaAdiciones adiciones={adiciones} seleccionadas={seleccionadas} onAlternar={alternarAdicion} />

        <div className="opciones-producto__cantidad">
          <span>Cantidad</span>
          <div className="selector-cantidad">
            <button type="button" onClick={() => setCantidad((c) => Math.max(1, c - 1))}>
              −
            </button>
            <span>{cantidad}</span>
            <button type="button" onClick={() => setCantidad((c) => c + 1)}>
              +
            </button>
          </div>
        </div>

        <div className="opciones-producto__acciones">
          <button type="button" className="boton boton--secundario" onClick={onCancelar}>
            Cancelar
          </button>
          <button
            type="button"
            className="boton"
            disabled={faltaElegirVariante || faltanSabores > 0}
            onClick={() => onConfirmar(cantidad, opcionesElegidas, varianteSeleccionada, saboresElegidos)}
          >
            {faltaElegirVariante
              ? 'Elige una opción'
              : faltanSabores > 0
                ? `Elige ${faltanSabores} ${faltanSabores === 1 ? 'sabor' : 'sabores'} más`
                : `${editando ? 'Actualizar' : 'Agregar'} · ${formatoPrecio.format(subtotal)}`}
          </button>
        </div>
      </div>
    </div>
  )
}
