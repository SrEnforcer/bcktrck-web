/**
 * @module api-server
 *
 * Node HTTP adapter for bcktrck API routes.
 * Bridges Node transport details into fetch-compatible handlers with boundary-safe responses.
 *
 * @packageDocumentation
 */

import http from 'node:http'
import { compileHandler } from './routes/compile'
import { parseApiConfig } from './config'
import { stylePackHandler } from './routes/stylePack'
import { subtreesHandler } from './routes/subtrees'
import { bodyBytes, toHeadersInit } from './httpAdapter'
import {
  apiErrorToResponse,
  baselineSecurityHeaders,
  extractContext,
  mkValidationError,
  mkProblem,
  mkNotFoundError,
  okResponse,
  problemResponse,
  mkRateLimitError,
  rateLimitHeaders,
  type RateLimitState,
  type RawHandler,
} from '@tsfpp/boundary'
import { fromNullable, getOrElseOption, isErr, isNone, mapOption, pipe } from '@tsfpp/prelude'

const configResult = parseApiConfig(process.env)

if (isErr(configResult)) {
  process.stderr.write(`[bcktrck-api] invalid config: ${configResult.error.summary}\n`)
  process.exit(1)
}

const config = configResult.value
const host = config.host
const port = config.port
const maxBodyBytes = config.maxBodyBytes
const requestTimeoutMs = config.requestTimeoutMs
const rateLimitWindowMs = config.rateLimitWindowMs
const rateLimitMaxRequests = config.rateLimitMaxRequests

type RateLimitBucket = {
  readonly count: number
  readonly resetAtMs: number
}

type FetchRequestResult =
  | { readonly kind: 'request'; readonly request: Request }
  | { readonly kind: 'response'; readonly response: Response }

// DEVIATION(1.9): Adapter-scoped in-memory storage requires Map construction.
// eslint-disable-next-line no-restricted-syntax
const rateLimitBuckets = new Map<string, RateLimitBucket>()

const badRequest = (request: Request, code: string, title: string): Response => {
  const ctx = extractContext(request, '/api/*')
  return apiErrorToResponse(mkValidationError([{ field: 'body', issue: code }], title), ctx)
}

const payloadTooLarge = (request: Request): Response => {
  const ctx = extractContext(request, '/api/*')
  // DEVIATION(8.1): Payload-too-large requires HTTP 413, which is not represented in the canonical ApiError taxonomy.
  return problemResponse(mkProblem({
    status: 413,
    code: 'payload_too_large',
    title: 'Request payload exceeds configured limit',
    traceId: ctx.traceId,
    opts: { instance: ctx.url },
  }))
}

const toRequestUrl = (req: http.IncomingMessage): URL => {
  const protocol = 'http'
  const requestHost = pipe(fromNullable(req.headers.host), getOrElseOption(() => `localhost:${port}`))
  // DEVIATION(1.9): Node HTTP adapter requires URL construction to bridge IncomingMessage to Fetch Request.
  // eslint-disable-next-line no-restricted-syntax
  return new URL(pipe(fromNullable(req.url), getOrElseOption(() => '/')), `${protocol}://${requestHost}`)
}

const toRequestShell = (req: http.IncomingMessage): Request => {
  const requestUrl = toRequestUrl(req)
  const method = pipe(fromNullable(req.method), getOrElseOption(() => 'GET'))
  // DEVIATION(1.9): Node HTTP adapter requires Request construction to bridge IncomingMessage to Fetch Request.
  // eslint-disable-next-line no-restricted-syntax
  return new Request(requestUrl, {
    method,
    headers: toHeadersInit(req.headers),
    body: null,
  })
}

const validateContentLength = (req: http.IncomingMessage): { readonly kind: 'ok' } | { readonly kind: 'invalid' } | { readonly kind: 'too_large' } => {
  const contentLengthRaw = req.headers['content-length']
  const contentLength = fromNullable(contentLengthRaw)

  if (isNone(contentLength)) {
    return { kind: 'ok' }
  }

  const parsedContentLength = typeof contentLength.value === 'string'
    ? Number.parseInt(contentLength.value, 10)
    : NaN

  if (Number.isNaN(parsedContentLength)) {
    return { kind: 'invalid' }
  }

  return parsedContentLength > maxBodyBytes ? { kind: 'too_large' } : { kind: 'ok' }
}

const getClientKey = (req: http.IncomingMessage): string => {
  const forwardedFor = req.headers['x-forwarded-for']

  if (typeof forwardedFor === 'string') {
    const first = pipe(fromNullable(forwardedFor.split(',').at(0)), getOrElseOption(() => ''))
    const normalized = first.trim()
    return normalized.length > 0 ? normalized : 'anonymous'
  }

  if (Array.isArray(forwardedFor)) {
    const first = pipe(fromNullable(forwardedFor.at(0)), getOrElseOption(() => ''))
    const normalized = first.trim()
    return normalized.length > 0 ? normalized : 'anonymous'
  }

  const socketAddress = pipe(fromNullable(req.socket.remoteAddress), getOrElseOption(() => ''))
  return socketAddress.length > 0 ? socketAddress : 'anonymous'
}

