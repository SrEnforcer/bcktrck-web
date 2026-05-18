type SaveShortcutKeyboardState = Readonly<{
  readonly key: string
  readonly ctrlKey: boolean
  readonly metaKey: boolean
}>

/**
 * Builds keyboard state fixtures for save-shortcut tests.
 * @param input Keyboard-state fields.
 * @returns Keyboard-state test fixture.
 */
export const makeSaveShortcutKeyboardState = (
  input: Readonly<{
    readonly key: string
    readonly ctrlKey: boolean
    readonly metaKey: boolean
  }>,
): SaveShortcutKeyboardState => ({
  key: input.key,
  ctrlKey: input.ctrlKey,
  metaKey: input.metaKey,
})
