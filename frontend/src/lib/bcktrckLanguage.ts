/**
 * IMPURE SHELL — side-effects are intentional and contained here.
 *
 * Defines Monaco language registration for Bcktrck, including tokenization,
 * folding, and theme setup. The pure helpers in this file are kept adjacent to
 * the registration boundary so editor behavior can be tested without invoking
 * Monaco itself.
 */

import type * as Monaco from 'monaco-editor'
import { fromNullable, getOrElse, isNone, mapO, pipe } from '@tsfpp/prelude'

const languageId = 'bcktrck'
const registeredMonacoInstances = new WeakSet<object>()
const rootBlockPattern = /^(defs|style|config|org|links)\b/

/**
 * Theme ids used by the web editor when switching Monaco between light and dark modes.
 */
export const bcktrckEditorTheme = {
  light: 'bcktrck-light',
  dark: 'bcktrck-dark'
} as const

export type BcktrckTokenRule = readonly [pattern: RegExp, token: string]
export type BcktrckFoldingRangeForTests = {
  readonly start: number
  readonly end: number
  readonly kind: 'region'
}
type BcktrckFoldingRange = {
  readonly start: number
  readonly end: number
  readonly kind: 'region'
}

/**
 * Ordered token rules shared by Monaco registration and test-only tokenization.
 * Earlier matches win, so high-specificity rules stay near the top to prevent
 * broad patterns from swallowing style selectors or attribute names.
 */
export const bcktrckTokenRules: readonly BcktrckTokenRule[] = [
  [/^\s*\/\/.*$/, 'comment'],
  [/("(?:[^"\\]|\\.)*")/, 'string'],
  [/!new(?::[^\s\]]+)?/, 'constant.language.visual-hint-new'], // highlight !new
  [/\b(?:defs|style|config|org|links)\b/, 'keyword'],
  [/~(?:dept|staff|group|vacant|shared|shadow|extern)\b/, 'keyword'],
  [/\$[A-Za-z_][\w-]*/, 'variable.style'],
  [/\.(?:node-name|node-title|node|type-[A-Za-z0-9_-]+|role-[A-Za-z0-9_-]+|kind-[A-Za-z0-9_-]+)(?::children)?/, 'selector'],
  [/@[A-Za-z_][\w-]*(?::children)?/, 'variable'],
  [/-->/, 'operator'],
  [/\b(?:background-color|border-color|border-style|border-width|color|edge-style|edge-width|font-size|font-weight|icon|icon-color|icon-pos|icon-size|icon-opacity|line-spacing)\b(?=\s*:)/, 'property'],
  [/\b(?:title|head|label|side|role|roles|icon|icon-pos|icon-size|icon-opacity)\b(?=\s*:)/, 'attribute.name'],
  [/\[[^\]]*\]/, 'type'],
  [/#[0-9A-Fa-f]{3,8}\b/, 'number.hex'],
  [/\b(?:normal|bold|[1-9]00)\b/, 'keyword'],
  [/\b(?:solid|dashed|dotted|none)\b/, 'keyword.border-style'],
  [/\b(?:straight|solid|dashed|dotted)\b/, 'keyword.edge-style'],
  [/\b(?:transparent)\b/, 'keyword'],
  [/\b\d+(?:\.\d+)?(?:px)?\b/, 'number'],
  [/\s+/, 'white']
] as const

const getIndentSize = (line: string): number =>
  pipe(
    fromNullable(line.match(/^\s*/)),
    mapO((match) => match[0]),
    mapO((indentText) => indentText.length),
    getOrElse(() => 0)
  )

const isRootBlockLine = (line: string): boolean => {
  const trimmed = line.trimStart()
  return trimmed.length > 0 && getIndentSize(line) === 0 && rootBlockPattern.test(trimmed)
}

/**
 * Find the inclusive end of a top-level block for editor folding.
 *
 * Blank lines are treated as part of the current block so folding remains stable
 * while a user is editing inside a section. A dedent to column zero closes the block.
 *
 * @param lines Full document split into lines.
 * @param startIndex Index of the root block line.
 * @param index Current scan position.
 * @param lastContentIndex Last indented line that still belongs to the block.
 * @returns The inclusive index of the last line that should fold with the block header.
 */
const findBlockEnd = (
  lines: readonly string[],
  startIndex: number,
  index = startIndex + 1,
  lastContentIndex = startIndex
): number => {
  if (index >= lines.length) return lastContentIndex

  const line = lines[index]
  if (line.trim().length === 0) {
    return findBlockEnd(lines, startIndex, index + 1, lastContentIndex)
  }

  if (getIndentSize(line) === 0) {
    return lastContentIndex
  }

  return findBlockEnd(lines, startIndex, index + 1, index)
}

const collectFoldingRanges = (lines: readonly string[]): readonly BcktrckFoldingRange[] =>
  lines.flatMap((line, index) => {
    if (!isRootBlockLine(line)) return []

    const endIndex = findBlockEnd(lines, index)
    return endIndex > index
      ? [{ start: index + 1, end: endIndex + 1, kind: 'region' as const }]
      : []
  })

/**
 * Lightweight tokenizer used in tests to validate rule ordering independently
 * from Monaco's runtime integration.
 *
 * @param text Raw Bcktrck text.
 * @returns The sequence of token names matched by `bcktrckTokenRules`.
 */
