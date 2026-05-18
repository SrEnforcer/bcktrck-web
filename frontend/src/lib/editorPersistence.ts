/**
 * @module lib/editor-persistence
 *
 * Pure helpers for keyboard save shortcut detection and source backup export encoding.
 *
 * @packageDocumentation
 */

type SaveShortcutKeyboardState = {
  readonly key: string
  readonly ctrlKey: boolean
  readonly metaKey: boolean
}

/**
 * Determine whether keyboard state matches save intent.
 * @param state Keyboard state to evaluate.
 * @returns True when Ctrl+S or Meta+S was pressed.
 */
export const isSaveShortcut = (state: SaveShortcutKeyboardState): boolean =>
  (state.ctrlKey || state.metaKey) && state.key.toLowerCase() === 's'

/**
 * Build a text data URI for bcktrck source backup downloads.
 * @param source Source text to encode.
 * @returns Data URI suitable for an anchor `href`.
 */
export const buildBackupFileDataUri = (source: string): string =>
  `data:text/plain;charset=utf-8,${encodeURIComponent(source)}`
