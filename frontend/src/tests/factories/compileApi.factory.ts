import type { UseCompiledSvgInput } from '../../hooks/useCompiledSvg'

type CompileSuccessApiPayload = Readonly<{
  readonly result: Readonly<{
    readonly ok: true
    readonly svg: string
    readonly viewBox: Readonly<{
      readonly x: number
      readonly y: number
      readonly width: number
      readonly height: number
    }>
  }>
}>

type CompileParseErrorApiPayload = Readonly<{
  readonly result: Readonly<{
    readonly ok: false
    readonly parseError: Readonly<{
      readonly line: number
      readonly col: number
      readonly error: string
    }>
    readonly resolveErrors: ReadonlyArray<unknown>
  }>
}>

type CompileResolveErrorsApiPayload = Readonly<{
  readonly result: Readonly<{
    readonly ok: false
    readonly parseError: null
    readonly resolveErrors: ReadonlyArray<Readonly<{
      readonly line: number
      readonly col: number
      readonly message: string
    }>>
  }>
}>

/**
 * Builds deterministic hook input for compile API tests.
 * @param input Source text for the compile request.
 * @returns Hook input payload.
 */
export const makeUseCompiledSvgInput = (
  input: Readonly<{ readonly source: string }>,
): UseCompiledSvgInput => ({
  source: input.source,
  effectiveSubtreeId: undefined,
  effectiveSubtreeIds: undefined,
  styleSource: undefined,
  ignoreSourceStyle: false,
  suppressVisualHints: false,
})

/**
 * Builds a successful compile API payload.
 * @returns Success payload.
 */
export const makeCompileSuccessApiPayload = (): CompileSuccessApiPayload => ({
  result: {
    ok: true,
    svg: '<svg><rect/></svg>',
    viewBox: { x: 0, y: 0, width: 100, height: 80 },
  },
})

/**
 * Builds a parse-error compile API payload.
 * @returns Parse-error payload.
 */
export const makeCompileParseErrorApiPayload = (): CompileParseErrorApiPayload => ({
  result: {
    ok: false,
    parseError: {
      line: 1,
      col: 5,
      error: 'Expected indent',
    },
    resolveErrors: [],
  },
})

/**
 * Builds a resolve-errors compile API payload.
 * @returns Resolve-errors payload.
 */
export const makeCompileResolveErrorsApiPayload = (): CompileResolveErrorsApiPayload => ({
  result: {
    ok: false,
    parseError: null,
    resolveErrors: [{ line: 2, col: 3, message: 'invalid ref' }],
  },
})

/**
 * Builds expected API-unavailable resolve errors for hook assertions.
 * @returns Deterministic unavailable-message resolve errors.
 */
export const makeApiUnavailableResolveErrors = (): ReadonlyArray<Readonly<{
  readonly line: number
  readonly col: number
  readonly message: string
}>> => [{ line: 0, col: 0, message: 'Compile API unavailable. Start @bcktrck/api and retry.' }]
