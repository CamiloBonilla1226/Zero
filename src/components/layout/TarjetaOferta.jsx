import { montoDomicilioGratis, textoDomicilioGratis, TIPO_DOMICILIO_GRATIS } from '../../lib/tiposOferta'

function IconoOferta({ tipo }) {
  if (tipo === TIPO_DOMICILIO_GRATIS) {
    // Moto de domicilio.
    return (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="5.5" cy="17" r="2.5" />
        <circle cx="18.5" cy="17" r="2.5" />
        <path d="M8 17h6l3-6h-4l-2 3H7.5M15 6h2l1.5 5" />
        <path d="M3 9h5v3H3z" />
      </svg>
    )
  }
  // Regalo.
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="8" width="18" height="12" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="12" y1="8" x2="12" y2="20" />
      <path d="M12 8c-1.6-3-6-3.4-6-0.4C6 8.3 8 8 12 8Zm0 0c1.6-3 6-3.4 6-0.4C18 8.3 16 8 12 8Z" />
    </svg>
  )
}

// Tarjeta de la oferta activa en Inicio (solo puede haber una, ver useOfertas.js): una franja
// sobria con el tubo dorado claro a la izquierda, el ícono de línea (moto para domicilio gratis,
// regalo para las demás), rótulo "Oferta", título, descripción y una flecha. Para domicilio
// gratis el texto se arma siempre con el monto configurado, así no queda desactualizado si el
// dueño lo cambia. Sin oferta (o sin título) no se renderiza nada. Al tocarla lleva al Menú
// (`onClick`, ver Carta.jsx). El formulario de ofertas la reutiliza como vista previa.
export function TarjetaOferta({ oferta, onClick }) {
  if (!oferta?.titulo?.trim()) return null

  const monto = montoDomicilioGratis(oferta)
  const { titulo, subtitulo } = monto ? textoDomicilioGratis(monto) : oferta

  return (
    <button type="button" className="tarjeta-oferta" onClick={onClick}>
      <span className="tarjeta-oferta__icono" aria-hidden="true">
        <IconoOferta tipo={oferta.tipo} />
      </span>
      <span className="tarjeta-oferta__texto">
        <span className="tarjeta-oferta__rotulo">Oferta</span>
        <strong className="tarjeta-oferta__titulo">{titulo}</strong>
        {subtitulo?.trim() && <span className="tarjeta-oferta__subtitulo">{subtitulo}</span>}
      </span>
      <span className="tarjeta-oferta__flecha" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </span>
    </button>
  )
}
