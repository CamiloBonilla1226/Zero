import { useEffect } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Carta } from './pages/Carta'
import { CartaFisica } from './pages/CartaFisica'
import { Login } from './pages/admin/Login'
import { Dashboard } from './pages/admin/Dashboard'
import { Productos } from './pages/admin/Productos'
import { Categorias } from './pages/admin/Categorias'
import { Adiciones } from './pages/admin/Adiciones'
import { Sabores } from './pages/admin/Sabores'
import { Pedidos } from './pages/admin/Pedidos'
import { Usuarios } from './pages/admin/Usuarios'
import { Negocio } from './pages/admin/Negocio'
import { Ofertas } from './pages/admin/Ofertas'
import { AdminLayout } from './components/admin/AdminLayout'
import { RutaProtegida } from './components/admin/RutaProtegida'
import { AuthProvider } from './hooks/useAuth'
import { ToastProvider } from './components/ui/ToastProvider'
import { ConfirmProvider } from './components/ui/ConfirmProvider'
import { negocioConfig } from './config/negocio.config'

// Aplica la tipografía de la marca como variable CSS en tiempo de ejecución. Los colores
// ya no se inyectan desde aquí: la paleta de ZÉRO vive en :root de index.css.
function useAplicarMarca() {
  useEffect(() => {
    const raiz = document.documentElement
    const { marca } = negocioConfig
    raiz.style.setProperty('--fuente', marca.fuente)
  }, [])
}

function App() {
  useAplicarMarca()

  return (
    <ToastProvider>
      <ConfirmProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Carta />} />
              <Route path="/carta" element={<Carta />} />
              <Route path="/carta-fisica" element={<CartaFisica />} />

              <Route element={<AdminLayout />}>
                <Route path="/admin/login" element={<Login />} />
                <Route
                  path="/admin"
                  element={
                    <RutaProtegida>
                      <Dashboard />
                    </RutaProtegida>
                  }
                />
                <Route
                  path="/admin/pedidos"
                  element={
                    <RutaProtegida permiso="puedePedidos">
                      <Pedidos />
                    </RutaProtegida>
                  }
                />
                <Route
                  path="/admin/productos"
                  element={
                    <RutaProtegida permiso="puedeProductos">
                      <Productos />
                    </RutaProtegida>
                  }
                />
                <Route
                  path="/admin/categorias"
                  element={
                    <RutaProtegida permiso="puedeCategorias">
                      <Categorias />
                    </RutaProtegida>
                  }
                />
                <Route
                  path="/admin/adiciones"
                  element={
                    <RutaProtegida permiso="puedeAdiciones">
                      <Adiciones />
                    </RutaProtegida>
                  }
                />
                <Route
                  path="/admin/sabores"
                  element={
                    <RutaProtegida permiso="puedeSabores">
                      <Sabores />
                    </RutaProtegida>
                  }
                />
                <Route
                  path="/admin/ofertas"
                  element={
                    <RutaProtegida permiso="puedeOfertas">
                      <Ofertas />
                    </RutaProtegida>
                  }
                />
                <Route
                  path="/admin/usuarios"
                  element={
                    <RutaProtegida soloDueno>
                      <Usuarios />
                    </RutaProtegida>
                  }
                />
                <Route
                  path="/admin/negocio"
                  element={
                    <RutaProtegida permiso="puedeNegocio">
                      <Negocio />
                    </RutaProtegida>
                  }
                />
              </Route>
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ConfirmProvider>
    </ToastProvider>
  )
}

export default App
