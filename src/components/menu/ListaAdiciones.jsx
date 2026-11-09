const formatoPrecio = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

// Catálogo plano de adiciones del negocio dentro del detalle de producto de domicilios
// (OpcionesProducto). Cada adición tiene su contador (− n +) porque se puede repetir (Leche x2)
// y todas son opcionales (se puede no pedir ninguna). `maximo` es el cupo del producto o de la
// variante elegida (ver lib/adiciones.js): null = sin límite; al llegar al máximo se apagan los
// "+". Reutiliza el diseño del contador de sabores (SelectorSabores). La carta física, que es
// solo para hojear, lista las adiciones con su propio diseño (DetalleProductoFisico.jsx).
export function ListaAdiciones({ adiciones, conteo = {}, elegidas = 0, maximo = null, onCambiar, titulo = 'Adiciones' }) {
  if (adiciones.length === 0) return null

  const completo = maximo !== null && elegidas >= maximo
  const detalle =
    maximo === null
      ? ' · opcional · puedes repetir'
      : ` · ${elegidas} de ${maximo} · opcional${maximo > 1 ? ' · puedes repetir' : ''}`

  return (
    <fieldset className="grupo-opciones">
      <legend className="grupo-opciones__titulo">
        {maximo === null ? titulo : `${titulo} (hasta ${maximo})`}
        <span className="grupo-opciones__obligatorio">{detalle}</span>
      </legend>

      {adiciones.map((adicion) => {
        const veces = conteo[adicion.id] ?? 0
        return (
          <div
            key={adicion.id}
            className={`opcion-item selector-sabores__fila${veces > 0 ? ' selector-sabores__fila--elegido' : ''}`}
          >
            <span className="opcion-item__texto">
              <span>{adicion.nombre}</span>
              {adicion.precio > 0 && <span className="opcion-item__descripcion">+{formatoPrecio.format(adicion.precio)}</span>}
            </span>
            <div className="selector-cantidad selector-sabores__contador">
              <button
                type="button"
                onClick={() => onCambiar(adicion.id, -1)}
                disabled={veces === 0}
                aria-label={`Quitar una ${adicion.nombre}`}
              >
                −
              </button>
              <span aria-live="polite">{veces}</span>
              <button
                type="button"
                onClick={() => onCambiar(adicion.id, 1)}
                disabled={completo}
                aria-label={`Agregar una ${adicion.nombre}`}
              >
                +
              </button>
            </div>
          </div>
        )
      })}
    </fieldset>
  )
}
