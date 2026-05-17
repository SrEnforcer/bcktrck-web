import { useEffect, useMemo, useState } from 'react'
import { fromNullable, getNumberField, getOrElse, getStringField, getTypedField, isNone, isRecord, isSome, mapO, pipe } from '@tsfpp/prelude'
import { sanitizeSvgMarkup } from '../lib/svgSanitization'

type ParseError = {
  readonly line: number
  readonly col: number
  readonly error: string
}

type ResolveError = {
  readonly line: number
  readonly col: number
  readonly message: string
}

type CompileResult =
  | {
    readonly ok: true
    readonly svg: string
    readonly viewBox: {
      readonly x: number
      readonly y: number
      readonly width: number
      readonly height: number
    }
  }
  | {
    readonly ok: false
    readonly parseError: ParseError | undefined
    readonly resolveErrors: ReadonlyArray<ResolveError> | undefined
  }

const initialCompileResult: CompileResult = {
  ok: false,
  parseError: undefined,
  resolveErrors: [],
}

const decodeParseError = (value: unknown): ParseError | undefined => {
  if (!isRecord(value)) return undefined
  const line = getNumberField(value, 'line')
  const col = getNumberField(value, 'col')
  const error = getStringField(value, 'error')

  return isSome(line) && isSome(col) && isSome(error)
    ? { line: line.value, col: col.value, error: error.value }
    : undefined
}

const decodeResolveErrors = (value: unknown): ReadonlyArray<ResolveError> | undefined => {
  if (!Array.isArray(value)) return undefined
  const decoded = value
    .map((item) => {
      if (!isRecord(item)) return undefined
      const line = getNumberField(item, 'line')
      const col = getNumberField(item, 'col')
      const message = getStringField(item, 'message')

      return isSome(line) && isSome(col) && isSome(message)
        ? { line: line.value, col: col.value, message: message.value }
        : undefined
    })
    .filter((item): item is ResolveError => item !== undefined)

  return decoded
}

const decodeCompileResult = (value: unknown): CompileResult | undefined => {
  if (!isRecord(value)) return undefined

  const result = getTypedField(value, 'result', isRecord)
  if (!isSome(result)) return undefined
  const compileResult = result.value

  if (compileResult.ok === true) {
    const svg = getStringField(compileResult, 'svg')
    const viewBox = getTypedField(compileResult, 'viewBox', isRecord)

    if (!isSome(svg) || !isSome(viewBox)) {
      return undefined
    }

    const x = getNumberField(viewBox.value, 'x')
    const y = getNumberField(viewBox.value, 'y')
    const width = getNumberField(viewBox.value, 'width')
    const height = getNumberField(viewBox.value, 'height')

    if (!isSome(x) || !isSome(y) || !isSome(width) || !isSome(height)) {
      return undefined
    }

    return {
      ok: true,
      svg: svg.value,
      viewBox: { x: x.value, y: y.value, width: width.value, height: height.value },
    }
  }

  if (compileResult.ok === false) {
    return {
      ok: false,
      parseError: decodeParseError(compileResult.parseError),
      resolveErrors: decodeResolveErrors(compileResult.resolveErrors),
    }
  }

  return undefined
}

const buildCaretPointer = (lineText: string, col: number): string => {
  const safeCol = Math.max(1, col)
  const prefix = lineText.slice(0, safeCol - 1)
  const visualOffset = prefix.replace(/\t/g, '  ').length
  return `${' '.repeat(visualOffset)}^`
}

const buildParseHint = (message: string): string | undefined => {
  if (message.includes('Node line requires a display name or @handle')) {
    return 'Tip: add a name or @handle after ~dept/~staff. Example: ~dept Support @support'
  }
  if (message.includes('Expected indent')) {
    return 'Tip: check indentation. Use either 2 or 4 spaces per level consistently.'
  }
  if (message.includes('Expected rbracket')) {
    return 'Tip: a closing ] is probably missing in an attribute block.'
  }
  return undefined
}

