// Registro del service worker del panel admin (PWA). Solo lo carga admin.html, así que la
// carta y los domicilios de los clientes nunca registran service worker. El scope
// '/admin' limita además lo que el service worker controla al panel.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/admin' }).catch((error) => {
      console.warn('No se pudo registrar el service worker del panel:', error)
    })
  })
}
