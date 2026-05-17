import http from 'node:http'
import { compileHandler } from './routes/compile'
import { stylePackHandler } from './routes/stylePack'
import { subtreesHandler } from './routes/subtrees'
import {
  apiErrorToResponse,
  extractContext,
  mkProblem,
  notFoundError,
  okResponse,
  problemResponse,
  rateLimitError,
  rateLimitHeaders,
  type RateLimitState,
  type RawHandler,
} from '@tsfpp/boundary'
import { fromNullable, getOrElse, isNone, mapO, pipe } from '@tsfpp/prelude'

const host = pipe(fromNullable(process.env['HOST']), getOrElse(() => '0.0.0.0'))
const portValue = pipe(fromNullable(process.env['PORT']), getOrElse(() => '8787'))
const port = Number.parseInt(portValue, 10)
const maxBodyBytes = Number.parseInt(pipe(fromNullable(process.env['MAX_BODY_BYTES']), getOrElse(() => '262144')), 10)
const requestTimeoutMs = Number.parseInt(pipe(fromNullable(process.env['REQUEST_TIMEOUT_MS']), getOrElse(() => '10000')), 10)
const rateLimitWindowMs = Number.parseInt(pipe(fromNullable(process.env['RATE_LIMIT_WINDOW_MS']), getOrElse(() => '60000')), 10)
const rateLimitMaxRequests = Number.parseInt(pipe(fromNullable(process.env['RATE_LIMIT_MAX_REQUESTS']), getOrElse(() => '120')), 10)

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
  return problemResponse(mkProblem(400, code, title, ctx.traceId, { instance: ctx.url }))
}

const payloadTooLarge = (request: Request): Response => {
  const ctx = extractContext(request, '/api/*')
  return problemResponse(mkProblem(413, 'payload_too_large', 'Request payload exceeds configured limit', ctx.traceId, {
    instance: ctx.url,
  }))
}

const toRequestUrl = (req: http.IncomingMessage): URL => {
  const protocol = 'http'
  const requestHost = pipe(fromNullable(req.headers.host), getOrElse(() => `localhost:${port}`))
  // DEVIATION(1.9): Node HTTP adapter requires URL construction to bridge IncomingMessage to Fetch Request.
  // eslint-disable-next-line no-restricted-syntax
  return new URL(pipe(fromNullable(req.url), getOrElse(() => '/')), `${protocol}://${requestHost}`)
}

const toRequestShell = (req: http.IncomingMessage): Request => {
  const requestUrl = toRequestUrl(req)
  const method = pipe(fromNullable(req.method), getOrElse(() => 'GET'))
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

const bodyBytes = (chunks: ReadonlyArray<Buffer | string>): number => chunks.reduce(
  (sum, chunk) => sum + (typeof chunk === 'string' ? Buffer.byteLength(chunk) : chunk.length),
  0,
)

const getClientKey = (req: http.IncomingMessage): string => {
  const forwardedFor = req.headers['x-forwarded-for']

  if (typeof forwardedFor === 'string') {
    const first = pipe(fromNullable(forwardedFor.split(',').at(0)), getOrElse(() => ''))
    const normalized = first.trim()
    return normalized.length > 0 ? normalized : 'anonymous'
  }

  if (Array.isArray(forwardedFor)) {
    const first = pipe(fromNullable(forwardedFor.at(0)), getOrElse(() => ''))
    const normalized = first.trim()
    return normalized.length > 0 ? normalized : 'anonymous'
  }

  const socketAddress = pipe(fromNullable(req.socket.remoteAddress), getOrElse(() => ''))
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
      count: pipe(existingOption, mapO((bucket) => bucket.count + 1), getOrElse(() => 1)),
      resetAtMs: pipe(existingOption, mapO((bucket) => bucket.resetAtMs), getOrElse(() => now + rateLimitWindowMs))
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

const toHeadersInit = (headers: http.IncomingHttpHeaders): HeadersInit => {
  const initialHeaders: Record<string, string> = {}

  return Object.entries(headers).reduce((acc, [key, value]) => {
    if (typeof value === 'string') {
      return { ...acc, [key]: value }
    }

    if (Array.isArray(value) && value.length > 0) {
      return { ...acc, [key]: value.join(',') }
    }

    return acc
  }, initialHeaders)
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
  const requestBody = pipe(
    fromNullable(bodyBuffer),
    mapO((value) => value.toString('utf8')),
    getOrElse((): string | null => null)
  )

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
  return apiErrorToResponse(notFoundError('route', path), ctx)
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
  const headers = { ...extraHeaders, ...Object.fromEntries(response.headers.entries()) }
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
      const limited = apiErrorToResponse(rateLimitError(Math.ceil((state.resetAt.getTime() - Date.now()) / 1_000)), ctx)
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

if (process.env['NODE_ENV'] !== 'test') {
  server.listen(port, host, () => {
    const endpoint = `http://${host}:${port}`
    process.stdout.write(`[bcktrck-api] listening on ${endpoint}\n`)
  })
}
