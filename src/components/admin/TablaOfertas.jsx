import { Interruptor } from './Interruptor'

// Lista de ofertas del panel: tocar la tarjeta abre el editor; el interruptor la activa o
// desactiva (solo una activa a la vez: activar una apaga la anterior, ver useOfertas.js). La
// activa lleva la marca "★ En Inicio" porque es la que muestra la carta.
// `fija`: la oferta de domicilio gratis, que no se elimina (`detalle` explica qué hace).
export function TablaOfertas({ ofertas, fija = false, detalle, vacio, onEditar, onEliminar, onCambiarActiva }) {
  if (ofertas.length === 0) {
    return <p className="texto-suave admin-vacio">{vacio}</p>
  }

  return (
    <ul className="lista-productos-admin">
      {ofertas.map((oferta) => (
        <li
          key={oferta.id}
          className={`tarjeta oferta-admin-item producto-admin-item--clicable${
            oferta.en_inicio ? ' oferta-admin-item--en-inicio' : ''
          }`}
          onClick={() => onEditar(oferta)}
        >
          <div className="producto-admin-item__info">
            <strong className="producto-admin-item__nombre" title={oferta.titulo}>
              {oferta.titulo}
            </strong>
            <span className="texto-suave producto-admin-item__categoria">{oferta.subtitulo || 'Sin descripción'}</span>
            {/* Misma fila de etiquetas que las demás tarjetas, para que todas midan igual. "Inactiva"
                no se repite aquí: ya lo dice el interruptor. */}
            <span className="producto-admin-item__etiquetas">
              {oferta.en_inicio && (
                <span className="producto-admin-item__etiqueta producto-admin-item__etiqueta--resaltada">★ En Inicio</span>
              )}
              {detalle && <span className="oferta-admin-item__tipo">{detalle}</span>}
            </span>
          </div>
          <div className="producto-admin-item__acciones" onClick={(evento) => evento.stopPropagation()}>
            <Interruptor
              activo={oferta.activa}
              etiqueta={oferta.activa ? 'Activa' : 'Inactiva'}
              onCambiar={(valor) => onCambiarActiva(oferta.id, valor)}
            />
            {!fija && (
              <button type="button" className="carrito__quitar" onClick={() => onEliminar(oferta)}>
                Eliminar
              </button>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}
