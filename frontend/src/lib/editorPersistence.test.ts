import { describe, expect, it } from 'vitest'
import { buildBackupFileDataUri, isSaveShortcut } from './editorPersistence'

describe('isSaveShortcut', () => {
  it('matches ctrl+s and meta+s in any key case', () => {
    expect(isSaveShortcut({ key: 's', ctrlKey: true, metaKey: false })).toBe(true)
    expect(isSaveShortcut({ key: 'S', ctrlKey: true, metaKey: false })).toBe(true)
    expect(isSaveShortcut({ key: 's', ctrlKey: false, metaKey: true })).toBe(true)
  })

  it('rejects non-save combinations', () => {
    expect(isSaveShortcut({ key: 'p', ctrlKey: true, metaKey: false })).toBe(false)
    expect(isSaveShortcut({ key: 's', ctrlKey: false, metaKey: false })).toBe(false)
  })
})

describe('buildBackupFileDataUri', () => {
  it('builds a plain-text data URI from source', () => {
    expect(buildBackupFileDataUri('a -> b')).toBe('data:text/plain;charset=utf-8,a%20-%3E%20b')
  })
})
