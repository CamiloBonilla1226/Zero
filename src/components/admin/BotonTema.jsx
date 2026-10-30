import { useOutletContext } from 'react-router-dom'

// Botón de sol/luna para cambiar el panel entre claro y oscuro. El estado vive en
// AdminLayout (useTemaAdmin) y llega por el contexto del <Outlet>.
export function BotonTema({ className = '' }) {
  const { tema, alternarTema } = useOutletContext()
  const oscuro = tema === 'oscuro'

  return (
    <button
      type="button"
      className={`boton-tema ${className}`.trim()}
      onClick={alternarTema}
      aria-label={oscuro ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
      title={oscuro ? 'Tema claro' : 'Tema oscuro'}
    >
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
        {oscuro ? (
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
          </>
        ) : (
          <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" />
        )}
      </svg>
    </button>
  )
}
