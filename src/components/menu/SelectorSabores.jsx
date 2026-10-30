// Elección de sabores dentro del detalle de producto (OpcionesProducto). `pedidos` es cuántos
// exige el producto o la variante elegida. Con 1 se elige como radio; con más, cada sabor tiene
// su contador (− n +) porque se pueden repetir, y "+" se apaga al completar. Solo llegan los
// sabores disponibles hoy (ver useSabores.js).
export function SelectorSabores({ sabores, pedidos, conteo, elegidos, onCambiar, onElegirUnico }) {
  const completo = elegidos >= pedidos
  const titulo = pedidos === 1 ? 'Elige tu sabor' : `Elige ${pedidos} sabores`

  return (
    <fieldset className="grupo-opciones selector-sabores">
      <legend className="grupo-opciones__titulo">
        {titulo}
        <span className="grupo-opciones__obligatorio">
          {pedidos === 1 ? ' · obligatorio' : ` · ${elegidos} de ${pedidos} · puedes repetir`}
        </span>
      </legend>

      {sabores.length === 0 && <p className="texto-suave">Hoy no hay sabores disponibles.</p>}

      {sabores.map((sabor) => {
        const veces = conteo[sabor.id] ?? 0
        const texto = (
          <span className="opcion-item__texto">
            <span>{sabor.nombre}</span>
            {sabor.descripcion && <span className="opcion-item__descripcion">{sabor.descripcion}</span>}
          </span>
        )

        if (pedidos === 1) {
          return (
            <label key={sabor.id} className="opcion-item">
              <input type="radio" name="sabor-producto" checked={veces > 0} onChange={() => onElegirUnico(sabor.id)} />
              {texto}
            </label>
          )
        }

        return (
          <div key={sabor.id} className={`opcion-item selector-sabores__fila${veces > 0 ? ' selector-sabores__fila--elegido' : ''}`}>
            {texto}
            <div className="selector-cantidad selector-sabores__contador">
              <button
                type="button"
                onClick={() => onCambiar(sabor.id, -1)}
                disabled={veces === 0}
                aria-label={`Quitar un ${sabor.nombre}`}
              >
                −
              </button>
              <span aria-live="polite">{veces}</span>
              <button
                type="button"
                onClick={() => onCambiar(sabor.id, 1)}
                disabled={completo}
                aria-label={`Agregar un ${sabor.nombre}`}
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
