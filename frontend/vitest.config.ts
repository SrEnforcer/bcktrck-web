/**
 * @module vitest-config
 *
 * Vitest configuration for frontend unit and component tests.
 * Enables jsdom environment and test file discovery patterns.
 *
 * @packageDocumentation
 */

import { defineConfig } from 'vitest/config'

/**
 * Frontend Vitest configuration.
 * @returns Vitest runtime configuration for frontend tests.
 */
const vitestConfig = defineConfig({
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

export default vitestConfig