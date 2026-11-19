import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('monaco-editor') || id.includes('@monaco-editor')) return 'monaco';
          if (id.includes('react-dom') || id.includes('react-router-dom') || (id.includes('node_modules/react/') && !id.includes('react-dom'))) return 'react-vendor';
          if (id.includes('framer-motion')) return 'framer';
          if (id.includes('lucide-react')) return 'icons';
        },
      },
    },
  },
})
