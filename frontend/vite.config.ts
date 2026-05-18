/**
 * @module vite-config
 *
 * Vite configuration for the frontend package.
 * Defines debug feature flags and API proxy settings for local development.
 *
 * @packageDocumentation
 */

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Frontend Vite configuration.
 * @param env Active Vite environment including mode.
 * @returns Vite configuration object for build and dev server behavior.
 */
const viteConfig = defineConfig(({ mode: envMode }) => ({
  plugins: [react()],
  define: {
    __BCKTRCK_DEBUG__: JSON.stringify(envMode !== 'production')
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

export default viteConfig
