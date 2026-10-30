import { useState } from 'react'
import { ImagenProducto } from '../menu/ImagenProducto'
import { subirImagenProducto } from '../../lib/storage'
import { negocioConfig } from '../../config/negocio.config'
import { mensajeAmigablePostgres } from '../../lib/erroresAmigables'

const VACIO = {
  nombre: '',
  descripcion: '',
  precio: '',
  imagen_url: '',
  visible_domicilios: true,
  visible_carta_fisica: true,
}

export function FormularioAdicion({ adicionInicial, onGuardar, onCancelar }) {
  const [valores, setValores] = useState(
    adicionInicial
      ? {
          nombre: adicionInicial.nombre,
          descripcion: adicionInicial.descripcion ?? '',
          precio: adicionInicial.precio,
          imagen_url: adicionInicial.imagen_url ?? '',
          visible_domicilios: adicionInicial.visible_domicilios ?? true,
          visible_carta_fisica: adicionInicial.visible_carta_fisica ?? true,
        }
      : VACIO
  )
  const [guardando, setGuardando] = useState(false)
  const [subiendoImagen, setSubiendoImagen] = useState(false)
  const [errorImagen, setErrorImagen] = useState(null)
  const [errorGuardado, setErrorGuardado] = useState(null)

  const actualizar = (campo) => (evento) => {
    const valor = evento.target.type === 'checkbox' ? evento.target.checked : evento.target.value
    setValores((actual) => ({ ...actual, [campo]: valor }))
  }

  const subirArchivo = async (evento) => {
    const archivo = evento.target.files?.[0]
    evento.target.value = ''
    if (!archivo) return

    setSubiendoImagen(true)
    setErrorImagen(null)

    const { url, error } = await subirImagenProducto(negocioConfig.negocioId, archivo)

    setSubiendoImagen(false)

    if (error) {
      setErrorImagen('No se pudo subir la imagen. Intenta de nuevo o pega una URL.')
      console.error(error)
      return
    }

    setValores((actual) => ({ ...actual, imagen_url: url }))
  }

  const enviar = async (evento) => {
    evento.preventDefault()
    setGuardando(true)
    setErrorGuardado(null)

    const resultado = await onGuardar({
      nombre: valores.nombre.trim(),
      descripcion: valores.descripcion.trim() || null,
      precio: Number(valores.precio),
      imagen_url: valores.imagen_url.trim() || null,
      visible_domicilios: valores.visible_domicilios,
      visible_carta_fisica: valores.visible_carta_fisica,
    })

    setGuardando(false)
    if (resultado && !resultado.exito) {
      setErrorGuardado(mensajeAmigablePostgres(resultado.error, 'No se pudo guardar la adición.'))
    }
  }

  return (
    <form className="checkout" onSubmit={enviar} noValidate>
      <label className="campo">
        <span>Nombre</span>
        <input type="text" value={valores.nombre} onChange={actualizar('nombre')} required maxLength={80} />
      </label>

      <label className="campo">
        <span>Descripción (opcional)</span>
        <input type="text" value={valores.descripcion} onChange={actualizar('descripcion')} maxLength={200} />
      </label>

      <label className="campo">
        <span>Precio</span>
        <input type="number" min="0" step="1" value={valores.precio} onChange={actualizar('precio')} required />
      </label>

      <div className="campo campo-imagen">
        <span>Imagen (opcional)</span>

        <ImagenProducto src={valores.imagen_url} alt={valores.nombre || 'Vista previa'} relacionAspecto="4 / 3" prioridad />

        <label className="boton boton--secundario boton--pequeno campo-imagen__subir">
          {subiendoImagen ? 'Subiendo…' : 'Subir imagen'}
          <input type="file" accept="image/*" onChange={subirArchivo} disabled={subiendoImagen} hidden />
        </label>

        {errorImagen && <span className="campo__error">{errorImagen}</span>}

        <input
          type="text"
          placeholder="…o pega una URL de imagen"
          value={valores.imagen_url}
          onChange={actualizar('imagen_url')}
        />
      </div>

      <label className="campo campo--linea">
        <input type="checkbox" checked={valores.visible_domicilios} onChange={actualizar('visible_domicilios')} />
        <span>Mostrar en carta de domicilios</span>
      </label>

      <label className="campo campo--linea">
        <input type="checkbox" checked={valores.visible_carta_fisica} onChange={actualizar('visible_carta_fisica')} />
        <span>Mostrar en carta física</span>
      </label>

      {errorGuardado && <p className="campo__error">{errorGuardado}</p>}

      <div className="opciones-producto__acciones">
        <button type="button" className="boton boton--secundario" onClick={onCancelar}>
          Cancelar
        </button>
        <button type="submit" className="boton" disabled={guardando || subiendoImagen}>
          {guardando ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </form>
  )
}
