// Notificaciones push del panel admin. El service worker que genera vite-plugin-pwa (sw.js,
// scope /admin) carga este archivo con importScripts (ver vite.config.js). Los mensajes los
// manda la Edge Function notificar-pedido-nuevo con { titulo, cuerpo, url, pedidoId }.

self.addEventListener('push', (evento) => {
  let datos = {}
  try {
    datos = evento.data ? evento.data.json() : {}
  } catch {
    datos = { cuerpo: evento.data ? evento.data.text() : '' }
  }

  const titulo = datos.titulo || 'Pedido nuevo'
  // Siempre se muestra una notificación: iPhone retira el permiso a las apps que reciben
  // un push sin mostrar nada.
  evento.waitUntil(
    self.registration.showNotification(titulo, {
      body: datos.cuerpo || 'Entró un pedido nuevo.',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      // Una notificación por pedido: si el mismo pedido llega dos veces, se reemplaza.
      tag: datos.pedidoId ? `pedido-${datos.pedidoId}` : 'pedido-nuevo',
      renotify: true,
      data: { url: datos.url || '/admin/pedidos' },
    })
  )
})

// Al tocar la notificación: si el panel ya está abierto, se trae al frente; si no, se abre
// en Pedidos.
self.addEventListener('notificationclick', (evento) => {
  evento.notification.close()
  const url = (evento.notification.data && evento.notification.data.url) || '/admin/pedidos'

  evento.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((ventanas) => {
      const panel = ventanas.find((ventana) => new URL(ventana.url).pathname.startsWith('/admin'))
      if (panel && 'focus' in panel) return panel.focus()
      return self.clients.openWindow(url)
    })
  )
})
