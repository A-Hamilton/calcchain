import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc'; // Using SWC for faster builds
import { visualizer } from 'rollup-plugin-visualizer'; // To analyze bundle sizes

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => { // Add mode to access environment
  const isProduction = mode === 'production';
  const isAnalyze = mode === 'analyze';

  return {
    plugins: [
      react(),
      // Add bundle analyzer when in analyze mode
      ...(isAnalyze ? [visualizer({ filename: 'dist/stats.html', open: true })] : []),
    ],

    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            // Keep React and React-DOM together to avoid initialization issues
            'vendor-react': ['react', 'react-dom'],
            // Group MUI with Emotion since they're tightly coupled
            'vendor-mui': [
              '@mui/material',
              '@mui/system', 
              '@mui/icons-material',
              '@mui/x-date-pickers',
              '@emotion/react',
              '@emotion/styled'
            ],
            // Chart libraries
            'vendor-charts': ['recharts'],
            // Other utilities
            'vendor-utils': ['framer-motion', 'axios', 'dayjs', 'jspdf']
          },
        },
      },
      // Enhanced build optimization with better compatibility
      target: 'es2020', // Updated for better modern browser support
      minify: isProduction ? 'terser' : false, // Only minify in production
      terserOptions: isProduction ? {
        compress: {
          drop_console: true,
          drop_debugger: true,
          passes: 1, // Single pass for stability
          pure_funcs: ['console.log'], // Remove console.log calls
        },
        mangle: {
          toplevel: false, // Prevent variable conflicts
          keep_fnames: true, // Keep function names for better debugging
        },
        format: {
          comments: false,
        },
      } : undefined,
      sourcemap: !isProduction,
      chunkSizeWarningLimit: 1000,
      cssCodeSplit: true,
      // Add explicit external dependencies handling
      assetsInlineLimit: 4096, // Inline small assets
    },

    server: {
      port: 3000,
      host: true, // Allow external connections
    },
    
    // Enhanced resolve configuration to prevent dependency conflicts
    resolve: {
      dedupe: ['react', 'react-dom', '@emotion/react', '@emotion/styled', '@mui/material'],
      alias: {
        // Ensure consistent React imports
        'react': 'react',
        'react-dom': 'react-dom',
      },
    },

    // Add optimizeDeps to handle problematic dependencies
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        '@emotion/react',
        '@emotion/styled',
        '@mui/material',
        '@mui/system',
        '@mui/icons-material',
      ],
      exclude: [],
    },
  };
});
