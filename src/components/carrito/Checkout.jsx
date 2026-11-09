import { useMemo, useState } from 'react'
import { usePedidos } from '../../hooks/usePedidos'
import { negocioConfig } from '../../config/negocio.config'
import { construirLinkWhatsApp, construirMensajePedido } from '../../lib/whatsapp'
import { formatoPrecio } from '../../lib/tiposOferta'
import { lineasPagoWhatsapp, mediosDisponibles } from '../../lib/mediosPago'
import { PagoTransferencia } from './PagoTransferencia'

function validar({ nombre, telefono, direccion }) {
  const errores = {}
  if (!nombre.trim()) errores.nombre = 'Ingresa tu nombre.'
  if (!/^\d{7,15}$/.test(telefono.replace(/\D/g, ''))) errores.telefono = 'Ingresa un teléfono válido.'
  if (!direccion.trim()) errores.direccion = 'Ingresa la dirección de entrega.'
  return errores
}

// `datosPago`: negocio_config.datos_pago. "Transferencia" solo aparece si el negocio tiene al
// menos un medio activo (Admin → Negocio); si no, el pedido sale como efectivo, igual que antes.
export function Checkout({ items, total, ofertas = [], datosPago = null, onPedidoConfirmado }) {
  const { crearPedido } = usePedidos()
  const [datos, setDatos] = useState({ nombre: '', telefono: '', direccion: '' })
  const [errores, setErrores] = useState({})
  const medios = useMemo(() => mediosDisponibles(datosPago), [datosPago])
  const [metodoPago, setMetodoPago] = useState('efectivo')
  const [medioClave, setMedioClave] = useState(null)
  const esTransferencia = metodoPago === 'transferencia' && medios.length > 0
  const medioElegido = medios.find((m) => m.clave === medioClave) ?? medios[0]
  const [enviando, setEnviando] = useState(false)
  const [errorEnvio, setErrorEnvio] = useState(null)

  const actualizarCampo = (campo) => (evento) => {
    setDatos((actual) => ({ ...actual, [campo]: evento.target.value }))
  }

  const enviarPedido = async (evento) => {
    evento.preventDefault()
    const erroresValidacion = validar(datos)
    setErrores(erroresValidacion)
    if (Object.keys(erroresValidacion).length > 0) return

    setEnviando(true)
    setErrorEnvio(null)

    // Una adición pedida sola va con producto_id null y su adicion_id (ver useCarrito:
    // agregarAdicion); el panel y WhatsApp la muestran igual que cualquier línea.
    const productosDetalle = items.map((item) => ({
      producto_id: item.productoId,
      ...(item.adicionId && { adicion_id: item.adicionId, tipo: 'adicion' }),
      nombre: item.nombre,
      variante_elegida: item.varianteNombre,
      // Nombres con repetidos (Mango, Mango, Mora); los pedidos viejos no traen el campo.
      ...(item.saboresElegidos?.length > 0 && { sabores_elegidos: item.saboresElegidos.map((s) => s.nombre) }),
      cantidad: item.cantidad,
      precio_base: item.precioBase,
      opciones_elegidas: item.opcionesElegidas.map((o) => ({ nombre: o.nombre, precio_extra: o.precio_extra ?? 0 })),
      subtotal: item.subtotal,
    }))

    const { exito, error } = await crearPedido({
      cliente_nombre: datos.nombre.trim(),
      cliente_telefono: datos.telefono.replace(/\D/g, ''),
      direccion: datos.direccion.trim(),
      productos_detalle: productosDetalle,
      total,
      metodo_pago: esTransferencia ? 'transferencia' : 'efectivo',
    })

    setEnviando(false)

    if (!exito) {
      setErrorEnvio('No se pudo enviar el pedido. Intenta de nuevo en un momento.')
      console.error(error)
      return
    }

    const pago = lineasPagoWhatsapp(esTransferencia ? medioElegido : null)
    const mensaje = construirMensajePedido({ items, total, cliente: datos, ofertas, pago })
    const link = construirLinkWhatsApp(negocioConfig.whatsappContacto, mensaje)
    window.open(link, '_blank', 'noreferrer')
    onPedidoConfirmado()
  }

  const cantidad = items.reduce((suma, item) => suma + item.cantidad, 0)

  // Encabezado con el resumen (cantidad y total) para que quien llena sus datos no pierda de
  // vista qué está pidiendo. Los campos llevan autocomplete para que el celular los sugiera.
  return (
    <form className="checkout" onSubmit={enviarPedido} noValidate>
      <div className="checkout__encabezado">
        <p className="checkout__rotulo">Último paso</p>
        <h2 className="checkout__titulo">¿A dónde te lo llevamos?</h2>
        <p className="checkout__resumen">
          <span>
            {cantidad} {cantidad === 1 ? 'producto' : 'productos'}
          </span>
          <strong>{formatoPrecio.format(total).replace(/\s/g, '')}</strong>
        </p>
      </div>

      <label className="campo">
        <span>Nombre</span>
        <input
          type="text"
          value={datos.nombre}
          onChange={actualizarCampo('nombre')}
          maxLength={80}
          autoComplete="name"
          placeholder="¿Cómo te llamas?"
        />
        {errores.nombre && <span className="campo__error">{errores.nombre}</span>}
      </label>

      <label className="campo">
        <span>Teléfono</span>
        <input
          type="tel"
          value={datos.telefono}
          onChange={actualizarCampo('telefono')}
          maxLength={15}
          autoComplete="tel"
          inputMode="tel"
          placeholder="300 123 4567"
        />
        {errores.telefono && <span className="campo__error">{errores.telefono}</span>}
      </label>

      <label className="campo">
        <span>Dirección de entrega</span>
        <input
          type="text"
          value={datos.direccion}
          onChange={actualizarCampo('direccion')}
          maxLength={160}
          autoComplete="street-address"
          placeholder="Calle, número y barrio"
        />
        {errores.direccion && <span className="campo__error">{errores.direccion}</span>}
      </label>

      <fieldset className="checkout__pago">
        <legend>¿Cómo vas a pagar?</legend>
        <div className="checkout__metodos">
          <label className={`checkout__metodo${!esTransferencia ? ' checkout__metodo--activo' : ''}`}>
            <input
              type="radio"
              name="metodo-pago"
              value="efectivo"
              checked={!esTransferencia}
              onChange={() => setMetodoPago('efectivo')}
            />
            <strong>Efectivo</strong>
            <small>Pagas al recibir</small>
          </label>
          {medios.length > 0 && (
            <label className={`checkout__metodo${esTransferencia ? ' checkout__metodo--activo' : ''}`}>
              <input
                type="radio"
                name="metodo-pago"
                value="transferencia"
                checked={esTransferencia}
                onChange={() => setMetodoPago('transferencia')}
              />
              <strong>Transferencia</strong>
              <small>{medios.map((m) => m.nombre).join(' · ')}</small>
            </label>
          )}
        </div>

        {esTransferencia && (
          <PagoTransferencia
            medios={medios}
            medioClave={medioElegido.clave}
            onCambiarMedio={setMedioClave}
            total={total}
          />
        )}
      </fieldset>

      {errorEnvio && <p className="campo__error">{errorEnvio}</p>}

      <button type="submit" className="boton checkout__enviar" disabled={enviando}>
        {enviando ? 'Enviando…' : 'Enviar pedido por WhatsApp'}
      </button>
      <p className="checkout__nota">
        {esTransferencia
          ? 'Se abre WhatsApp con tu pedido: envía el mensaje y adjunta la captura del comprobante.'
          : 'Se abre WhatsApp con tu pedido listo para confirmar la entrega.'}
      </p>
    </form>
  )
}
