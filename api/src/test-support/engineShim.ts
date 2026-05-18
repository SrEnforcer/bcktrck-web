/**
 * @module api-test-engine-shim
 *
 * Test-only shim for @bcktrck/engine consumed by API unit tests.
 * Provides deterministic, minimal behavior to isolate HTTP handler logic from engine internals.
 *
 * @packageDocumentation
 */

type ParseErr = {
  readonly error: string
  readonly line: number
  readonly col: number
}

type ResolveError = {
  readonly line: number
  readonly col: number
  readonly message: string
}

type CompileOk = {
  readonly ok: true
  readonly svg: string
  readonly viewBox: {
    readonly x: number
    readonly y: number
    readonly width: number
    readonly height: number
  }
}

type CompileErr = {
  readonly ok: false
  readonly parseError: ParseErr | null
  readonly resolveErrors: ReadonlyArray<ResolveError> | null
}

type CompileResult = CompileOk | CompileErr

type CompileOptions = {
  readonly subtreeId: string | null
  readonly subtreeIds: ReadonlyArray<string> | null
  readonly styleSource: string | null
  readonly ignoreSourceStyle: boolean | null
}

/**
 * Baseline render config used by tests when no explicit override is provided.
 * @returns Immutable empty render configuration record.
 */
export const defaultRenderConfig: Readonly<Record<string, unknown>> = {}

/**
 * Return a stable successful compile result for API route tests.
 * @param _source Ignored shim parameter matching engine signature.
 * @param _renderConfig Ignored shim parameter matching engine signature.
 * @param _options Ignored shim parameter matching engine signature.
 * @returns Compile success payload with deterministic SVG metadata.
 */
export const compile = (
  _source: string,
  _renderConfig: Readonly<Record<string, unknown>> | null,
  _options: Partial<CompileOptions> | null,
): CompileResult => ({
  ok: true,
  svg: '<svg />',
  viewBox: { x: 0, y: 0, width: 100, height: 100 },
})

/**
 * Return an empty subtree list for tests that do not override this shim.
 * @param _source Ignored shim parameter matching engine signature.
 * @param _options Ignored shim parameter matching engine signature.
 * @returns Empty subtree collection.
 */
export const listSubtreesFromSource = (
  _source: string,
  _options: Pick<CompileOptions, 'styleSource' | 'ignoreSourceStyle'> | null,
): ReadonlyArray<{ readonly kind: 'employee' | 'department' | 'vacancy'; readonly id: string; readonly label: string; readonly depth: number }> =>
  []

/**
 * Resolve style-pack content by name in the shim.
 * @param name Style-pack name.
 * @returns Style-pack text for known names, otherwise `null`.
 */
export const getStylePack = (name: string): string | null => {
  if (name === 'corporate') {
    return 'style\n  .node\n    color: #000000'
  }

  return null
}
