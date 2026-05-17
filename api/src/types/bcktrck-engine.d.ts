declare module '@bcktrck/engine' {
  /**
   * Parser error produced by the engine parser.
   */
  export type ParseErr = {
    readonly error: string
    readonly line: number
    readonly col: number
  }

  /**
   * Engine render configuration bag.
   */
  export type RenderConfig = Readonly<Record<string, unknown>>

  /**
   * Subtree metadata returned by the engine for selection UIs.
   */
  export type SubtreeEntry = {
    readonly kind: 'employee' | 'department' | 'vacancy'
    readonly id: string
    readonly label: string
    readonly depth: number
  }

  /**
   * Resolver error emitted by the engine semantic pass.
   */
  export type ResolveError = {
    readonly line: number
    readonly col: number
    readonly message: string
  }

  /**
   * Successful compile result.
   */
  export type CompileOk = {
    readonly ok: true
    readonly svg: string
    readonly viewBox: {
      readonly x: number
      readonly y: number
      readonly width: number
      readonly height: number
    }
  }

  /**
   * Failed compile result.
   */
  export type CompileErr = {
    readonly ok: false
    readonly parseError: ParseErr | undefined
    readonly resolveErrors: readonly ResolveError[] | undefined
  }

  /**
   * Engine compile output union.
   */
  export type CompileResult = CompileOk | CompileErr

  /**
   * Compile options accepted by the engine.
   */
  export type CompileOptions = {
    readonly subtreeId: string | undefined
    readonly subtreeIds: readonly string[] | undefined
    readonly styleSource: string | undefined
    readonly ignoreSourceStyle: boolean | undefined
  }

  /**
   * Default render configuration shipped by the engine.
   */
  export const defaultRenderConfig: RenderConfig

  /**
   * Compile bcktrck source into an SVG result.
   * @param source Raw bcktrck source text.
   * @param renderConfig Optional render configuration override.
   * @param options Optional compile options.
   * @returns Compile result containing SVG or parse/resolve errors.
   */
  export const compile: (
    source: string,
    renderConfig: RenderConfig | undefined,
    options: Partial<CompileOptions> | undefined
  ) => CompileResult
  /**
   * List subtree entries from source for selection UIs.
   * @param source Raw bcktrck source text.
   * @param options Optional style-related compile options.
   * @returns Subtree entries in preorder depth-first order.
   */
  export const listSubtreesFromSource: (
    source: string,
    options: Pick<CompileOptions, 'styleSource' | 'ignoreSourceStyle'> | undefined
  ) => readonly SubtreeEntry[]
  /**
   * Resolve a named style pack.
   * @param name Style pack name.
   * @returns Style pack text when found.
   */
  export const getStylePack: (name: string) => string | undefined
}
