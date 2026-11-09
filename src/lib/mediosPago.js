// Medios de transferencia que acepta el checkout. Los datos de cada uno los llena el dueño en
// Admin → Negocio y se guardan en negocio_config.datos_pago (ver sección 24 de
// explicacion-script-bd.txt). El orden de este arreglo es el de las pestañas del checkout.
export const MEDIOS_PAGO = [
  {
    clave: 'nequi',
    nombre: 'Nequi',
    etiquetaNumero: 'Número de celular',
    placeholderNumero: '300 123 4567',
    copiarSoloDigitos: true,
  },
  {
    clave: 'bancolombia',
    nombre: 'Bancolombia',
    etiquetaNumero: 'Número de cuenta',
    placeholderNumero: '123-456789-01',
    conTipoCuenta: true,
    copiarSoloDigitos: true,
  },
  {
    clave: 'breb',
    nombre: 'Bre-B',
    etiquetaNumero: 'Llave Bre-B',
    placeholderNumero: '@zero o celular',
  },
]

export const TIPOS_CUENTA = ['Ahorros', 'Corriente']

export function medioVacio() {
  return { activo: false, numero: '', titular: '', tipo_cuenta: TIPOS_CUENTA[0], qr_url: '' }
}

// Un medio sirve en el checkout si está activo y tiene número de cuenta, celular o llave: es
// el dato que el cliente copia para transferir (el QR es un complemento opcional).
export function medioUtilizable(datos) {
  return Boolean(datos?.activo && datos.numero?.trim())
}

// Lo que se copia al portapapeles: en Nequi y Bancolombia solo los dígitos ("300 123 4567" →
// "3001234567"), porque así lo piden las apps de los bancos; la llave Bre-B va tal cual
// (puede ser un @alias o un correo).
export function valorParaCopiar(medio, numero) {
  const texto = numero.trim()
  return medio.copiarSoloDigitos ? texto.replace(/\D/g, '') : texto
}

// Medios listos para mostrar al cliente, con su configuración pegada.
export function mediosDisponibles(datosPago) {
  return MEDIOS_PAGO.filter((medio) => medioUtilizable(datosPago?.[medio.clave])).map((medio) => ({
    ...medio,
    datos: datosPago[medio.clave],
  }))
}

