import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  define: {
    __BCKTRCK_DEBUG__: JSON.stringify(mode !== 'production')
  },
  optimizeDeps: {
    exclude: ['@bcktrck/engine']
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true
      }
    }
  }
}))
