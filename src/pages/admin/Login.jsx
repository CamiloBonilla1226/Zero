import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { negocioConfig } from '../../config/negocio.config'
import { BotonTema } from '../../components/admin/BotonTema'

export function Login() {
  const { autenticado, cargando, iniciarSesion, error } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [numero, setNumero] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [enviando, setEnviando] = useState(false)

  if (cargando) return null
  if (autenticado) return <Navigate to="/admin" replace />

  // RutaProtegida.jsx redirige para acá con esto en el state cuando la sesión era válida
  // para Supabase Auth pero la cuenta ya no existe (o quedó desactivada) en usuarios_admin
  // — ver el comentario ahí y en useAuth.js sobre por qué ese chequeo ya no se hace dentro
  // de iniciarSesion.
  const mensajeCuentaInvalida = location.state?.cuentaInvalida
    ? 'Esta cuenta ya no está disponible. Contacta al dueño del negocio.'
    : null

  const enviar = async (evento) => {
    evento.preventDefault()
    setEnviando(true)
    const { exito } = await iniciarSesion(numero, contrasena)
    setEnviando(false)
    if (exito) navigate('/admin')
  }

  return (
    <main className="admin-login">
      <BotonTema className="admin-login__tema" />
      <div className="admin-login__tarjeta">
        <img src="/logo.webp" alt="" className="admin-login__logo" width="88" height="88" />
        <p className="admin-login__negocio">{negocioConfig.nombre}</p>
        <h1 className="admin-login__titulo">Iniciar sesión</h1>
        <p className="admin-login__subtitulo">
          Ingresa con tu número y contraseña para administrar el negocio.
        </p>
        <form className="checkout" onSubmit={enviar} noValidate>
          <label className="campo">
            <span>Número de teléfono</span>
            <input
              type="tel"
              inputMode="tel"
              placeholder="Ej. 3001234567"
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              autoComplete="username"
              required
            />
          </label>
          <label className="campo">
            <span>Contraseña</span>
            <input
              type="password"
              placeholder="Tu contraseña"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
          {(error || mensajeCuentaInvalida) && (
            <p className="campo__error admin-login__error" role="alert">
              {error || mensajeCuentaInvalida}
            </p>
          )}
          <button type="submit" className="boton admin-login__boton" disabled={enviando}>
            {enviando ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>
      </div>
    </main>
  )
}
