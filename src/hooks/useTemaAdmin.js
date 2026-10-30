import { useCallback, useEffect, useState } from 'react'

const CLAVE = 'admin-tema'

// Sin elección guardada, el panel arranca en oscuro (la identidad de ZÉRO es negra y dorada).
function temaInicial() {
  try {
    const guardado = localStorage.getItem(CLAVE)
    if (guardado === 'claro' || guardado === 'oscuro') return guardado
  } catch {
    // Sin acceso a localStorage (modo privado estricto): se usa el oscuro.
  }
  return 'oscuro'
}

// Tema claro/oscuro del panel admin. Se aplica como `data-tema` en el <body> (que ya lleva la
// clase `admin`, ver AdminLayout.jsx) para que también lo hereden los modales, y se recuerda
// en este navegador. La carta pública no se ve afectada: sus estilos no leen este atributo.
export function useTemaAdmin() {
  const [tema, setTema] = useState(temaInicial)

  useEffect(() => {
    document.body.dataset.tema = tema
    return () => {
      delete document.body.dataset.tema
    }
  }, [tema])

  const alternarTema = useCallback(() => {
    setTema((actual) => {
      const nuevo = actual === 'oscuro' ? 'claro' : 'oscuro'
      try {
        localStorage.setItem(CLAVE, nuevo)
      } catch {
        // Si no se puede guardar, el cambio igual aplica durante esta visita.
      }
      return nuevo
    })
  }, [])

  return { tema, alternarTema }
}
