// Encabezado común de las secciones de Inicio: rótulo corto en mayúsculas sobre el título
// (con el tubo de neón a la izquierda, ver index.css) y, opcional, una acción a la derecha.
export function EncabezadoSeccion({ id, rotulo, titulo, accion }) {
  return (
    <div className="inicio-seccion__encabezado">
      <div className="inicio-seccion__textos">
        {rotulo && <p className="inicio-seccion__rotulo">{rotulo}</p>}
        <h2 id={id} className="inicio-seccion__titulo">
          {titulo}
        </h2>
      </div>
      {accion}
    </div>
  )
}
