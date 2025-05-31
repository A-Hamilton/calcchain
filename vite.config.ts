import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc'; // Using SWC for faster builds
import { visualizer } from 'rollup-plugin-visualizer'; // To analyze bundle sizes

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => { // Add mode to access environment
  const isProduction = mode === 'production';

  return {
    plugins: [
      react(),
      // Add visualizer plugin only in non-production modes or when specifically enabled
      // To run: `vite build --mode analyze` (or similar, then open the stats.html)
      !isProduction ? visualizer({
        filename: 'dist/stats.html', // Output stats file to dist directory
        open: true, // Automatically open in browser
        gzipSize: true,
        brotliSize: true,
      }) : undefined,
    ].filter(Boolean), // Filter out undefined plugins
    build: {
      rollupOptions: {
        output: {
          manualChunks(id, { getModuleInfo }) {
            // Group major libraries into their own chunks
            // Temporarily comment out or remove these blocks
            /*
            if (id.includes('node_modules/@mui/material')) {
              return 'vendor-mui-material';
            }
            if (id.includes('node_modules/@mui/icons-material')) {
              return 'vendor-mui-icons';
            }
            */
            // Emotion, React, ReactDOM chunks should still be commented out from previous steps
            /*
            if (id.includes('node_modules/@emotion')) {
              return 'vendor-emotion';
            }
            */
            if (id.includes('node_modules/framer-motion')) {
              return 'vendor-framer-motion';
            }
            /*
            if (id.includes('node_modules/react-dom')) {
              return 'vendor-react-dom';
            }
            if (id.includes('node_modules/react')) {
              return 'vendor-react';
            }
            */
            // Catch-all for other node_modules
            if (id.includes('node_modules')) {
              return 'vendor-others';
            }
          },
        },
      },
      // ...
    },

    server: {
      port: 3000, // Or your preferred port
    },
  };
});
