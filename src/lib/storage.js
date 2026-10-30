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
