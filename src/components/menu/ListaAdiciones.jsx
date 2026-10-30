const formatoPrecio = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

// Catálogo plano de adiciones del negocio dentro del detalle de producto de domicilios
// (OpcionesProducto): checkboxes que arman el pedido. La carta física, que es solo para
// hojear, lista las adiciones con su propio diseño (CartaFisica.jsx, DetalleProductoFisico.jsx).
export function ListaAdiciones({ adiciones, seleccionadas = [], onAlternar, titulo = 'Adiciones' }) {
  if (adiciones.length === 0) return null

  return (
    <fieldset className="grupo-opciones">
      <legend className="grupo-opciones__titulo">
        {titulo}
        <span className="grupo-opciones__obligatorio"> · opcional</span>
      </legend>

      {adiciones.map((adicion) => {
        const marcada = seleccionadas.some((a) => a.id === adicion.id)
        return (
          <label key={adicion.id} className="opcion-item">
            <input type="checkbox" checked={marcada} onChange={() => onAlternar(adicion)} />
            <span>{adicion.nombre}</span>
            {adicion.precio > 0 && <span className="texto-suave">+{formatoPrecio.format(adicion.precio)}</span>}
          </label>
        )
      })}
    </fieldset>
  )
}
