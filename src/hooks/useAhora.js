import { useEffect, useState } from 'react'

// Hora actual que se renueva cada minuto. La usan el header y la portada de Inicio para que
// el estado Abierto/Cerrado cambie solo si alguien deja la carta abierta justo cuando se
// cruza la hora de apertura o de cierre, sin necesitar recargar.
export function useAhora() {
  const [ahora, setAhora] = useState(() => new Date())

  useEffect(() => {
    const intervalo = setInterval(() => setAhora(new Date()), 60_000)
    return () => clearInterval(intervalo)
  }, [])

  return ahora
}
