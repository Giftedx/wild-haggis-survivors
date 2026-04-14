/// <reference types="vitest/config" />
import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath, URL } from 'node:url';

const pkg = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf-8')
) as { version: string };

/** Node 25+ enables Web Storage in workers with a broken default; Vitest forks then warn and tests can see a useless `localStorage` proxy. */
const nodeMajor = Number.parseInt(process.versions.node.split('.')[0] ?? '0', 10);
const vitestNoWebStorage =
  nodeMajor >= 25
    ? {
        poolOptions: {
          forks: {
            execArgv: ['--no-webstorage'],
          },
        },
      }
    : {};

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    target: 'ES2020',
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-phaser': ['phaser', 'eventemitter3'],
        },
      },
    },
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Wild Haggis Survivors',
        short_name: 'Haggis',
        description: 'A Vampire Survivors-style browser game with Scottish flair',
        theme_color: '#1a1a2e',
        background_color: '#1a1a2e',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
  test: {
    globals: false,
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts'],
    ...vitestNoWebStorage,
  },
});
