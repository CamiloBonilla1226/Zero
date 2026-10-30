import { formatoPrecio } from '../../lib/tiposOferta'
import { EncabezadoSeccion } from './EncabezadoSeccion'

// "Así de fácil pides": tres pasos fijos unidos por un riel de neón (vertical en el celular,
// horizontal desde tableta). El tercero menciona el domicilio gratis solo si
// esa oferta está activa, con su monto real (tabla ofertas); si no, un texto neutro.
export function PasosPedido({ montoDomicilioGratis }) {
  const pasos = [
    ['Elige tu paleta o granizado', 'Explora el menú y agrégalo al carrito.'],
    ['Confirma tus datos', 'Dirección y forma de pago en un momento.'],
    [
      'Recíbelo en tu puerta',
      montoDomicilioGratis
        ? `Domicilio gratis desde ${formatoPrecio.format(montoDomicilioGratis).replace(/\s/g, '')}.`
        : 'Te lo llevamos hasta donde estés.',
    ],
  ]

  return (
    <section className="inicio-seccion" aria-labelledby="titulo-pasos">
      <EncabezadoSeccion id="titulo-pasos" rotulo="Cómo pedir" titulo="Así de fácil pides" />
      <ol className="pasos-pedido">
        {pasos.map(([titulo, descripcion], indice) => (
          <li key={titulo} className="pasos-pedido__paso">
            <span className="pasos-pedido__numero" aria-hidden="true">
              {String(indice + 1).padStart(2, '0')}
            </span>
            <span>
              <strong className="pasos-pedido__titulo">{titulo}</strong>
              <span className="pasos-pedido__descripcion">{descripcion}</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  )
}
