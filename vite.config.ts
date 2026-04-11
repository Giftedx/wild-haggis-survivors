import { defineConfig } from 'vite';
import path from 'path';
import { readFileSync } from 'node:fs';
import { VitePWA } from 'vite-plugin-pwa';

const pkg = JSON.parse(
  readFileSync(path.resolve(__dirname, 'package.json'), 'utf-8')
) as { version: string };

export default defineConfig({
  /** Relative asset URLs so the build works on GitHub Pages project sites and file:// previews. */
  base: './',
  /** Exposed at compile time so UI code reads a single source of truth for the app version. */
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['pwa-192x192.png', 'pwa-512x512.png'],
      manifest: {
        name: 'Wild Haggis Survivors',
        short_name: 'Haggis Survivors',
        description: 'Scrap through the glen as a wild haggis — warm, drifty, stubborn. Plays offline.',
        theme_color: '#1a1a2e',
        background_color: '#1a1a2e',
        display: 'standalone',
        orientation: 'any',
        scope: './',
        start_url: './',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        /** Precache all shipped static files (Phaser vendor chunk, hashed assets, images, audio). */
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,woff,ttf,mp3,wav,ogg,m4a,webp,json,webmanifest}'],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    target: 'ES2020',
    outDir: 'dist',
    assetsInlineLimit: 0,
    /** Phaser min chunk is ~1.5 MB; main game chunk stays small after `manualChunks`. */
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/phaser')) return 'vendor-phaser';
          if (id.includes('node_modules')) return 'vendor';
        },
      },
    },
  },
});
