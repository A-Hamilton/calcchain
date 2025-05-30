import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc' // Using SWC for faster builds

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Example: Create a vendor chunk for node_modules
          if (id.includes('node_modules')) {
            // Further split large libraries if needed
            if (id.includes('@mui')) {
              return 'vendor_mui';
            }
            if (id.includes('framer-motion')) {
              return 'vendor_framer_motion';
            }
            return 'vendor'; // all other node_modules
          }
        },
      },
    },
    // Target modern browsers for smaller bundles, but ensure compatibility
    // target: 'esnext', // Or specify specific browser versions
    // sourcemap: false, // Disable sourcemaps in production for slightly smaller bundles if not needed
  },
  server: {
    port: 3000, // Or your preferred port
  }
})