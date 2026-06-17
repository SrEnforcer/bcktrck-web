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
  collapsedSubtreeRootIds: z.array(z.string().min(1)).nullable().optional(),
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

const leadingIndent = (line: string): number => {
  const prefix = line.match(/^[ \t]*/)?.[0] ?? ''
  return prefix.replace(/\t/g, '  ').length
}

const extractDeptHandle = (line: string): string | undefined => {
  const match = line.match(/^\s*~dept\b[^\n]*?@([A-Za-z0-9_-]+)/)
  return match !== null ? match[1] : undefined
}

const extractPersonHandle = (line: string): string | undefined => {
  const match = line.match(/\s@([A-Za-z0-9_-]+)\b/)
  return match !== null ? match[1] : undefined
}

const extractHeadHandle = (line: string): string | undefined => {
  const match = line.match(/\[head:\s*@([A-Za-z0-9_-]+)\]/)
  return match?.[1]
}

const stripHeadAttributeIfNeeded = (line: string, prunedHandles: ReadonlySet<string>): string => {
  const headHandle = extractHeadHandle(line)
  if (headHandle !== undefined && prunedHandles.has(headHandle)) {
    return line.replace(/\s*\[head:\s*@[A-Za-z0-9_-]+\]/, '')
  }
  return line
}

const isLinkLineReferencingPrunedHandle = (line: string, prunedHandles: ReadonlySet<string>): boolean => {
  const match = line.match(/^\s*@([A-Za-z0-9_-]+)\s*-->\s*@([A-Za-z0-9_-]+)/)
  if (match?.[1] === undefined || match?.[2] === undefined) return false
  return prunedHandles.has(match[1]) || prunedHandles.has(match[2])
}

const isShadowLineReferencingPrunedHandle = (line: string, prunedHandles: ReadonlySet<string>): boolean => {
  if (!line.includes('~shadow')) return false
  const match = line.match(/\[primary:\s*@([A-Za-z0-9_-]+)/)
  const primaryHandle = match?.[1]
  return primaryHandle !== undefined && prunedHandles.has(primaryHandle)
}

type PruneState = Readonly<{
  readonly kept: readonly string[]
  readonly skipIndent: number | undefined
  readonly prunedHandles: ReadonlySet<string>
  readonly keepHandles: ReadonlySet<string>
  readonly captureFirstChild: boolean
}>

const processPrunedLine = (state: PruneState, line: string): PruneState => {
  const handle = extractPersonHandle(line)
  if (handle !== undefined && state.keepHandles.has(handle)) {
    return { ...state, kept: [...state.kept, line] }
  }
  if (state.captureFirstChild && handle !== undefined && !line.includes('~dept') && !line.includes('~shadow')) {
    return { ...state, kept: [...state.kept, line], captureFirstChild: false }
  }
  if (handle !== undefined && !line.includes('~dept')) {
    // eslint-disable-next-line no-restricted-syntax -- DEVIATION(1.9): Set tracks pruned handles; mutable state is local
    return { ...state, prunedHandles: new Set(Array.from(state.prunedHandles).concat(handle)) }
  }
  return state
}

type KeptLineInput = Readonly<{ readonly state: PruneState; readonly line: string; readonly indent: number }>

const makeProcessKeptLine = (collapsedRootIds: readonly string[]) =>
  ({ state, line, indent }: KeptLineInput): PruneState => {
    const deptHandle = extractDeptHandle(line)
    const shouldStartSkipping = deptHandle !== undefined && collapsedRootIds.includes(deptHandle)
    const headHandle = shouldStartSkipping ? extractHeadHandle(line) : undefined
    // eslint-disable-next-line no-restricted-syntax -- DEVIATION(1.9): Set tracks keep handles; mutable state is local
    const nextKeepHandles = headHandle !== undefined ? new Set([...Array.from(state.keepHandles), headHandle]) : state.keepHandles
    return {
      kept: [...state.kept, line],
      skipIndent: shouldStartSkipping ? indent : undefined,
      prunedHandles: state.prunedHandles,
      keepHandles: nextKeepHandles,
      captureFirstChild: shouldStartSkipping && headHandle === undefined,
    }
  }

const pruneCollapsedSubtreeDescendantsFromSource = (
  source: string,
  collapsedRootIds: readonly string[]
): string => {
  if (collapsedRootIds.length === 0) {
    return source
  }

  const lines = source.split(/\r?\n/)
  const processKeptLine = makeProcessKeptLine(collapsedRootIds)

  // First pass: build kept lines, track pruned handles, and keep one person per collapsed root.
  // When a dept is collapsed its declared [head: @handle] person is preserved; if no head is
  // declared the first direct person child is captured instead. All other descendants are pruned.
  // eslint-disable-next-line no-restricted-syntax -- DEVIATION(1.9): Sets initialize handle tracking; mutable state is local
  const initial: PruneState = { kept: [], skipIndent: undefined, prunedHandles: new Set<string>(), keepHandles: new Set<string>(), captureFirstChild: false }
  const result = lines.reduce<PruneState>((state, line) => {
    const lineIsBlank = line.trim().length === 0
    const indent = leadingIndent(line)
    const shouldStopSkipping = !lineIsBlank && state.skipIndent !== undefined && indent <= state.skipIndent
    return state.skipIndent !== undefined && !shouldStopSkipping
      ? processPrunedLine(state, line)
      : processKeptLine({ state, line, indent })
  }, initial)

  // Second pass: strip [head: @handle] where the handle was pruned, remove link lines
  // and shadow nodes whose [primary: @handle] references a pruned handle (since those
  // nodes no longer exist in the source).
  const cleanedLines = result.kept
    .filter((line) => !isLinkLineReferencingPrunedHandle(line, result.prunedHandles))
    .filter((line) => !isShadowLineReferencingPrunedHandle(line, result.prunedHandles))
    .map((line) => stripHeadAttributeIfNeeded(line, result.prunedHandles))

  return cleanedLines.join('\n')
}

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
  const sourceWithCollapsedSubtreeRoots = pruneCollapsedSubtreeDescendantsFromSource(
    body.source,
    pipe(fromNullable(body.collapsedSubtreeRootIds), getOrElse((): readonly string[] => []))
  )
  const source = suppressVisualHints
    ? suppressNewVisualHints(sourceWithCollapsedSubtreeRoots)
    : sourceWithCollapsedSubtreeRoots
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
