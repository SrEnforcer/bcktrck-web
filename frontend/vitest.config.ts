import { defineConfig } from 'vitest/config'

export default defineConfig({
  define: {
    __BCKTRCK_DEBUG__: JSON.stringify(true)
  },
  test: {
    environment: 'jsdom',
    environmentOptions: {
      jsdom: {
        url: 'http://localhost'
      }
    },
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx']
  }
})