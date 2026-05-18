import { once } from 'node:events'
import { promisify } from 'node:util'
import type http from 'node:http'
import { fromNullable, isErr, isNone, tryCatchAsync } from '@tsfpp/prelude'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { makeCompileRequestBody } from './tests/factories/compileRequestBody.factory'

const closeServer = async (server: http.Server): Promise<void> => {
  const close = promisify(server.close.bind(server))
  await close()
}

const withServer = async (
  maxBodyBytes: string,
  maxRequests: string,
  run: (baseUrl: string) => Promise<void>,
): Promise<void> => {
  const { server, baseUrl } = await startTestServer(maxBodyBytes, maxRequests)

  const runResult = await tryCatchAsync(
    () => run(baseUrl),
    (cause) => cause,
  )
  const closeResult = await tryCatchAsync(
    () => closeServer(server),
    (cause) => cause,
  )

  expect(isErr(closeResult)).toBe(false)
  expect(isErr(runResult)).toBe(false)
}

const startTestServer = async (
  maxBodyBytes: string,
  maxRequests: string,
): Promise<{ readonly server: http.Server; readonly baseUrl: string }> => {
  vi.stubEnv('NODE_ENV', 'test')
  vi.stubEnv('MAX_BODY_BYTES', maxBodyBytes)
  vi.stubEnv('RATE_LIMIT_MAX_REQUESTS', maxRequests)
  vi.stubEnv('RATE_LIMIT_WINDOW_MS', '60000')

  vi.resetModules()
  const mod = await import('./server')
  const server = mod.createApiServer()

  server.listen(0, '127.0.0.1')
  await once(server, 'listening')

  const address = server.address()
  const addressOption = fromNullable(address)
  if (isNone(addressOption) || typeof addressOption.value === 'string') {
    expect.unreachable('Expected address info')
    return {
      server,
      baseUrl: 'http://127.0.0.1:0',
    }
  }

  return {
    server,
    baseUrl: `http://127.0.0.1:${addressOption.value.port}`,
  }
}

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('api server', () => {
  it('returns 200 for the health endpoint', async () => {
    await withServer('262144', '120', async (baseUrl) => {
      const health = await fetch(`${baseUrl}/api/health`)

      expect(health.status).toBe(200)
    })
  })

  it('returns 404 for an unknown endpoint', async () => {
    await withServer('262144', '120', async (baseUrl) => {
      const unknown = await fetch(`${baseUrl}/api/unknown`)

      expect(unknown.status).toBe(404)
    })
  })

  it('returns payload too large for oversized request bodies', async () => {
    await withServer('64', '120', async (baseUrl) => {
      const res = await fetch(`${baseUrl}/api/compile`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(makeCompileRequestBody({ source: 'x'.repeat(300) })),
      })

      expect(res.status).toBe(413)
    })
  })

  it('returns rate-limit response when request budget is exceeded', async () => {
    await withServer('262144', '1', async (baseUrl) => {
      const first = await fetch(`${baseUrl}/api/health`, {
        headers: { 'x-forwarded-for': '10.0.0.8' },
      })
      const second = await fetch(`${baseUrl}/api/health`, {
        headers: { 'x-forwarded-for': '10.0.0.8' },
      })

      expect(first.status).toBe(200)
      expect(second.status).toBe(429)
    })
  })
})