const formatParseErrorWithContext = (
  sourceText: string,
  parseError: { readonly line: number; readonly col: number; readonly error: string }
): string => {
  const lines = sourceText.split(/\r?\n/)
  const errorLine = Math.max(1, parseError.line)
  const startLine = Math.max(1, errorLine - 1)
  const endLine = Math.min(lines.length, errorLine + 1)

  const context = Array.from({ length: endLine - startLine + 1 }, (_, index) => {
    const lineNo = startLine + index
    const text = lines[lineNo - 1] ?? ''
    const marker = lineNo === errorLine ? '>' : ' '
    return `${marker} ${String(lineNo).padStart(3, ' ')} | ${text}`
  })

  const currentLineText = lines[errorLine - 1] ?? ''
  const pointerPrefix = `    ${String(errorLine).padStart(3, ' ')} | `
  const pointer = `${pointerPrefix}${buildCaretPointer(currentLineText, parseError.col)}`
  const hint = buildParseHint(parseError.error)

  return [
    `Parse error at ${parseError.line}:${parseError.col}`,
    parseError.error,
    '',
    ...context,
    pointer,
    ...(hint !== undefined ? ['', hint] : [])
  ].join('\n')
}

/**
 * Input required by `useCompiledSvg` to request a compile from the API.
 */
export type UseCompiledSvgInput = {
  readonly source: string
  readonly effectiveSubtreeId: string | undefined
  readonly effectiveSubtreeIds: readonly string[] | undefined
  readonly styleSource: string | undefined
  readonly ignoreSourceStyle: boolean
}

/**
 * Output state returned by `useCompiledSvg` for preview and print rendering.
 */
export type UseCompiledSvgResult = {
  readonly result: CompileResult
  readonly errorText: string
  readonly safeSvg: string
  readonly printSafeSvg: string
}

/**
 * Compile source to SVG once for app rendering and expose sanitized markup for preview/print surfaces.
 * @param input Compile input for source, subtree selection, and style options.
 * @returns Compile state, render-safe SVG, and derived error text.
 */
export const useCompiledSvg = (input: UseCompiledSvgInput): UseCompiledSvgResult => {
  const [result, setResult] = useState<CompileResult>(initialCompileResult)

  useEffect(() => {
    const abortController = new AbortController()

    const loadCompileResult = async (): Promise<void> => {
      const response = await fetch('/api/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: input.source,
          effectiveSubtreeId: pipe(fromNullable(input.effectiveSubtreeId), getOrElse((): string | null => null)),
          effectiveSubtreeIds: pipe(fromNullable(input.effectiveSubtreeIds), getOrElse((): ReadonlyArray<string> | null => null)),
          styleSource: pipe(fromNullable(input.styleSource), getOrElse((): string | null => null)),
          ignoreSourceStyle: input.ignoreSourceStyle,
        }),
        signal: abortController.signal,
      }).catch(() => undefined)

      const responseOption = fromNullable(response)

      const isResponseOk = pipe(
        responseOption,
        mapO((candidate) => candidate.ok),
        getOrElse(() => false)
      )
      if (!isResponseOk) {
        setResult({
          ok: false,
          parseError: undefined,
          resolveErrors: [
            { line: 0, col: 0, message: 'Compile API unavailable. Start @bcktrck/api and retry.' },
          ],
        })
        return
      }

      if (isNone(responseOption)) {
        return
      }

      const payload = await responseOption.value.json().catch(() => undefined)
      const decoded = decodeCompileResult(payload)
      pipe(
        fromNullable(decoded),
        mapO((value) => {
          setResult(value)
          return value
        })
      )
    }

    loadCompileResult().catch(() => {
      setResult({
        ok: false,
        parseError: undefined,
        resolveErrors: [
          { line: 0, col: 0, message: 'Compile request failed.' },
        ],
      })
    })

    return () => {
      abortController.abort()
    }
  }, [input.source, input.effectiveSubtreeId, input.effectiveSubtreeIds, input.styleSource, input.ignoreSourceStyle])

  const errorText = useMemo(() => {
    if (result.ok) return ''
    const parseErrorText = pipe(
      fromNullable(result.parseError),
      mapO((parseError) => formatParseErrorWithContext(input.source, parseError))
    )
    if (isSome(parseErrorText)) {
      return parseErrorText.value
    }

    const resolveErrors = pipe(
      fromNullable(result.resolveErrors),
      getOrElse((): ReadonlyArray<ResolveError> => [])
    )
    if (resolveErrors.length > 0) {
      return resolveErrors.map((error) => `- [${error.line}:${error.col}] ${error.message}`).join('\n')
    }
    return 'Unknown compile error'
  }, [result, input.source])

  const safeSvg = useMemo(
    () => (result.ok ? sanitizeSvgMarkup(result.svg) : ''),
    [result]
  )

  return {
    result,
    errorText,
    safeSvg,
    // Print currently reuses the same compiled SVG to avoid a duplicate compile pass on every source change.
    printSafeSvg: safeSvg
  }
}
