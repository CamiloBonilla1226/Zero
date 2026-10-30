import { useOutletContext } from 'react-router-dom'

// Activa o silencia el sonido del aviso de pedido nuevo, solo en este dispositivo (ver
// useAvisoPedidos). Mismo formato que el botón del tema, junto a él en la barra superior.
export function BotonSonido() {
  const { avisoPedidos } = useOutletContext()
  const { silenciado, alternarSilencio } = avisoPedidos

  return (
    <button
      type="button"
      className="boton-tema"
      onClick={alternarSilencio}
      aria-pressed={silenciado}
      aria-label={silenciado ? 'Activar sonido de pedidos nuevos' : 'Silenciar sonido de pedidos nuevos'}
      title={silenciado ? 'Sonido de pedidos: apagado' : 'Sonido de pedidos: encendido'}
    >
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M11 5 6.5 9H3.5v6h3L11 19z" />
        {silenciado ? (
          <path d="m16 9.5 5 5M21 9.5l-5 5" />
        ) : (
          <path d="M15.5 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11" />
        )}
      </svg>
    </button>
  )
}