export const tokenizeBcktrckTextForTests = (text: string): readonly string[] => {
  const tokens: string[] = []
  let cursor = 0

  const hasHeadMatch = (match: RegExpExecArray | null): boolean =>
    pipe(
      fromNullable(match),
      mapO((candidate) => candidate.index === 0 && candidate[0].length > 0),
      getOrElse(() => false)
    )

  while (cursor < text.length) {
    const slice = text.slice(cursor)
    const matchedRule = bcktrckTokenRules.find(([pattern]) => {
      const match = pattern.exec(slice)
      return hasHeadMatch(match)
    })

    const matchedRuleOption = fromNullable(matchedRule)
    if (isNone(matchedRuleOption)) {
      cursor += 1
      continue
    }

    const [pattern, token] = matchedRuleOption.value
    const match = pattern.exec(slice)
    const matchOption = fromNullable(match)
    if (isNone(matchOption) || matchOption.value[0].length === 0) {
      cursor += 1
      continue
    }

    tokens.push(token)
    cursor += matchOption.value[0].length
  }

  return tokens
}

/**
 * Test helper that exposes the same folding computation used by Monaco.
 *
 * @param text Raw Bcktrck text.
 * @returns Folding ranges expressed in 1-based line numbers.
 */
export const getBcktrckFoldingRangesForTests = (text: string): readonly BcktrckFoldingRange[] =>
  collectFoldingRanges(text.split(/\r?\n/))

const monarchRootRules: [RegExp, string][] = bcktrckTokenRules.map(([pattern, token]) => [pattern, token])

/**
 * Register the Bcktrck language once for a Monaco instance.
 *
 * The WeakSet guard makes registration idempotent per Monaco singleton, which
 * avoids duplicate provider installation when React remounts the editor.
 *
 * @param monaco Monaco editor namespace to extend with the Bcktrck language.
 * @returns Nothing. The effect is the Monaco-side registration of language metadata.
 */
export function registerBcktrckLanguage(monaco: typeof Monaco): void {
  if (registeredMonacoInstances.has(monaco)) return
  registeredMonacoInstances.add(monaco)

  monaco.languages.register({ id: languageId })

  monaco.languages.setLanguageConfiguration(languageId, {
    comments: { lineComment: '//' }
  })

  monaco.languages.setMonarchTokensProvider(languageId, {
    tokenizer: {
      root: monarchRootRules
    }
  })

  monaco.languages.registerFoldingRangeProvider(languageId, {
    provideFoldingRanges(model) {
      const lines = Array.from(
        { length: model.getLineCount() },
        (_, index) => model.getLineContent(index + 1)
      )

      return collectFoldingRanges(lines).map((range) => ({
        start: range.start,
        end: range.end,
        kind: monaco.languages.FoldingRangeKind.Region
      }))
    }
  })

  monaco.editor.defineTheme(bcktrckEditorTheme.light, {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'keyword', foreground: '2456C7' },
      { token: 'constant.language.visual-hint-new', foreground: 'E53935', fontStyle: 'bold' },
      { token: 'keyword.border-style', foreground: 'A44949' },
      { token: 'keyword.edge-style', foreground: 'A44949' },
      { token: 'variable', foreground: '0E7A43' },
      { token: 'variable.style', foreground: '0D7C7A' },
      { token: 'selector', foreground: '7B4BC2' },
      { token: 'property', foreground: '945B0B' },
      { token: 'attribute.name', foreground: '945B0B' },
      { token: 'operator', foreground: '2456C7' },
      { token: 'string', foreground: '25447A' },
      { token: 'type', foreground: '7B4BC2' },
      { token: 'number', foreground: 'A24B34' },
      { token: 'number.hex', foreground: 'A24B34' },
      { token: 'comment', foreground: '7A8497' }
    ],
    colors: {
      'editor.background': '#F7F9FC',
      'editor.foreground': '#162033',
      'editorLineNumber.foreground': '#8C97AA',
      'editorLineNumber.activeForeground': '#162033',
      'editorCursor.foreground': '#162033',
      'editor.selectionBackground': '#DCE7F8',
      'editor.inactiveSelectionBackground': '#E8EEF8',
      'editorIndentGuide.background1': '#E1E7F0',
      'editorIndentGuide.activeBackground1': '#C7D4E8'
    }
  })

  monaco.editor.defineTheme(bcktrckEditorTheme.dark, {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'keyword', foreground: '8FB4FF' },
      { token: 'constant.language.visual-hint-new', foreground: 'FF6659', fontStyle: 'bold' },
      { token: 'keyword.border-style', foreground: 'F0A8A8' },
      { token: 'keyword.edge-style', foreground: 'F0A8A8' },
      { token: 'variable', foreground: '9EF0A5' },
      { token: 'variable.style', foreground: '7CE7D0' },
      { token: 'selector', foreground: 'D6B5FF' },
      { token: 'property', foreground: 'F6C177' },
      { token: 'attribute.name', foreground: 'F6C177' },
      { token: 'operator', foreground: '8FB4FF' },
      { token: 'string', foreground: 'B8C8FF' },
      { token: 'type', foreground: 'D6B5FF' },
      { token: 'number', foreground: 'FFB4A2' },
      { token: 'number.hex', foreground: 'FFB4A2' },
      { token: 'comment', foreground: '6B7280' }
    ],
    colors: {
      'editor.background': '#0B1220',
      'editor.foreground': '#D8E4FF',
      'editorLineNumber.foreground': '#60708F',
      'editorLineNumber.activeForeground': '#D8E4FF',
      'editorCursor.foreground': '#D8E4FF',
      'editor.selectionBackground': '#1E2A44',
      'editor.inactiveSelectionBackground': '#1A2438',
      'editorIndentGuide.background1': '#162036',
      'editorIndentGuide.activeBackground1': '#26344F'
    }
  })
}

export { languageId as bcktrckLanguageId }
