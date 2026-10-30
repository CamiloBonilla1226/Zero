// Cierra un modal `.superposicion` al hacer click en el fondo oscuro (fuera del panel),
// sin depender del botón "×". Comparar target con currentTarget es suficiente: un click
// que empieza dentro del panel nunca llega aquí con el mismo target que el div de fondo,
// así que no hace falta stopPropagation() en los hijos.
export function alSoltarFondo(onCerrar) {
  return (evento) => {
    if (evento.target === evento.currentTarget) onCerrar()
  }
}
