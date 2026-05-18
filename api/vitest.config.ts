/**
 * @module api-vitest-config
 *
 * Vitest configuration for API package tests.
 * Binds the @bcktrck/engine import to a deterministic local test shim.
 *
 * @packageDocumentation
 */

import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

/**
 * API package Vitest runtime configuration.
 * @returns Immutable test runner configuration for node-based route tests.
 */
const vitestConfig = defineConfig({
  resolve: {
    alias: {
      // DEVIATION(1.9): URL constructor is required to resolve module-relative shim path from ESM metadata.
      // eslint-disable-next-line no-restricted-syntax
      '@bcktrck/engine': fileURLToPath(new URL('./src/test-support/engineShim.ts', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})

export default vitestConfig
