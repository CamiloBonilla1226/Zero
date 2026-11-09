// Medios de transferencia que acepta el checkout. Los datos de cada uno los llena el dueño en
// Admin → Negocio y se guardan en negocio_config.datos_pago (ver sección 24 de
// explicacion-script-bd.txt). El orden de este arreglo es el de las pestañas del checkout.
export const MEDIOS_PAGO = [
  {
    clave: 'nequi',
    nombre: 'Nequi',
    etiquetaNumero: 'Número de celular',
    placeholderNumero: '300 123 4567',
    placeholderEnlace: 'Enlace de cobro de Nequi',
  },
  {
    clave: 'bancolombia',
    nombre: 'Bancolombia',
    etiquetaNumero: 'Número de cuenta',
    placeholderNumero: '123-456789-01',
    placeholderEnlace: 'Enlace de pago de Bancolombia',
    conTipoCuenta: true,
  },
  {
    clave: 'breb',
    nombre: 'Bre-B',
    etiquetaNumero: 'Llave Bre-B',
    placeholderNumero: '@zero o celular',
    placeholderEnlace: 'Enlace de cobro Bre-B',
  },
]

export const TIPOS_CUENTA = ['Ahorros', 'Corriente']

export function medioVacio() {
  return { activo: false, numero: '', titular: '', tipo_cuenta: TIPOS_CUENTA[0], enlace: '', qr_url: '' }
}

// Un medio sirve en el checkout si está activo y tiene al menos una forma de pagar: número
// o llave para transferir a mano, el QR o el enlace directo.
export function medioUtilizable(datos) {
  if (!datos?.activo) return false
  return Boolean(datos.numero?.trim() || datos.qr_url || datos.enlace?.trim())
}

// Medios listos para mostrar al cliente, con su configuración pegada.
export function mediosDisponibles(datosPago) {
  return MEDIOS_PAGO.filter((medio) => medioUtilizable(datosPago?.[medio.clave])).map((medio) => ({
    ...medio,
    datos: datosPago[medio.clave],
  }))
}

// Solo se aceptan enlaces http(s): el valor lo escribe el dueño, pero se abre en el
// navegador del cliente, así que nunca se deja pasar un javascript: u otro esquema.
export function enlaceSeguro(enlace) {
  const texto = enlace?.trim()
  if (!texto) return null
  try {
    const url = new URL(texto)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null
  } catch {
    return null
  }
}
