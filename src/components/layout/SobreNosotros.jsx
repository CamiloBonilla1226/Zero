import { negocioConfig } from '../../config/negocio.config'
import { useNegocioConfig } from '../../hooks/useNegocioConfig'
import { agruparHorario, DIAS } from '../../lib/horario'
import { IconoFacebook, IconoInstagram, IconoRedes, IconoReloj, IconoUbicacion, IconoWhatsapp } from '../inicio/iconos'

const REDES = [
  ['instagram', 'Instagram', IconoInstagram],
  ['facebook', 'Facebook', IconoFacebook],
  ['whatsapp', 'WhatsApp', IconoWhatsapp],
]

// El dueño puede guardar en redes_sociales un link completo o solo el usuario/número (desde
// /admin/negocio). Sin http se arma el link de cada red, para que nunca quede un enlace
// relativo roto dentro de la carta.
function enlaceRed(clave, valor) {
  const texto = valor.trim()
  if (/^https?:\/\//i.test(texto)) return texto
  if (clave === 'whatsapp') {
    const digitos = texto.replace(/\D/g, '')
    return `https://wa.me/${digitos.length === 10 ? `57${digitos}` : digitos}`
  }
  const usuario = texto.replace(/^@/, '')
  return clave === 'instagram' ? `https://instagram.com/${usuario}` : `https://facebook.com/${usuario}`
}

// Bloque minimalista al final de Inicio: rótulo, nombre del negocio y una fila por dato
// (horario / ubicación / redes), leídos de `negocio_config` (ver useNegocioConfig.js) para
// que el dueño los edite desde su panel. El horario muestra el de hoy y se despliega para ver
// la semana. Las filas sin dato no se muestran; si no hay ninguna, la sección tampoco.
export function SobreNosotros() {
  const { config, cargando, error } = useNegocioConfig()
  if (cargando) return null

  const { direccion, horario, redes_sociales: redesSociales } = config ?? {}
  const redesConLink = REDES.filter(([clave]) => redesSociales?.[clave]?.trim())
  const gruposHorario = agruparHorario(horario)
  const sinDatos = !direccion && gruposHorario.length === 0 && redesConLink.length === 0

  if (sinDatos && !error) return null

  const hoy = DIAS[new Date().getDay()]
  const grupoHoy = gruposHorario.find((grupo) => grupo.claves.includes(hoy))

  return (
    <section className="sobre-nosotros" aria-labelledby="titulo-sobre-nosotros">
      <p className="sobre-nosotros__rotulo">Sobre nosotros</p>
      <h2 id="titulo-sobre-nosotros" className="sobre-nosotros__nombre">
        <img src="/logo.webp" alt="" className="sobre-nosotros__logo" width="48" height="48" loading="lazy" />
        {negocioConfig.nombre}
      </h2>
      <span className="sobre-nosotros__raya" aria-hidden="true" />

      {error ? (
        <p className="sobre-nosotros__error" role="alert">
          No pudimos cargar el horario y la ubicación.
        </p>
      ) : (
        <ul className="sobre-nosotros__filas">
          {gruposHorario.length > 0 && (
            <li>
              <details className="sobre-nosotros__horario">
                <summary className="sobre-nosotros__fila">
                  <IconoReloj tamano={20} />
                  <span className="sobre-nosotros__dato">
                    <span className="sobre-nosotros__etiqueta">Horario</span>
                    <span className="sobre-nosotros__valor">
                      {grupoHoy ? `Hoy · ${grupoHoy.texto}` : 'Ver horario'}
                    </span>
                  </span>
                  <svg className="sobre-nosotros__flecha" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                    <path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" strokeWidth="1.8" />
                  </svg>
                </summary>
                <ul className="sobre-nosotros__semana">
                  {gruposHorario.map((grupo) => (
                    <li key={grupo.etiquetaDias}>
                      <span>{grupo.etiquetaDias}</span>
                      <span>{grupo.texto}</span>
                    </li>
                  ))}
                </ul>
              </details>
            </li>
          )}

          {direccion && (
            <li>
              <a
                className="sobre-nosotros__fila"
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(direccion)}`}
                target="_blank"
                rel="noreferrer"
              >
                <IconoUbicacion tamano={20} />
                <span className="sobre-nosotros__dato">
                  <span className="sobre-nosotros__etiqueta">Ubicación</span>
                  <span className="sobre-nosotros__valor">{direccion}</span>
                </span>
                <svg className="sobre-nosotros__flecha" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                  <path d="M7 17 17 7M9 7h8v8" fill="none" stroke="currentColor" strokeWidth="1.8" />
                </svg>
                <span className="visualmente-oculto">(abre el mapa)</span>
              </a>
            </li>
          )}

          {redesConLink.length > 0 && (
            <li className="sobre-nosotros__fila">
              <IconoRedes tamano={20} />
              <span className="sobre-nosotros__dato">
                <span className="sobre-nosotros__etiqueta">Redes</span>
                <span className="sobre-nosotros__redes">
                  {redesConLink.map(([clave, etiqueta, Icono]) => (
                    <a key={clave} href={enlaceRed(clave, redesSociales[clave])} target="_blank" rel="noreferrer">
                      <Icono tamano={18} />
                      <span>{etiqueta}</span>
                    </a>
                  ))}
                </span>
              </span>
            </li>
          )}
        </ul>
      )}
    </section>
  )
}
