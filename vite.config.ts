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
       // Enable sourcemaps for the build to help debug the ReferenceError
       // Remember to set this back to false for final production deployment if bundle size is a concern
       sourcemap: true,
       rollupOptions: {
         output: {
           // manualChunks is currently removed for debugging this initialization issue
         }
       }
     }
   }));
