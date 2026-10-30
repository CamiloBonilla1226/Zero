// Normaliza para comparar texto de búsqueda sin sensibilidad a mayúsculas ni tildes (ej.
// "cerveza" debe encontrar "Cervéza" si alguien lo escribió así en el nombre del producto).
export function normalizarTexto(texto) {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}
