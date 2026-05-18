import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import { buildBackupFileDataUri, isSaveShortcut } from './editorPersistence'
import { makeSaveShortcutKeyboardState } from '../tests/factories/editorPersistence.factory'

describe('isSaveShortcut', () => {
  it('matches ctrl+s and meta+s in any key case', () => {
    expect(isSaveShortcut(makeSaveShortcutKeyboardState({ key: 's', ctrlKey: true, metaKey: false }))).toBe(true)
    expect(isSaveShortcut(makeSaveShortcutKeyboardState({ key: 'S', ctrlKey: true, metaKey: false }))).toBe(true)
    expect(isSaveShortcut(makeSaveShortcutKeyboardState({ key: 's', ctrlKey: false, metaKey: true }))).toBe(true)
  })

  it('rejects non-save combinations', () => {
    expect(isSaveShortcut(makeSaveShortcutKeyboardState({ key: 'p', ctrlKey: true, metaKey: false }))).toBe(false)
    expect(isSaveShortcut(makeSaveShortcutKeyboardState({ key: 's', ctrlKey: false, metaKey: false }))).toBe(false)
  })

  it('satisfies shortcut law: modifier and s-key determine save intent', () => {
    fc.assert(
      fc.property(fc.string(), fc.boolean(), fc.boolean(), (key, ctrlKey, metaKey) => {
        const state = makeSaveShortcutKeyboardState({ key, ctrlKey, metaKey })
        const expected = (ctrlKey || metaKey) && key.toLowerCase() === 's'

        expect(isSaveShortcut(state)).toBe(expected)
      }),
    )
  })
})

describe('buildBackupFileDataUri', () => {
  it('builds a plain-text data URI from source', () => {
    expect(buildBackupFileDataUri('a -> b')).toBe('data:text/plain;charset=utf-8,a%20-%3E%20b')
  })

  it('satisfies round-trip law: encoded source decodes back to the original text', () => {
    fc.assert(
      fc.property(fc.string(), (source) => {
        const prefix = 'data:text/plain;charset=utf-8,'
        const uri = buildBackupFileDataUri(source)
        const encoded = uri.slice(prefix.length)

        expect(uri.startsWith(prefix)).toBe(true)
        expect(decodeURIComponent(encoded)).toBe(source)
      }),
    )
  })
})