const computeRateLimitState = (key: string): { readonly state: RateLimitState; readonly exceeded: boolean } => {
  const now = Date.now()
  const existing = rateLimitBuckets.get(key)
  const existingOption = fromNullable(existing)
  const needsReset = isNone(existingOption) || now >= existingOption.value.resetAtMs
  const nextBucket = needsReset
    ? { count: 1, resetAtMs: now + rateLimitWindowMs }
    : {
      count: pipe(existingOption, mapOption((bucket) => bucket.count + 1), getOrElseOption(() => 1)),
      resetAtMs: pipe(existingOption, mapOption((bucket) => bucket.resetAtMs), getOrElseOption(() => now + rateLimitWindowMs))
    }
  // DEVIATION(2.4): In-memory adapter rate limiter requires state updates between requests.
  // eslint-disable-next-line functional/immutable-data
  rateLimitBuckets.set(key, nextBucket)

  const remaining = Math.max(rateLimitMaxRequests - nextBucket.count, 0)
  const state: RateLimitState = {
    limit: rateLimitMaxRequests,
    remaining,
    // DEVIATION(1.9): Date object construction is required for boundary rate-limit header format.
    // eslint-disable-next-line no-restricted-syntax
    resetAt: new Date(nextBucket.resetAtMs),
  }

  return { state, exceeded: nextBucket.count > rateLimitMaxRequests }
}

const toFetchRequest = async (req: http.IncomingMessage): Promise<FetchRequestResult> => {
  const requestShell = toRequestShell(req)
  const method = requestShell.method
  const contentLengthValidation = validateContentLength(req)

  if (contentLengthValidation.kind === 'invalid') {
    return { kind: 'response', response: badRequest(requestShell, 'invalid_content_length', 'Content-Length must be numeric') }
  }

  if (contentLengthValidation.kind === 'too_large') {
    return { kind: 'response', response: payloadTooLarge(requestShell) }
  }

  const chunks = await Array.fromAsync<Buffer | string>(req)
  const totalBytes = bodyBytes(chunks)

  if (totalBytes > maxBodyBytes) {
    return { kind: 'response', response: payloadTooLarge(requestShell) }
  }

  const bodyBuffer = chunks.length > 0
    ? Buffer.concat(chunks.map((chunk) => (typeof chunk === 'string' ? Buffer.from(chunk) : chunk)))
    : undefined
  const requestBodyOption = pipe(
    fromNullable(bodyBuffer),
    mapOption((value) => value.toString('utf8')),
  )
  const requestBody = getOrElseOption(() => '')(requestBodyOption)

  return {
    kind: 'request',
    // DEVIATION(1.9): Node HTTP adapter requires Request construction to bridge IncomingMessage to Fetch Request.
    // eslint-disable-next-line no-restricted-syntax
    request: new Request(requestShell, {
      method,
      body: method === 'GET' || method === 'HEAD'
        ? null
        : requestBody,
    }),
  }
}

const notFound = (request: Request): Response => {
  const ctx = extractContext(request, '/api/*')
  // DEVIATION(1.9): Adapter must parse URL for route extraction.
  // eslint-disable-next-line no-restricted-syntax
  const path = new URL(request.url).pathname
  return apiErrorToResponse(mkNotFoundError('route', path), ctx)
}

/**
 * Dispatch a fetch request to API route handlers.
 * @param request Incoming fetch-compatible request.
 * @returns Routed response.
 */
export const routeRequest: RawHandler = async (request): Promise<Response> => {
  // DEVIATION(1.9): Adapter must parse URL for route dispatch.
  // eslint-disable-next-line no-restricted-syntax
  const url = new URL(request.url)

  if (request.method === 'POST' && url.pathname === '/api/compile') {
    return compileHandler(request)
  }

  if (request.method === 'POST' && url.pathname === '/api/subtrees') {
    return subtreesHandler(request)
  }

  if (request.method === 'POST' && url.pathname === '/api/style-pack') {
    return stylePackHandler(request)
  }

  if (request.method === 'GET' && url.pathname === '/api/health') {
    return okResponse({ ok: true })
  }

  return notFound(request)
}

const writeResponse = async (
  res: http.ServerResponse,
  response: Response,
  extraHeaders: Readonly<Record<string, string>>,
): Promise<void> => {
  const headers = {
    ...baselineSecurityHeaders,
    ...extraHeaders,
    ...Object.fromEntries(response.headers.entries())
  }
  res.writeHead(response.status, headers)

  const body = await response.arrayBuffer()
  const buffer = Buffer.from(body)
  res.end(buffer)
}

const handleNodeRequest = (req: http.IncomingMessage, res: http.ServerResponse): void => {
  void (async (): Promise<void> => {
    const requestResult = await toFetchRequest(req)

    if (requestResult.kind === 'response') {
      await writeResponse(res, requestResult.response, {})
      return
    }

    const request = requestResult.request
    const clientKey = getClientKey(req)
    const { state, exceeded } = computeRateLimitState(clientKey)
    const rateLimitStateHeaders = rateLimitHeaders(state)

    if (exceeded) {
      const ctx = extractContext(request, '/api/*')
      const limited = apiErrorToResponse(mkRateLimitError(Math.ceil((state.resetAt.getTime() - Date.now()) / 1_000)), ctx)
      await writeResponse(res, limited, rateLimitStateHeaders)
      return
    }

    const response = await routeRequest(request)
    await writeResponse(res, response, rateLimitStateHeaders)
  })()
}

/**
 * Build the Node HTTP server bound to the fetch-adapter request handler.
 * @returns Configured Node HTTP server instance.
 */
export const createApiServer = (): http.Server => http.createServer(
  {
    requestTimeout: requestTimeoutMs,
    headersTimeout: requestTimeoutMs,
  },
  handleNodeRequest,
)

const server = createApiServer()

if (config.nodeEnv !== 'test') {
  server.listen(port, host, () => {
    const endpoint = `http://${host}:${port}`
    process.stdout.write(`[bcktrck-api] listening on ${endpoint}\n`)
  })
}
