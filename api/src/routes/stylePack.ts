import {
  apiErrorToResponse,
  extractContext,
  fromZodError,
  notFoundError,
  okResponse,
  type RawHandler,
} from '@tsfpp/boundary'
import { getStylePack } from '@bcktrck/engine'
import { fromNullable, isNone } from '@tsfpp/prelude'
import { z } from 'zod'

const StylePackRequestSchema = z.object({
  choice: z.string().min(1),
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
 * Resolve style pack content by choice so web clients can keep engine access behind HTTP.
 * @param req Fetch API request.
 * @returns HTTP response with style pack text.
 */
export const stylePackHandler: RawHandler = async (req): Promise<Response> => {
  // PUBLIC: editor style-pack endpoint for local development.
  const ctx = extractContext(req, '/api/style-pack')
  const rawBody = await req.json().catch(() => null)
  const parsedBody = StylePackRequestSchema.safeParse(rawBody)

  if (!parsedBody.success) {
    return apiErrorToResponse(fromZodError(toBoundaryZodError(parsedBody.error.issues)), ctx)
  }

  const packText = fromNullable(getStylePack(parsedBody.data.choice))
  if (isNone(packText)) {
    return apiErrorToResponse(notFoundError('style_pack', parsedBody.data.choice), ctx)
  }

  return okResponse({ packText: packText.value }, { 'X-Request-Id': ctx.traceId })
}
