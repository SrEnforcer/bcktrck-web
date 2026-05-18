/**
 * @module api-http-adapter
 *
 * Shared immutable helpers for Node HTTP to Fetch adapter conversion.
 * Keeps transport-level byte and header normalization isolated from routing logic.
 *
 * @packageDocumentation
 */

import type http from 'node:http'

/**
 * Compute byte size for a mixed chunk sequence from a Node request stream.
 * @param chunks Request body chunks as strings or buffers.
 * @returns Total byte size represented by the chunks.
 */
export const bodyBytes = (chunks: ReadonlyArray<Buffer | string>): number => chunks.reduce(
  (sum, chunk) => sum + (typeof chunk === 'string' ? Buffer.byteLength(chunk) : chunk.length),
  0,
)

/**
 * Normalize Node incoming headers into Fetch-compatible header init format.
 * @param headers Node incoming headers.
 * @returns Immutable key-value representation for Fetch request construction.
 */
export const toHeadersInit = (headers: http.IncomingHttpHeaders): HeadersInit =>
  Object.entries(headers).reduce<Readonly<Record<string, string>>>(
    (acc, [key, value]) => {
      if (typeof value === 'string') {
        return { ...acc, [key]: value }
      }

      if (Array.isArray(value) && value.length > 0) {
        return { ...acc, [key]: value.join(',') }
      }

      return acc
    },
    {},
  )
