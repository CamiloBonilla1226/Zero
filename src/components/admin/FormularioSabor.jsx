import { useState } from 'react'
import { mensajeAmigablePostgres } from '../../lib/erroresAmigables'

// Un sabor solo tiene nombre, descripción (ej. Tussi: "Whisky y ron") y orden: no tiene precio
// (no cambia el precio del producto) ni imagen. La disponibilidad se cambia desde la lista.
export function FormularioSabor({ saborInicial, onGuardar, onCancelar }) {
  const [valores, setValores] = useState({
    nombre: saborInicial?.nombre ?? '',
    descripcion: saborInicial?.descripcion ?? '',
    orden: saborInicial?.orden ?? 0,
  })
  const [guardando, setGuardando] = useState(false)
  const [errorGuardado, setErrorGuardado] = useState(null)

  const actualizar = (campo) => (evento) => setValores((actual) => ({ ...actual, [campo]: evento.target.value }))

  const enviar = async (evento) => {
    evento.preventDefault()
    setGuardando(true)
    setErrorGuardado(null)

    const resultado = await onGuardar({
      nombre: valores.nombre.trim(),
      descripcion: valores.descripcion.trim() || null,
      orden: Number(valores.orden) || 0,
    })

    setGuardando(false)
    if (resultado && !resultado.exito) {
      setErrorGuardado(mensajeAmigablePostgres(resultado.error, 'No se pudo guardar el sabor.'))
    }
  }

  return (
    <form className="checkout" onSubmit={enviar} noValidate>
      <label className="campo">
        <span>Nombre</span>
        <input
          type="text"
          value={valores.nombre}
          onChange={actualizar('nombre')}
          required
          maxLength={40}
          placeholder="Ej. Maracuyá"
        />
      </label>

      <label className="campo">
        <span>Descripción (opcional)</span>
        <input
          type="text"
          value={valores.descripcion}
          onChange={actualizar('descripcion')}
          maxLength={120}
          placeholder="Ej. Whisky y ron"
        />
      </label>

      <label className="campo">
        <span>Orden (opcional: los de número menor salen primero)</span>
        <input type="number" min="0" step="1" value={valores.orden} onChange={actualizar('orden')} />
      </label>

      {errorGuardado && <p className="campo__error">{errorGuardado}</p>}

      <div className="opciones-producto__acciones">
        <button type="button" className="boton boton--secundario" onClick={onCancelar}>
          Cancelar
        </button>
        <button type="submit" className="boton" disabled={guardando}>
          {guardando ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </form>
  )
}
