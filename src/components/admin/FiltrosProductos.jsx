import { FiltrosAdmin, GrupoFiltro } from './FiltrosAdmin'
import { precioMinimo, variantesDisponibles } from '../../lib/variantes'
import { productoEnCategoria } from '../../lib/productosVisibles'

const SIN_CATEGORIA = '__sin__'

export const FILTROS_PRODUCTOS_INICIALES = {
  categoria: 'todas',
  estado: 'todos',
  carta: 'todas',
  destacados: 'todos',
  orden: 'nombre',
}

// Precio con el que se ordena un producto: el mismo que muestra la tarjeta (mínimo de sus
// variantes disponibles, o precio de oferta / precio normal si no tiene variantes).
function precioDe(producto) {
  const variantes = variantesDisponibles(producto)
  return variantes.length > 0 ? precioMinimo(variantes) : Number(producto.precio_oferta ?? producto.precio) || 0
}

export function aplicarFiltrosProductos(productos, filtros) {
  const filtrados = productos.filter((producto) => {
    if (filtros.categoria === SIN_CATEGORIA && producto.categorias.length > 0) return false
    if (
      filtros.categoria !== 'todas' &&
      filtros.categoria !== SIN_CATEGORIA &&
      !productoEnCategoria(producto, filtros.categoria)
    )
      return false
    if (filtros.estado === 'activos' && !producto.disponible) return false
    if (filtros.estado === 'desactivados' && producto.disponible) return false
    if (filtros.carta === 'domicilios' && !producto.visible_domicilios) return false
    if (filtros.carta === 'fisica' && !producto.visible_carta_fisica) return false
    if (filtros.destacados === 'destacados' && !producto.destacado) return false
    return true
  })

  if (filtros.orden === 'mayor-precio') return [...filtrados].sort((a, b) => precioDe(b) - precioDe(a))
  if (filtros.orden === 'menor-precio') return [...filtrados].sort((a, b) => precioDe(a) - precioDe(b))
  return filtrados
}

export function FiltrosProductos({ filtros, onCambiar, total, mostrados, categorias }) {
  const cambiar = (clave) => (valor) => onCambiar({ ...filtros, [clave]: valor })
  const activos = Object.keys(FILTROS_PRODUCTOS_INICIALES).filter(
    (clave) => filtros[clave] !== FILTROS_PRODUCTOS_INICIALES[clave]
  ).length

  return (
    <FiltrosAdmin
      total={total}
      mostrados={mostrados}
      activos={activos}
      onLimpiar={() => onCambiar(FILTROS_PRODUCTOS_INICIALES)}
    >
      <GrupoFiltro
        titulo="Categoría"
        valor={filtros.categoria}
        onCambiar={cambiar('categoria')}
        opciones={[
          { valor: 'todas', texto: 'Todas' },
          ...categorias.map((categoria) => ({ valor: categoria.id, texto: categoria.nombre })),
          { valor: SIN_CATEGORIA, texto: 'Sin categoría' },
        ]}
      />
      <GrupoFiltro
        titulo="Estado"
        valor={filtros.estado}
        onCambiar={cambiar('estado')}
        opciones={[
          { valor: 'todos', texto: 'Todos' },
          { valor: 'activos', texto: 'Activados' },
          { valor: 'desactivados', texto: 'Desactivados' },
        ]}
      />
      <GrupoFiltro
        titulo="Carta"
        valor={filtros.carta}
        onCambiar={cambiar('carta')}
        opciones={[
          { valor: 'todas', texto: 'Todas' },
          { valor: 'domicilios', texto: 'Domicilios' },
          { valor: 'fisica', texto: 'Carta física' },
        ]}
      />
      <GrupoFiltro
        titulo="Destacado"
        valor={filtros.destacados}
        onCambiar={cambiar('destacados')}
        opciones={[
          { valor: 'todos', texto: 'Todos' },
          { valor: 'destacados', texto: '★ Solo destacados' },
        ]}
      />
      <GrupoFiltro
        titulo="Ordenar"
        valor={filtros.orden}
        onCambiar={cambiar('orden')}
        opciones={[
          { valor: 'nombre', texto: 'Nombre' },
          { valor: 'mayor-precio', texto: 'Mayor precio' },
          { valor: 'menor-precio', texto: 'Menor precio' },
        ]}
      />
    </FiltrosAdmin>
  )
}
