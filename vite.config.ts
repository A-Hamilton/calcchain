import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import viteCompression from 'vite-plugin-compression';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig(({ command }) => ({
  plugins: [
    react(),
    viteCompression({
      verbose: true,
      disable: command !== 'build',
      threshold: 10240,
      algorithm: 'gzip',
      ext: '.gz',
    }),
    command === 'build' && visualizer({
      open: true,
      filename: 'dist/stats.html',
      gzipSize: true,
      brotliSize: true,
    }),
  ].filter(Boolean),
  server: {
    port: 3000,
    open: true,
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  build: {
    sourcemap: command === 'build' ? false : 'inline', // Sourcemaps for dev, off for prod build
    rollupOptions: {
      output: {
        // Temporarily simplify or remove manualChunks for debugging the ReferenceError
        // This will create larger default chunks but might resolve initialization order issues.
        // If this fixes the ReferenceError, we can re-introduce manualChunks more carefully.
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // A very basic vendor chunking strategy
            if (id.includes('@mui') || id.includes('@emotion')) {
              return 'vendor-mui-emotion';
            }
            if (id.includes('framer-motion')) {
              return 'vendor-framer-motion';
            }
            return 'vendor-others';
          }
        }
      }
    }
  }
}));
