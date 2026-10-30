import { useState } from 'react'
import { SelectorCategorias } from './SelectorCategorias'
import { GrupoFiltro } from './FiltrosAdmin'
import { mensajeAmigablePostgres } from '../../lib/erroresAmigables'

const MODOS = {
  agregar: 'Se suman a las categorías que ya tienen; no se quita ninguna.',
  cambiar: 'Quedan solo en las categorías marcadas; las demás se les quitan.',
  quitar: 'Se sacan de las categorías marcadas; las demás no se tocan.',
}

// Cambia las categorías de varios productos a la vez (agregar / cambiar / quitar).
export function FormularioCategoriasMasivo({ categorias, cantidad, onAplicar, onCancelar }) {
  const [modo, setModo] = useState('agregar')
  const [seleccionadas, setSeleccionadas] = useState([])
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)

  // "Cambiar" sin ninguna marcada deja a los productos sin categoría: se permite, pero el
  // botón lo dice explícitamente. Agregar o quitar "nada" no tiene sentido.
  const dejarSinCategoria = modo === 'cambiar' && seleccionadas.length === 0
  const puedeAplicar = modo === 'cambiar' || seleccionadas.length > 0
  const productosTexto = `${cantidad} producto${cantidad === 1 ? '' : 's'}`

  const aplicar = async (evento) => {
    evento.preventDefault()
    setGuardando(true)
    setError(null)
    const resultado = await onAplicar(modo, seleccionadas)
    setGuardando(false)
    if (resultado && !resultado.exito) {
      setError(mensajeAmigablePostgres(resultado.error, 'No se pudieron cambiar las categorías.'))
    }
  }

  return (
    <form className="checkout formulario-categorias-masivo" onSubmit={aplicar} noValidate>
      <GrupoFiltro
        titulo="Qué hacer"
        valor={modo}
        onCambiar={setModo}
        opciones={[
          { valor: 'agregar', texto: 'Agregar' },
          { valor: 'cambiar', texto: 'Cambiar' },
          { valor: 'quitar', texto: 'Quitar' },
        ]}
      />
      <p className="texto-suave formulario-categorias-masivo__ayuda">{MODOS[modo]}</p>

      <SelectorCategorias categorias={categorias} seleccionadas={seleccionadas} onCambiar={setSeleccionadas} />

      {error && <p className="campo__error">{error}</p>}

      <div className="opciones-producto__acciones">
        <button type="button" className="boton boton--secundario" onClick={onCancelar}>
          Cancelar
        </button>
        <button type="submit" className="boton" disabled={guardando || !puedeAplicar}>
          {guardando
            ? 'Aplicando…'
            : dejarSinCategoria
              ? `Dejar ${productosTexto} sin categoría`
              : `Aplicar a ${productosTexto}`}
        </button>
      </div>
    </form>
  )
}
