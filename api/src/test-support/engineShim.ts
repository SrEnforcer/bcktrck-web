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
  readonly parseError: ParseErr | undefined
  readonly resolveErrors: ReadonlyArray<ResolveError> | undefined
}

type CompileResult = CompileOk | CompileErr

type CompileOptions = {
  readonly subtreeId: string | undefined
  readonly subtreeIds: ReadonlyArray<string> | undefined
  readonly styleSource: string | undefined
  readonly ignoreSourceStyle: boolean | undefined
}

export const defaultRenderConfig: Readonly<Record<string, unknown>> = {}

export const compile = (
  _source: string,
  _renderConfig: Readonly<Record<string, unknown>> | undefined,
  _options: Partial<CompileOptions> | undefined,
): CompileResult => ({
  ok: true,
  svg: '<svg />',
  viewBox: { x: 0, y: 0, width: 100, height: 100 },
})

export const listSubtreesFromSource = (
  _source: string,
  _options: Pick<CompileOptions, 'styleSource' | 'ignoreSourceStyle'> | undefined,
): ReadonlyArray<{ readonly kind: 'employee' | 'department' | 'vacancy'; readonly id: string; readonly label: string; readonly depth: number }> =>
  []

export const getStylePack = (_name: string): string | undefined => undefined
