import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// The Adawise backend sends no CORS headers, so the app calls it on its own origin (/api/…)
// and this proxy (or the Vercel rewrite in production) forwards to the real server.
const API_TARGET = 'https://adawise-momo-backend.onrender.com'
const proxy = { '/api': { target: API_TARGET, changeOrigin: true, secure: true } }

export default defineConfig({
  server: { proxy },
  preview: { proxy },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon.svg'],
      manifest: {
        name: 'MoMo · Adawise Demo',
        short_name: 'MoMo Demo',
        description: 'Adawise Finance prototype for the MoMo Fintech Lab hackathon',
        theme_color: '#00547B',
        background_color: '#00547B',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: '/icons/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: '/icons/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,jpg,webp,woff2}'],
        navigateFallbackDenylist: [/^\/api\//],
      },
    }),
  ],
})
