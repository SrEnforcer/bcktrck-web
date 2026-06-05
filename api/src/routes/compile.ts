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
  suppressVisualHints: z.boolean().optional(),
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

type CompileRequestBody = z.infer<typeof CompileRequestSchema>
type CompileRequestParse = ReturnType<typeof CompileRequestSchema.safeParse>

type CompileInvocation = Readonly<{
  readonly source: string
  readonly renderConfig: Readonly<Record<string, unknown>>
  readonly options: CompileOptionsInput
}>

const ICON_SUPPRESSION_STYLE_SOURCE = 'style\n  .node\n    icon-opacity: 0'

const suppressNewVisualHints = (source: string): string => source.replace(/\s*!new(?::[^\s\]]+)?(?=\s|$)/gm, '')

const withSuppressedIconsStyle = (styleSource: string | null): string => {
  const baseStyleSource = pipe(fromNullable(styleSource), getOrElse(() => ''))
  return baseStyleSource.length > 0
    ? `${baseStyleSource}\n\n${ICON_SUPPRESSION_STYLE_SOURCE}`
    : ICON_SUPPRESSION_STYLE_SOURCE
}

const withSuppressedVisualHintsRenderConfig = (): Readonly<Record<string, unknown>> => ({
  ...previewConfig,
  showSubordinateCount: false,
})

const decodeCompileRequest = async (req: Request): Promise<CompileRequestParse> => {
  const bodyResult = await tryCatchAsync(
    () => req.json(),
    (cause) => cause,
  )
  const rawBody = isOk(bodyResult) ? bodyResult.value : {}
  return CompileRequestSchema.safeParse(rawBody)
}

const buildCompileOptions = (input: Readonly<{
  readonly ignoreSourceStyle: boolean
  readonly effectiveSubtreeId: string | null
  readonly effectiveSubtreeIds: ReadonlyArray<string> | null
  readonly styleSource: string | null
}>): CompileOptionsInput => ({
  ignoreSourceStyle: input.ignoreSourceStyle,
  ...pipe(
    fromNullable(input.effectiveSubtreeId),
    mapO((subtreeId) => ({ subtreeId })),
    getOrElse(() => ({})),
  ),
  ...pipe(
    fromNullable(input.effectiveSubtreeIds),
    mapO((subtreeIds) => ({ subtreeIds })),
    getOrElse(() => ({})),
  ),
  ...pipe(
    fromNullable(input.styleSource),
    mapO((styleSource) => ({ styleSource })),
    getOrElse(() => ({})),
  ),
})

const toCompileInvocation = (body: CompileRequestBody): CompileInvocation => {
  const suppressVisualHints = body.suppressVisualHints === true
  const source = suppressVisualHints ? suppressNewVisualHints(body.source) : body.source
  const styleSource = suppressVisualHints
    ? withSuppressedIconsStyle(body.styleSource)
    : body.styleSource
  const renderConfig = suppressVisualHints
    ? withSuppressedVisualHintsRenderConfig()
    : previewConfig

  return {
    source,
    renderConfig,
    options: buildCompileOptions({
      ignoreSourceStyle: body.ignoreSourceStyle,
      effectiveSubtreeId: body.effectiveSubtreeId,
      effectiveSubtreeIds: body.effectiveSubtreeIds,
      styleSource,
    }),
  }
}

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
  const parsedBody = await decodeCompileRequest(req)

  if (!parsedBody.success) {
    return apiErrorToResponse(fromZodError(toBoundaryZodLikeError(parsedBody.error.issues)), ctx)
  }

  const compileInvocation = toCompileInvocation(parsedBody.data)

  const compiled = tryCatch(
    () => compile(compileInvocation.source, compileInvocation.renderConfig, compileInvocation.options),
    (cause) => internalError(cause),
  )

  if (isErr(compiled)) {
    return apiErrorToResponse(compiled.error, ctx)
  }

  return okResponse({ result: compiled.value }, { 'X-Request-Id': ctx.traceId })
}
