import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import { resolve } from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  // Dos entradas HTML que comparten el mismo código (src/main.jsx): `index.html` para los
  // clientes (carta y domicilios, sin service worker) y `admin.html` para el panel, que es
  // la única instalable como PWA (manifiesto propio + service worker). Vercel sirve
  // `admin.html` en /admin/* (ver vercel.json).
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        admin: resolve(import.meta.dirname, 'admin.html'),
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      // El manifiesto del panel es un archivo estático (public/admin.webmanifest) enlazado
      // desde admin.html, y el registro del service worker lo hace src/pwaAdmin.js solo en
      // el panel: por eso el plugin ni genera manifiesto ni inyecta el registro.
      manifest: false,
      injectRegister: false,
      registerType: 'autoUpdate',
      filename: 'sw.js',
      workbox: {
        // Se instala y toma el control solo, para que un despliegue nuevo llegue al
        // administrador sin pasos extra (basta cerrar y volver a abrir la app).
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        // Solo el HTML del panel sirve de respaldo de navegación, y solo bajo /admin.
        navigateFallback: '/admin.html',
        navigateFallbackAllowlist: [/^\/admin(\/|$)/],
        globPatterns: ['**/*.{js,css,html,svg,webp,png,webmanifest}'],
        // Notificaciones push de pedidos nuevos (eventos push y notificationclick).
        importScripts: ['/push-handler.js'],
        // No se define runtimeCaching: las llamadas a Supabase (API, Auth, Realtime y
        // Storage) siempre van a la red, nunca a la caché.
      },
    }),
  ],
})
