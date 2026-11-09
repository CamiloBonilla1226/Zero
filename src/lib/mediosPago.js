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


// Descarga el QR de un medio como PNG, para que el cliente lo guarde y lo cargue desde la app
// de su banco cuando paga desde el mismo celular (no puede escanear su propia pantalla).
// - Se convierte a PNG porque el QR se guarda en WebP y algunas apps de bancos no lo leen.
// - En celular se usa el menú de compartir (navigator.share con el archivo): ahí está
//   "Guardar imagen", que lo deja en la galería; una descarga normal en iPhone va a Archivos.
// - Si nada de eso se puede (navegador viejo, sin CORS), se abre la imagen en otra pestaña.
export async function descargarQr(qrUrl, nombreMedio) {
  const nombreArchivo = `qr-${nombreMedio.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`
  try {
    const respuesta = await fetch(qrUrl, { mode: 'cors' })
    if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`)
    const bitmap = await createImageBitmap(await respuesta.blob())
    const canvas = document.createElement('canvas')
    // Margen blanco alrededor: los lectores de QR necesitan la "zona tranquila".
    const margen = Math.round(Math.max(bitmap.width, bitmap.height) * 0.08)
    canvas.width = bitmap.width + margen * 2
    canvas.height = bitmap.height + margen * 2
    const contexto = canvas.getContext('2d')
    contexto.fillStyle = '#fff'
    contexto.fillRect(0, 0, canvas.width, canvas.height)
    contexto.drawImage(bitmap, margen, margen)
    const png = await new Promise((resolve, reject) =>
      canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('No se pudo crear el PNG'))), 'image/png')
    )
    const archivo = new File([png], nombreArchivo, { type: 'image/png' })

    const esTactil = window.matchMedia?.('(pointer: coarse)').matches
    if (esTactil && navigator.canShare?.({ files: [archivo] })) {
      try {
        await navigator.share({ files: [archivo], title: `QR ${nombreMedio}` })
        return 'compartido'
      } catch (error) {
        // El cliente cerró el menú: no es un error, no se hace nada más.
        if (error?.name === 'AbortError') return 'cancelado'
      }
    }

    const url = URL.createObjectURL(png)
    const enlace = document.createElement('a')
    enlace.href = url
    enlace.download = nombreArchivo
    document.body.appendChild(enlace)
    enlace.click()
    enlace.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    return 'descargado'
  } catch {
    window.open(qrUrl, '_blank', 'noopener,noreferrer')
    return 'abierto'
  }
}
