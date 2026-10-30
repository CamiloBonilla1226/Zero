import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { negocioConfig } from '../config/negocio.config'
import { MONTO_DOMICILIO_POR_DEFECTO, TIPO_DOMICILIO_GRATIS, textoDomicilioGratis } from '../lib/tiposOferta'

export const OFERTA_TITULO_MAX = 38
export const OFERTA_SUBTITULO_MAX = 22

const ahora = () => new Date().toISOString()
const esDomicilio = (oferta) => oferta.tipo === TIPO_DOMICILIO_GRATIS

function validarTextos({ titulo, subtitulo }) {
  const tituloLimpio = titulo?.trim() ?? ''
  if (!tituloLimpio) return 'El título es obligatorio.'
  if (tituloLimpio.length > OFERTA_TITULO_MAX) return `El título admite hasta ${OFERTA_TITULO_MAX} caracteres.`
  if ((subtitulo?.trim() ?? '').length > OFERTA_SUBTITULO_MAX) {
    return `La descripción admite hasta ${OFERTA_SUBTITULO_MAX} caracteres.`
  }
  return null
}

const sinPermiso = (data, accion) => (data?.length ? null : new Error(`No tienes permiso para ${accion} esta oferta.`))

// Ofertas del negocio (tabla ofertas, ver explicacion-script-bd.txt sección 17). Solo una
// puede estar activa a la vez: es la que se muestra en la tarjeta de Inicio (`en_inicio`) y la
// única que aplica su comportamiento (barra del carrito, línea en WhatsApp). "Domicilio gratis" es una oferta fija: en el panel se crea sola si el
// negocio todavía no la tiene, no se elimina y solo se le cambia el monto. Las demás las crea
// el dueño, solo con título y descripción. Con `soloActivas` la usa la carta pública (el RLS
// igual solo le deja leer las activas) y nunca crea nada.
export function useOfertas({ soloActivas = false } = {}) {
  const [ofertas, setOfertas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const creandoDomicilio = useRef(false)

  const recargar = useCallback(
    async (silencioso = false) => {
      if (!silencioso) setCargando(true)
      setError(null)

      let consulta = supabase
        .from('ofertas')
        .select('*')
        .eq('negocio_id', negocioConfig.negocioId)
        .order('en_inicio', { ascending: false })
        .order('activa', { ascending: false })
        .order('creado_en', { ascending: false })
      if (soloActivas) consulta = consulta.eq('activa', true)

      const { data, error: errorConsulta } = await consulta
      if (errorConsulta) {
        setError(errorConsulta)
        setOfertas([])
      } else {
        setOfertas(data)
      }
      setCargando(false)
    },
    [soloActivas]
  )

  useEffect(() => {
    recargar()
  }, [recargar])

  // Garantiza que exista la oferta fija de domicilio gratis (inactiva, con un monto por
  // defecto que el dueño ajusta). La base de datos además impide tener dos (índice único).
  useEffect(() => {
    if (soloActivas || cargando || error || creandoDomicilio.current || ofertas.some(esDomicilio)) return
    creandoDomicilio.current = true
    const monto = MONTO_DOMICILIO_POR_DEFECTO
    supabase
      .from('ofertas')
      .insert({
        negocio_id: negocioConfig.negocioId,
        tipo: TIPO_DOMICILIO_GRATIS,
        configuracion: { monto_minimo: monto },
        activa: false,
        ...textoDomicilioGratis(monto),
      })
      .then(() => recargar(true))
  }, [soloActivas, cargando, error, ofertas, recargar])

  const ponerEnInicio = useCallback(
    async (id) => {
      const { error: errorRpc } = await supabase.rpc('poner_oferta_en_inicio', { p_oferta: id })
      await recargar(true)
      return { exito: !errorRpc, error: errorRpc }
    },
    [recargar]
  )

  const actualizarOferta = useCallback(
    async (id, { titulo, subtitulo }) => {
      const mensaje = validarTextos({ titulo, subtitulo })
      if (mensaje) return { exito: false, error: new Error(mensaje) }

      const { data, error: errorActualizar } = await supabase
        .from('ofertas')
        .update({ titulo: titulo.trim(), subtitulo: subtitulo?.trim() || null, actualizado_en: ahora() })
        .eq('id', id)
        .select('id')
      const error = errorActualizar ?? sinPermiso(data, 'editar')
      await recargar(true)
      return { exito: !error, error }
    },
    [recargar]
  )

  // Lo único configurable de la oferta de domicilio gratis: el monto. El texto de la tarjeta
  // se recalcula con él.
  const configurarDomicilio = useCallback(
    async (id, montoTexto) => {
      const monto = Math.round(Number(montoTexto))
      if (!(monto > 0)) return { exito: false, error: new Error('Ingresa una compra mínima mayor a 0.') }

      const { data, error: errorActualizar } = await supabase
        .from('ofertas')
        .update({ configuracion: { monto_minimo: monto }, ...textoDomicilioGratis(monto), actualizado_en: ahora() })
        .eq('id', id)
        .select('id')
      const error = errorActualizar ?? sinPermiso(data, 'editar')
      await recargar(true)
      return { exito: !error, error }
    },
    [recargar]
  )

  const eliminarOferta = useCallback(
    async (id) => {
      if (ofertas.some((oferta) => oferta.id === id && esDomicilio(oferta))) {
        return { exito: false, error: new Error('La oferta de domicilio gratis no se puede eliminar; puedes desactivarla.') }
      }
      const { data, error: errorEliminar } = await supabase.from('ofertas').delete().eq('id', id).select('id')
      const error = errorEliminar ?? sinPermiso(data, 'eliminar')
      await recargar(true)
      return { exito: !error, error }
    },
    [ofertas, recargar]
  )

  // Solo puede haber una oferta activa a la vez. Activar una desactiva primero las demás (en
  // ese orden, para respetar los índices únicos de la sección 17) y luego la deja activa y en
  // Inicio con la función poner_oferta_en_inicio. Desactivar también la quita de Inicio (la
  // base de datos no deja una oferta en Inicio sin estar activa).
  const activarOferta = useCallback(
    async (id) => {
      const { error: errorOtras } = await supabase
        .from('ofertas')
        .update({ activa: false, en_inicio: false, actualizado_en: ahora() })
        .eq('negocio_id', negocioConfig.negocioId)
        .eq('activa', true)
        .neq('id', id)
      if (errorOtras) {
        await recargar(true)
        return { exito: false, error: errorOtras }
      }
      return ponerEnInicio(id)
    },
    [ponerEnInicio, recargar]
  )

  const cambiarActiva = useCallback(
    async (id, valor) => {
      if (valor) return activarOferta(id)

      const { error: errorActualizar } = await supabase
        .from('ofertas')
        .update({ activa: false, en_inicio: false, actualizado_en: ahora() })
        .eq('id', id)
      await recargar(true)
      return { exito: !errorActualizar, error: errorActualizar }
    },
    [activarOferta, recargar]
  )

  // Se inserta inactiva y, si se pidió activa, se activa con activarOferta (que desactiva la
  // que estuviera activa: solo puede haber una).
  const crearOferta = useCallback(
    async ({ titulo, subtitulo, activa }) => {
      const mensaje = validarTextos({ titulo, subtitulo })
      if (mensaje) return { exito: false, error: new Error(mensaje) }

      const { data, error: errorCrear } = await supabase
        .from('ofertas')
        .insert({
          negocio_id: negocioConfig.negocioId,
          titulo: titulo.trim(),
          subtitulo: subtitulo?.trim() || null,
          tipo: 'informativa',
          activa: false,
        })
        .select()
        .single()
      if (errorCrear) return { exito: false, error: errorCrear }

      if (activa) return activarOferta(data.id)
      await recargar(true)
      return { exito: true }
    },
    [activarOferta, recargar]
  )

  // La única oferta activa. Si quedaron varias activas de antes de esta regla, manda la que está
  // en Inicio (y si ninguna lo está, la más reciente), así la carta nunca aplica dos a la vez.
  const activas = ofertas.filter((oferta) => oferta.activa)
  const ofertaActiva = activas.find((oferta) => oferta.en_inicio) ?? activas[0] ?? null

  return {
    ofertas,
    ofertaDomicilio: ofertas.find(esDomicilio) ?? null,
    otrasOfertas: ofertas.filter((oferta) => !esDomicilio(oferta)),
    ofertaActiva,
    cargando,
    error,
    recargar,
    crearOferta,
    actualizarOferta,
    configurarDomicilio,
    eliminarOferta,
    cambiarActiva,
  }
}
