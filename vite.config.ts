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
      // Phaser 4 ships a strict `exports` field that only exposes the `.`
      // entry — the v3 arcade-physics subset alias
      // (`phaser/dist/phaser-arcade-physics.js`) is no longer reachable.
      // Vendor chunk grows by ~111 KB uncompressed as Matter + Box2D ride
      // along even though we never touch them. Revisit if Phaser publishes
      // a tree-shakeable build.
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    target: 'ES2020',
    // Phaser 4 vendor chunk currently ~1.66 MB raw (Matter + Box2D ride along until
    // Phaser publishes a tree-shakeable build — see resolve.alias note above).
    // Set above natural size with breathing room so the warning re-fires only on
    // genuine accidental growth.
    chunkSizeWarningLimit: 1750,
    rollupOptions: {
      output: {
        manualChunks(id): string | undefined {
          const normalized = id.replaceAll('\\', '/');
          if (
            normalized.includes('/node_modules/phaser/') ||
            normalized.includes('/node_modules/eventemitter3/')
          ) {
            return 'vendor-phaser';
          }
          if (
            normalized.includes('/src/art/sprites/') ||
            normalized.includes('/src/animation/frameDrawers/enemies/') ||
            normalized.includes('/src/entities/haggisComposition/drawers/')
          ) {
            return 'sprite-art';
          }
          return undefined;
        },
      },
    },
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      // Skip the lazy-loaded Scots overlay chunk from precache. English-only
      // players (the default locale) never download `i18n.scs-*.js`; Scots
      // users fetch it on demand via the dynamic `import('./i18n.scs')` in
      // `ensureLocaleReady` and workbox's default runtime caching keeps it
      // warm on repeat activations.
      // Dev/tool scenes are also lazy-loaded only when explicitly requested
      // (`?export`, `?devScenes=1`, or dev hotkeys), so keep them out of
      // the install-time production cache.
      workbox: {
        globIgnores: [
          '**/i18n.scs-*.js',
          '**/CombinationsPreviewScene-*.js',
          '**/SpriteExportScene-*.js',
        ],
      },
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
    // `server/worker/**` is the cloud-save Worker spike (P3). It is a
    // sibling project — not bundled by Vite, not under `src/tsconfig.json`.
    // Vitest discovers its contract tests directly. ADR 0006 + spike
    // README in `server/worker/README.md`.
    include: [
      'src/**/*.{test,spec}.ts',
      'server/worker/test/**/*.{test,spec}.ts',
    ],
    // Preloads the Scots overlay chunk so sync `setLocale('scs'); t(...)`
    // patterns in tests keep working after the W18 Scots lazy-load pass.
    // Production still fetches `./i18n.scs` dynamically on first use.
    setupFiles: ['./src/core/i18n.testSetup.ts'],
    ...vitestNoWebStorage,
  },
});
