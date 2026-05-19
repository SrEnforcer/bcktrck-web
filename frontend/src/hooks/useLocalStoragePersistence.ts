/**
 * @module hooks/use-local-storage-persistence
 *
 * React hook that persists workspace UI preferences into localStorage.
 * Side effects are isolated to storage writes and debug logging on failure.
 *
 * @packageDocumentation
 */

import { useEffect } from 'react'
import { isErr, tryCatch } from '@tsfpp/prelude'
import { debugLog } from '../logging/logger'

type UseLocalStoragePersistenceInput = {
  readonly sourceStorageKey: string
  readonly source: string
  readonly editorPanelWidthStorageKey: string
  readonly editorPanelWidth: number
  readonly editorFontSizeStorageKey: string
  readonly editorFontSize: number
  readonly printPageFormatStorageKey: string
  readonly printPageFormat: string
  readonly themeStorageKey: string
  readonly themePreference: string
  readonly stylePackStorageKey: string
  readonly stylePackChoice: string
}

const persistLocalStorage = (key: string, value: string, message: string): void => {
  if (typeof window === 'undefined') return

  const result = tryCatch(
    () => {
      window.localStorage.setItem(key, value)
      return value
    },
    (cause) => cause,
  )

  if (isErr(result)) {
    debugLog('storage', message, result.error)
  }
}

/**
 * Persist user-editable workspace preferences into localStorage.
 * @param input Storage keys and current UI values to persist.
 * @returns Nothing.
 */
export const useLocalStoragePersistence = (input: UseLocalStoragePersistenceInput): void => {
  useEffect(() => {
    persistLocalStorage(input.sourceStorageKey, input.source, 'storage.local.source.persist.failed')
  }, [input.sourceStorageKey, input.source])

  useEffect(() => {
    persistLocalStorage(
      input.editorPanelWidthStorageKey,
      String(input.editorPanelWidth),
      'storage.local.editor_panel_width.persist.failed',
    )
  }, [input.editorPanelWidthStorageKey, input.editorPanelWidth])

  useEffect(() => {
    persistLocalStorage(
      input.editorFontSizeStorageKey,
      String(input.editorFontSize),
      'storage.local.editor_font_size.persist.failed',
    )
  }, [input.editorFontSizeStorageKey, input.editorFontSize])

  useEffect(() => {
    persistLocalStorage(
      input.printPageFormatStorageKey,
      input.printPageFormat,
      'storage.local.print_page_format.persist.failed',
    )
  }, [input.printPageFormatStorageKey, input.printPageFormat])

  useEffect(() => {
    persistLocalStorage(
      input.themeStorageKey,
      input.themePreference,
      'storage.local.theme_preference.persist.failed',
    )
  }, [input.themeStorageKey, input.themePreference])

  useEffect(() => {
    persistLocalStorage(
      input.stylePackStorageKey,
      input.stylePackChoice,
      'storage.local.style_pack_preference.persist.failed',
    )
  }, [input.stylePackStorageKey, input.stylePackChoice])
}
