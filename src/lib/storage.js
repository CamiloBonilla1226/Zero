import { supabase } from './supabaseClient'

// Bucket de Supabase Storage para las imágenes de productos. Debe crearse en el
// dashboard de Supabase (Storage → New bucket → público) antes de usar la subida desde
// el panel admin — ver instrucciones en CHANGELOG.md.
const BUCKET = 'productos-imagenes'
const ANCHO_MAXIMO = 1200
const CALIDAD_WEBP = 0.82
// Proporción fija para toda imagen de producto/adición del proyecto (ver CHANGELOG.md).
// Se recorta al subir para que el front (tarjetas y detalle) siempre reciba la misma
// relación de aspecto y no dependa de que cada foto venga ya bien encuadrada.
const RELACION_ASPECTO = 4 / 3

function cargarImagen(archivo) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = URL.createObjectURL(archivo)
  })
}

// Recorta al centro a RELACION_ASPECTO, redimensiona a ANCHO_MAXIMO y convierte a WebP en
// el navegador antes de subir, para cumplir el requisito del brief de "formatos modernos y
// livianos, con tamaños apropiados" sin depender de procesamiento del lado del servidor
// (que no existe aquí) ni de que el CSS "arregle" fotos con proporciones muy distintas.
async function convertirAWebp(archivo) {
  const img = await cargarImagen(archivo)

  const relacionOriginal = img.width / img.height
  let sx, sy, sw, sh
  if (relacionOriginal > RELACION_ASPECTO) {
    // Imagen más ancha que 4:3 → se recortan los lados.
    sh = img.height
    sw = sh * RELACION_ASPECTO
    sx = (img.width - sw) / 2
    sy = 0
  } else {
    // Imagen más alta que 4:3 → se recorta arriba/abajo.
    sw = img.width
    sh = sw / RELACION_ASPECTO
    sx = 0
    sy = (img.height - sh) / 2
  }

  const ancho = Math.round(Math.min(ANCHO_MAXIMO, sw))
  const alto = Math.round(ancho / RELACION_ASPECTO)

  const canvas = document.createElement('canvas')
  canvas.width = ancho
  canvas.height = alto
  canvas.getContext('2d').drawImage(img, sx, sy, sw, sh, 0, 0, ancho, alto)
  URL.revokeObjectURL(img.src)

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('No se pudo procesar la imagen'))),
      'image/webp',
      CALIDAD_WEBP
    )
  })
}

export async function subirImagenProducto(negocioId, archivo) {
  if (!archivo.type.startsWith('image/')) {
    return { url: null, error: new Error('El archivo debe ser una imagen.') }
  }
  if (archivo.size > 8 * 1024 * 1024) {
    return { url: null, error: new Error('La imagen no debe superar 8 MB.') }
  }

  try {
    const blobWebp = await convertirAWebp(archivo)
    // La carpeta por negocio_id permite que las políticas de Storage restrinjan la
    // escritura al propio negocio, igual que el resto del modelo de datos.
    const ruta = `${negocioId}/${crypto.randomUUID()}.webp`

    const { error: errorSubida } = await supabase.storage
      .from(BUCKET)
      .upload(ruta, blobWebp, { contentType: 'image/webp', upsert: false })

    if (errorSubida) return { url: null, error: errorSubida }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(ruta)
    return { url: data.publicUrl, error: null }
  } catch (error) {
    return { url: null, error }
  }
}

// Reduce la imagen a `ladoMaximo` (el lado más largo) y la pasa a WebP SIN recortarla: un QR
// o un comprobante se tienen que ver completos, a diferencia de las fotos de producto.
async function comprimirSinRecorte(archivo, ladoMaximo, calidad) {
  const img = await cargarImagen(archivo)
  const escala = Math.min(1, ladoMaximo / Math.max(img.width, img.height))
  const ancho = Math.round(img.width * escala)
  const alto = Math.round(img.height * escala)

  const canvas = document.createElement('canvas')
  canvas.width = ancho
  canvas.height = alto
  const contexto = canvas.getContext('2d')
  // Fondo blanco: un PNG con transparencia (QR exportado de la app del banco) quedaría negro.
  contexto.fillStyle = '#fff'
  contexto.fillRect(0, 0, ancho, alto)
  contexto.drawImage(img, 0, 0, ancho, alto)
  URL.revokeObjectURL(img.src)

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('No se pudo procesar la imagen'))),
      'image/webp',
      calidad
    )
  })
}

function validarImagen(archivo, megasMaximos) {
  if (!archivo?.type?.startsWith('image/')) return new Error('El archivo debe ser una imagen.')
  if (archivo.size > megasMaximos * 1024 * 1024) return new Error(`La imagen no debe superar ${megasMaximos} MB.`)
  return null
}

// QR de un medio de pago (Admin → Negocio). Va al bucket público de imágenes, en la carpeta
// del negocio, porque el cliente tiene que poder verlo sin sesión.
export async function subirImagenQr(negocioId, archivo) {
  const errorValidacion = validarImagen(archivo, 8)
  if (errorValidacion) return { url: null, error: errorValidacion }

  try {
    const blob = await comprimirSinRecorte(archivo, 800, 0.92)
    const ruta = `${negocioId}/qr-${crypto.randomUUID()}.webp`
    const { error } = await supabase.storage.from(BUCKET).upload(ruta, blob, { contentType: 'image/webp', upsert: false })
    if (error) return { url: null, error }
    return { url: supabase.storage.from(BUCKET).getPublicUrl(ruta).data.publicUrl, error: null }
  } catch (error) {
    return { url: null, error }
  }
}

// Comprobantes de transferencia: bucket PRIVADO (ver sección 24 de explicacion-script-bd.txt).
// El cliente solo puede subir; el panel los ve con un enlace firmado que vence pronto.
const BUCKET_COMPROBANTES = 'comprobantes-pago'

// Devuelve la ruta dentro del bucket (no una URL: el bucket no es público).
export async function subirComprobantePago(negocioId, archivo) {
  // 15 MB de entrada: las capturas de celular pesan poco, pero una foto de cámara puede
  // pesar bastante; igual sale comprimida muy por debajo del límite de 5 MB del bucket.
  const errorValidacion = validarImagen(archivo, 15)
  if (errorValidacion) return { ruta: null, error: errorValidacion }

  try {
    const blob = await comprimirSinRecorte(archivo, 1600, 0.82)
    const ruta = `${negocioId}/${crypto.randomUUID()}.webp`
    const { error } = await supabase.storage
      .from(BUCKET_COMPROBANTES)
      .upload(ruta, blob, { contentType: 'image/webp', upsert: false })
    return { ruta: error ? null : ruta, error }
  } catch (error) {
    return { ruta: null, error }
  }
}

export async function urlComprobantePago(ruta) {
  const { data, error } = await supabase.storage.from(BUCKET_COMPROBANTES).createSignedUrl(ruta, 300)
  return { url: data?.signedUrl ?? null, error }
}
