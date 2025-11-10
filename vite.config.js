// C:\Users\Jose-Julian\Desktop\wombo\web\vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// IMPORTANTE:
// - En desarrollo tu backend corre en http://localhost:4000
// - El frontend (Vite) corre en http://localhost:5173
// Este proxy evita problemas de CORS en modo local.

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Wombo App',
        short_name: 'Wombo',
        description: 'Gestión de pedidos y envíos Shalom/Olva',
        theme_color: '#ff4081',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
      workbox: {
        runtimeCaching: [
          // Cachea imágenes
          {
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 días
              },
            },
          },
          // Cachea llamadas a tu backend en Render
          {
            urlPattern: ({ url }) =>
              url.origin.includes('onrender.com') || url.pathname.startsWith('/api'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 10,
            },
          },
        ],
      },
    }),
  ],

  //server: {
    //port: 5173,
    //open: true,
    //proxy: {
    //  '/api': {
    //    target: 'http://localhost:4000',
    //    changeOrigin: true,
    //  },
    //  '/health': {
    //    target: 'http://localhost:4000',
    //    changeOrigin: true,
    //  },
    //},
  //},
  

  // base: '/', // solo si lo subes en subcarpeta
});

