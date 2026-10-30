import { negocioConfig } from '../../config/negocio.config'
import { IconoWhatsapp } from './iconos'

// Botón de contacto al final de Inicio: abre el chat con el número del negocio
// (negocio.config.js), el mismo al que llegan los pedidos del checkout.
export function BotonWhatsapp() {
  const numero = negocioConfig.whatsappContacto.replace(/\D/g, '')

  return (
    <a className="boton-whatsapp" href={`https://wa.me/${numero}`} target="_blank" rel="noreferrer">
      <IconoWhatsapp tamano={22} />
      Escríbenos por WhatsApp
    </a>
  )
}
