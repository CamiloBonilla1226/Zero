// Sonido del aviso de pedido nuevo, generado con Web Audio API (sin archivos de audio).
//
// Los navegadores no dejan reproducir sonido hasta que la persona toca la página. Por eso el
// AudioContext se crea y se "despierta" en el primer toque, clic o tecla dentro del panel
// (desbloquearAudio, ver useAvisoPedidos). Si nunca se desbloqueó o el navegador no tiene
// Web Audio, sonarPedido() no hace nada y devuelve false: el aviso visual sale igual.

let contexto = null

function crearContexto() {
  if (contexto) return contexto
  const Contexto = window.AudioContext ?? window.webkitAudioContext
  if (!Contexto) return null
  contexto = new Contexto()
  return contexto
}

export function desbloquearAudio() {
  try {
    const ctx = crearContexto()
    if (!ctx) return false
    if (ctx.state === 'suspended') ctx.resume().catch(() => {})
    // Un búfer mudo de una muestra: Safari de iPhone necesita reproducir algo dentro del
    // gesto para dejar el contexto habilitado.
    const fuente = ctx.createBufferSource()
    fuente.buffer = ctx.createBuffer(1, 1, 22050)
    fuente.connect(ctx.destination)
    fuente.start(0)
    return true
  } catch {
    return false
  }
}

export function audioDesbloqueado() {
  return contexto?.state === 'running'
}

// Dos notas cortas ascendentes (tipo timbre), ~0,45 s en total.
export function sonarPedido() {
  try {
    if (!audioDesbloqueado()) return false
    const inicio = contexto.currentTime + 0.01
    const notas = [
      { frecuencia: 880, desde: 0, duracion: 0.18 },
      { frecuencia: 1318.5, desde: 0.16, duracion: 0.28 },
    ]
    for (const { frecuencia, desde, duracion } of notas) {
      const oscilador = contexto.createOscillator()
      const volumen = contexto.createGain()
      oscilador.type = 'sine'
      oscilador.frequency.value = frecuencia
      // Entrada rápida y caída exponencial: suena como una campanita, no como un pitido.
      volumen.gain.setValueAtTime(0.0001, inicio + desde)
      volumen.gain.exponentialRampToValueAtTime(0.35, inicio + desde + 0.015)
      volumen.gain.exponentialRampToValueAtTime(0.0001, inicio + desde + duracion)
      oscilador.connect(volumen)
      volumen.connect(contexto.destination)
      oscilador.start(inicio + desde)
      oscilador.stop(inicio + desde + duracion + 0.02)
    }
    return true
  } catch (error) {
    console.warn('[sonidoPedido] No se pudo reproducir el sonido del pedido nuevo:', error)
    return false
  }
}
