/**
 * @module api-routes-compile
 *
 * HTTP boundary adapter for compile requests used by the bcktrck editor preview.
 * Converts transport input into validated engine calls and maps outcomes to RFC9457 responses.
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
import { compile, defaultRenderConfig } from '@bcktrck/engine'
import { fromNullable, getOrElse, isErr, isOk, mapO, pipe, tryCatch, tryCatchAsync } from '@tsfpp/prelude'
import { z } from 'zod'

const CompileRequestSchema = z.object({
  source: z.string(),
  effectiveSubtreeId: z.string().min(1).nullable(),
  effectiveSubtreeIds: z.array(z.string().min(1)).nullable(),
  styleSource: z.string().min(1).nullable(),
  ignoreSourceStyle: z.boolean(),
}).strict()

const previewConfig = {
  ...defaultRenderConfig,
  nodeSize: 0.68,
  staffSize: 0.68,
  colWidth: 220,
  rowHeight: 130,
  edgeStroke: '#1f2937',
  dottedEdgeStroke: '#0b5fff',
  fontSize: 11,
  showSubordinateCount: true,
  subordinateCountBadgeFill: '#0b5fff',
  subordinateCountBadgeText: '#ffffff',
  subordinateCountBadgeFontScale: 0.82,
} as const satisfies Readonly<Record<string, unknown>>

type CompileOptionsInput = Readonly<{
  readonly ignoreSourceStyle: boolean
  readonly subtreeId?: string
  readonly subtreeIds?: ReadonlyArray<string>
  readonly styleSource?: string
}>

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
 * Compile request payload into an SVG-ready compile result consumed by the web editor.
 * @param req Fetch API request.
 * @returns HTTP response with compile result or RFC9457 error.
 */
export const compileHandler: RawHandler = async (req): Promise<Response> => {
  // PUBLIC: editor compile endpoint for local development.
  const ctx = extractContext(req, '/api/compile')
  const bodyResult = await tryCatchAsync(
    () => req.json(),
    (cause) => cause,
  )
  const rawBody = isOk(bodyResult) ? bodyResult.value : {}
  const parsedBody = CompileRequestSchema.safeParse(rawBody)

  if (!parsedBody.success) {
    return apiErrorToResponse(fromZodError(toBoundaryZodLikeError(parsedBody.error.issues)), ctx)
  }

  const compileOptions: CompileOptionsInput = {
    ignoreSourceStyle: parsedBody.data.ignoreSourceStyle,
    ...pipe(
      fromNullable(parsedBody.data.effectiveSubtreeId),
      mapO((subtreeId) => ({ subtreeId })),
      getOrElse(() => ({})),
    ),
    ...pipe(
      fromNullable(parsedBody.data.effectiveSubtreeIds),
      mapO((subtreeIds) => ({ subtreeIds })),
      getOrElse(() => ({})),
    ),
    ...pipe(
      fromNullable(parsedBody.data.styleSource),
      mapO((styleSource) => ({ styleSource })),
      getOrElse(() => ({})),
    ),
  }

  const compiled = tryCatch(
    () => compile(parsedBody.data.source, previewConfig, compileOptions),
    (cause) => internalError(cause),
  )

  if (isErr(compiled)) {
    return apiErrorToResponse(compiled.error, ctx)
  }

  return okResponse({ result: compiled.value }, { 'X-Request-Id': ctx.traceId })
}
