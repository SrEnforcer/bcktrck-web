import {
  apiErrorToResponse,
  extractContext,
  fromZodError,
  internalError,
  okResponse,
  type RawHandler,
} from '@tsfpp/boundary'
import { listSubtreesFromSource } from '@bcktrck/engine'
import { fromNullable, getOrElse, isErr, pipe, tryCatch } from '@tsfpp/prelude'
import { z } from 'zod'

const SubtreesRequestSchema = z.object({
  source: z.string(),
  styleSource: z.string().min(1).nullable(),
  ignoreSourceStyle: z.boolean(),
}).strict()

const toBoundaryZodError = (
  issues: ReadonlyArray<z.ZodIssue>,
): {
  readonly errors: ReadonlyArray<{
    readonly path: ReadonlyArray<string | number>
    readonly message: string
  }>
} => ({
  errors: issues.map((issue) => ({
    path: issue.path.filter((segment): segment is string | number =>
      typeof segment === 'string' || typeof segment === 'number',
    ),
    message: issue.message,
  })),
})

/**
 * Resolve subtree metadata from source so the web editor can isolate departments without direct engine coupling.
 * @param req Fetch API request.
 * @returns HTTP response with subtree entries or RFC9457 error.
 */
export const subtreesHandler: RawHandler = async (req): Promise<Response> => {
  // PUBLIC: editor subtree endpoint for local development.
  const ctx = extractContext(req, '/api/subtrees')
  const rawBody = await req.json().catch(() => null)
  const parsedBody = SubtreesRequestSchema.safeParse(rawBody)

  if (!parsedBody.success) {
    return apiErrorToResponse(fromZodError(toBoundaryZodError(parsedBody.error.issues)), ctx)
  }

  const entries = tryCatch(
    () => listSubtreesFromSource(parsedBody.data.source, {
      styleSource: pipe(fromNullable(parsedBody.data.styleSource), getOrElse((): string | undefined => undefined)),
      ignoreSourceStyle: parsedBody.data.ignoreSourceStyle,
    }),
    (cause) => internalError(cause),
  )

  if (isErr(entries)) {
    return apiErrorToResponse(entries.error, ctx)
  }

  return okResponse({ entries: entries.value }, { 'X-Request-Id': ctx.traceId })
}
