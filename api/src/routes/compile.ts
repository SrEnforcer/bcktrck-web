import {
  apiErrorToResponse,
  extractContext,
  fromZodError,
  internalError,
  okResponse,
  type RawHandler,
} from '@tsfpp/boundary'
import { compile, defaultRenderConfig } from '@bcktrck/engine'
import { fromNullable, getOrElse, isErr, pipe, tryCatch } from '@tsfpp/prelude'
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
}

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
 * Compile request payload into an SVG-ready compile result consumed by the web editor.
 * @param req Fetch API request.
 * @returns HTTP response with compile result or RFC9457 error.
 */
export const compileHandler: RawHandler = async (req): Promise<Response> => {
  // PUBLIC: editor compile endpoint for local development.
  const ctx = extractContext(req, '/api/compile')
  const rawBody = await req.json().catch(() => null)
  const parsedBody = CompileRequestSchema.safeParse(rawBody)

  if (!parsedBody.success) {
    return apiErrorToResponse(fromZodError(toBoundaryZodError(parsedBody.error.issues)), ctx)
  }

  const compiled = tryCatch(
    () => compile(parsedBody.data.source, previewConfig, {
      subtreeId: pipe(fromNullable(parsedBody.data.effectiveSubtreeId), getOrElse((): string | undefined => undefined)),
      subtreeIds: pipe(fromNullable(parsedBody.data.effectiveSubtreeIds), getOrElse((): ReadonlyArray<string> | undefined => undefined)),
      styleSource: pipe(fromNullable(parsedBody.data.styleSource), getOrElse((): string | undefined => undefined)),
      ignoreSourceStyle: parsedBody.data.ignoreSourceStyle,
    }),
    (cause) => internalError(cause),
  )

  if (isErr(compiled)) {
    return apiErrorToResponse(compiled.error, ctx)
  }

  return okResponse({ result: compiled.value }, { 'X-Request-Id': ctx.traceId })
}
