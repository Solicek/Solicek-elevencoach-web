import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/apple-touch-icon-180.png'],
      manifest: {
        name: 'ElevenCoach',
        short_name: 'ElevenCoach',
        description: 'Sestava, soupiska, taktika a tréninky pro fotbalový tým',
        start_url: '/',
        display: 'standalone',
        background_color: '#121212',
        theme_color: '#2E7D32',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Firestore/Storage volání jdou vždy na síť – appka nemá offline režim (viz plán),
        // service worker má jen cachovat statická build aktiva.
        navigateFallbackDenylist: [/^\/__/],
      },
    }),
  ],
})
