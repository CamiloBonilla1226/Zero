// Permisos que el dueño puede dar a cada empleado, uno por sección del panel (columnas
// puede_* de usuarios_admin, ver explicacion-script-bd.txt sección 3). `clave` es el nombre
// del permiso en useAuth(). Inicio lo ve cualquier usuario del panel, y Usuarios solo el
// dueño (gestionar cuentas no se delega: un empleado podría darse más permisos o crear
// cuentas). Pedidos viene activo por defecto, como antes de existir este permiso.
export const PERMISOS_EMPLEADO = [
  { columna: 'puede_pedidos', clave: 'puedePedidos', etiqueta: 'Pedidos', descripcion: 'Ver los pedidos y cambiar su estado' },
  { columna: 'puede_productos', clave: 'puedeProductos', etiqueta: 'Productos', descripcion: 'Crear, editar y ocultar productos' },
  { columna: 'puede_categorias', clave: 'puedeCategorias', etiqueta: 'Categorías', descripcion: 'Crear categorías y elegir sus productos' },
  { columna: 'puede_adiciones', clave: 'puedeAdiciones', etiqueta: 'Adiciones', descripcion: 'Crear y editar adiciones' },
  { columna: 'puede_sabores', clave: 'puedeSabores', etiqueta: 'Sabores', descripcion: 'Prender y apagar los sabores del día, crear y editar sabores' },
  { columna: 'puede_ofertas', clave: 'puedeOfertas', etiqueta: 'Ofertas', descripcion: 'Crear, activar y desactivar ofertas' },
  { columna: 'puede_negocio', clave: 'puedeNegocio', etiqueta: 'Negocio', descripcion: 'Editar frase de inicio, dirección, redes y horario' },
]

// Secciones del panel admin en el orden del menú lateral (AdminNav) y del swipe entre
// secciones (AdminLayout). Única fuente de verdad: agregar una sección aquí la suma a los
// dos lados. `visible` recibe lo que devuelve useAuth() y replica las mismas restricciones
// que RutaProtegida en App.jsx.
const SECCIONES = [
  { ruta: '/admin', etiqueta: 'Inicio', visible: () => true },
  { ruta: '/admin/pedidos', etiqueta: 'Pedidos', visible: (auth) => auth.puedePedidos },
  { ruta: '/admin/productos', etiqueta: 'Productos', visible: (auth) => auth.puedeProductos },
  { ruta: '/admin/categorias', etiqueta: 'Categorías', visible: (auth) => auth.puedeCategorias },
  { ruta: '/admin/adiciones', etiqueta: 'Adiciones', visible: (auth) => auth.puedeAdiciones },
  { ruta: '/admin/sabores', etiqueta: 'Sabores', visible: (auth) => auth.puedeSabores },
  { ruta: '/admin/ofertas', etiqueta: 'Ofertas', visible: (auth) => auth.puedeOfertas },
  { ruta: '/admin/usuarios', etiqueta: 'Usuarios', visible: (auth) => auth.esDueno },
  { ruta: '/admin/negocio', etiqueta: 'Negocio', visible: (auth) => auth.puedeNegocio },
]

export function seccionesAdminVisibles(auth) {
  return SECCIONES.filter((seccion) => seccion.visible(auth))
}
