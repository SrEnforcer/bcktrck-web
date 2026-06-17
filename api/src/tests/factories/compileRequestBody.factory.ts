/**
 * Typed factory for API compile request payloads used in test suites.
 */
export type CompileRequestBody = Readonly<{
  readonly source: string
  readonly effectiveSubtreeId: string | null
  readonly effectiveSubtreeIds: ReadonlyArray<string> | null
  readonly collapsedSubtreeRootIds: ReadonlyArray<string> | null
  readonly styleSource: string | null
  readonly ignoreSourceStyle: boolean
}>

/**
 * Builds a compile request body with deterministic defaults and an explicit source.
 * @param input Factory input carrying source text.
 * @returns Fully populated compile request payload.
 */
export const makeCompileRequestBody = (
  input: Readonly<{ readonly source: string }>,
): CompileRequestBody => ({
  source: input.source,
  effectiveSubtreeId: null,
  effectiveSubtreeIds: null,
  collapsedSubtreeRootIds: null,
  styleSource: null,
  ignoreSourceStyle: false,
})

/**
 * Builds a compile payload missing the required `source` field for 422 tests.
 * @returns Invalid compile request payload without source.
 */
export const makeCompileRequestBodyMissingSource = (): Readonly<Record<string, unknown>> => ({
  effectiveSubtreeId: null,
  effectiveSubtreeIds: null,
  collapsedSubtreeRootIds: null,
  styleSource: null,
  ignoreSourceStyle: false,
})
