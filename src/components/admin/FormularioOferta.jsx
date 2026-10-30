import { useState } from 'react'
import { Interruptor } from './Interruptor'
import { TarjetaOferta } from '../layout/TarjetaOferta'
import { OFERTA_SUBTITULO_MAX, OFERTA_TITULO_MAX } from '../../hooks/useOfertas'
import { mensajeAmigablePostgres } from '../../lib/erroresAmigables'

function VistaPrevia({ oferta }) {
  return (
    <div className="formulario-oferta__vista-previa">
      <span className="formulario-oferta__rotulo">Así se verá en Inicio</span>
      {oferta.titulo.trim() ? (
        <TarjetaOferta oferta={oferta} />
      ) : (
        <p className="texto-suave formulario-oferta__vacia">Escribe un título para ver la tarjeta.</p>
      )}
    </div>
  )
}

// Crear/editar una oferta del dueño: solo título y descripción (la descripción es el texto
// pequeño de la tarjeta, columna `subtitulo`), con vista previa de la tarjeta de Inicio.
// `ofertaActiva`: la que está activa ahora, para avisar que crear esta activa la reemplaza.
export function FormularioOferta({ ofertaInicial, ofertaActiva = null, onGuardar, onCancelar }) {
  const [valores, setValores] = useState({
    titulo: ofertaInicial?.titulo ?? '',
    subtitulo: ofertaInicial?.subtitulo ?? '',
    activa: ofertaInicial?.activa ?? true,
  })
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)

  const actualizar = (campo) => (evento) => setValores((actual) => ({ ...actual, [campo]: evento.target.value }))

  const enviar = async (evento) => {
    evento.preventDefault()
    setGuardando(true)
    setError(null)
    const resultado = await onGuardar(valores)
    setGuardando(false)
    if (resultado && !resultado.exito) {
      setError(mensajeAmigablePostgres(resultado.error, 'No se pudo guardar la oferta.'))
    }
  }

  return (
    <form className="checkout formulario-oferta" onSubmit={enviar} noValidate>
      <VistaPrevia oferta={valores} />

      <label className="campo">
        <span>
          Título{' '}
          <em className="negocio-seccion__contador">
            {valores.titulo.length}/{OFERTA_TITULO_MAX}
          </em>
        </span>
        <input
          type="text"
          value={valores.titulo}
          onChange={actualizar('titulo')}
          maxLength={OFERTA_TITULO_MAX}
          placeholder="Ej. 2x1 en cervezas los jueves"
          required
        />
      </label>

      <label className="campo">
        <span>
          Descripción (opcional){' '}
          <em className="negocio-seccion__contador">
            {valores.subtitulo.length}/{OFERTA_SUBTITULO_MAX}
          </em>
        </span>
        <input
          type="text"
          value={valores.subtitulo}
          onChange={actualizar('subtitulo')}
          maxLength={OFERTA_SUBTITULO_MAX}
          placeholder="Ej. Solo por esta semana"
        />
      </label>

      {!ofertaInicial && (
        <>
          <Interruptor
            activo={valores.activa}
            etiqueta={valores.activa ? 'Activa al crearla' : 'Guardar como inactiva'}
            onCambiar={(activa) => setValores((actual) => ({ ...actual, activa }))}
          />
          {valores.activa && ofertaActiva && (
            <p className="texto-suave formulario-oferta__aviso">
              Solo puede haber una oferta activa: "{ofertaActiva.titulo}" se desactivará.
            </p>
          )}
        </>
      )}

      {error && <p className="campo__error">{error}</p>}

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

export { VistaPrevia }
