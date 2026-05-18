/**
 * @module api-routes-subtrees
 *
 * HTTP boundary adapter for subtree extraction requests used by the bcktrck editor.
 * Performs boundary validation and forwards typed options to the engine API.
 *
 * @packageDocumentation
 */

import {
  apiErrorToResponse,
  extractContext,
  fromZodError,
  internalError,
  okResponse,
  type RawHandler,
} from '@tsfpp/boundary'
import { listSubtreesFromSource } from '@bcktrck/engine'
import { isErr, isOk, tryCatch, tryCatchAsync } from '@tsfpp/prelude'
import { z } from 'zod'

const SubtreesRequestSchema = z.object({
  source: z.string(),
  styleSource: z.string().min(1).nullable(),
  ignoreSourceStyle: z.boolean(),
}).strict()

// DEVIATION(8.2): @tsfpp/boundary@1.0.1 expects `errors` while Zod v4 exposes `issues`; this adapter preserves canonical fromZodError mapping.
const toBoundaryZodLikeError = (
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
  const bodyResult = await tryCatchAsync(
    () => req.json(),
    (cause) => cause,
  )
  const rawBody = isOk(bodyResult) ? bodyResult.value : {}
  const parsedBody = SubtreesRequestSchema.safeParse(rawBody)

  if (!parsedBody.success) {
    return apiErrorToResponse(fromZodError(toBoundaryZodLikeError(parsedBody.error.issues)), ctx)
  }

  const subtreeOptions: Readonly<{
    readonly ignoreSourceStyle: boolean
    readonly styleSource: string | null
  }> = {
    ignoreSourceStyle: parsedBody.data.ignoreSourceStyle,
    styleSource: parsedBody.data.styleSource,
  }

  const entries = tryCatch(
    () => listSubtreesFromSource(parsedBody.data.source, subtreeOptions),
    (cause) => internalError(cause),
  )

  if (isErr(entries)) {
    return apiErrorToResponse(entries.error, ctx)
  }

  return okResponse({ entries: entries.value }, { 'X-Request-Id': ctx.traceId })
}
