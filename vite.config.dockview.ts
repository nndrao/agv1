import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: [
      'ag-grid-community',
      'ag-grid-react',
      'ag-grid-enterprise',
      'zustand',
      'react',
      'react-dom',
      'react-error-boundary',
      '@radix-ui/react-dialog',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      'clsx',
      'tailwind-merge',
      'class-variance-authority',
      'dockview',
      'dockview-core',
    ],
    exclude: ['@vite/client', '@vite/env'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Enable minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    // Set the entry point to main-dockview.tsx
    rollupOptions: {
      input: path.resolve(__dirname, 'index-dockview.html'),
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-error-boundary'],
          'ag-grid-vendor': ['ag-grid-community', 'ag-grid-react', 'ag-grid-enterprise'],
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-select', '@radix-ui/react-tabs'],
          'dockview-vendor': ['dockview', 'dockview-core'],
          'utils': ['zustand', 'clsx', 'tailwind-merge', 'class-variance-authority'],
        },
      },
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
  },

  // Server configuration for development
  server: {
    // Warm up frequently used modules
    warmup: {
      clientFiles: [
        './src/main-dockview.tsx',
        './src/App-Dockview.tsx',
        './src/components/dockview/DockviewContainer.tsx',
        './src/components/datatable/lazy-ag-grid.tsx',
      ],
    },
  },
  
});