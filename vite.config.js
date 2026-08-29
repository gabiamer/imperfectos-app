import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Imperfectos — Frutas y verduras aptas para consumo',
        short_name: 'Imperfectos',
        description:
          'Conecta vendedores de frutas y verduras estéticamente imperfectas pero aptas para consumo con compradores que valoran el ahorro.',
        theme_color: '#4B6B45',
        background_color: '#F6F3EC',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Cachea el shell de la app y assets estáticos para que cargue
        // razonablemente aun con conexión intermitente (zonas periurbanas).
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        runtimeCaching: [
          {
            // Publicaciones ya vistas quedan disponibles en modo lectura
            // si se pierde la conexión momentáneamente.
            urlPattern: ({ url }) => url.hostname.includes('supabase.co'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-data-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 }, // 1 día
              networkTimeoutSeconds: 5,
            },
          },
        ],
      },
    }),
  ],
})
