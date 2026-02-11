import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const rawBase = process.env.VITE_BASE ?? '/';
const base = rawBase.endsWith('/') ? rawBase : `${rawBase}/`;
const nodeMajor = Number(process.versions.node.split('.')[0] ?? 0);
const workboxMode = nodeMajor >= 24 ? 'development' : 'production';

export default defineConfig({
  base,
  server: {
    proxy: {
      '/api': {
        target: process.env.NOTIFY_PROXY_TARGET ?? 'http://127.0.0.1:8787',
        changeOrigin: true
      }
    }
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifestFilename: 'site.webmanifest',
      includeAssets: [
        'favicon.svg',
        'favicon-16.png',
        'favicon-32.png',
        'apple-touch-icon.png',
        'android-chrome-192.png',
        'android-chrome-512.png'
      ],
      workbox: {
        mode: workboxMode,
        navigateFallback: 'index.html',
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === 'document',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'nullcal-pages',
              expiration: { maxEntries: 25 }
            }
          },
          {
            urlPattern: ({ request }) =>
              ['script', 'style', 'image', 'font'].includes(request.destination),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'nullcal-assets',
              expiration: { maxEntries: 60 }
            }
          }
        ]
      },
      manifest: {
        name: 'NullCal',
        short_name: 'NullCal',
        start_url: '.',
        display: 'standalone',
        background_color: '#070A0F',
        theme_color: '#070A0F',
        icons: [
          { src: './favicon-16.png', sizes: '16x16', type: 'image/png' },
          { src: './favicon-32.png', sizes: '32x32', type: 'image/png' },
          { src: './android-chrome-192.png', sizes: '192x192', type: 'image/png' },
          { src: './android-chrome-512.png', sizes: '512x512', type: 'image/png' }
        ]
      }
    })
  ],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    minify: 'esbuild',
    cssMinify: true,
    target: 'es2018'
  }
});
