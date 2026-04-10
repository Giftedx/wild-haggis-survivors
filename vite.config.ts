import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
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
