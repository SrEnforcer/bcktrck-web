import { useEffect } from 'react'
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

/**
 * Persist user-editable workspace preferences into localStorage.
 */
export const useLocalStoragePersistence = (input: UseLocalStoragePersistenceInput): void => {
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(input.sourceStorageKey, input.source)
    } catch (error) {
      debugLog('storage', 'persist source failed', error)
    }
  }, [input.sourceStorageKey, input.source])

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(input.editorPanelWidthStorageKey, String(input.editorPanelWidth))
    } catch (error) {
      debugLog('storage', 'persist editor panel width failed', error)
    }
  }, [input.editorPanelWidthStorageKey, input.editorPanelWidth])

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(input.editorFontSizeStorageKey, String(input.editorFontSize))
    } catch (error) {
      debugLog('storage', 'persist editor font size failed', error)
    }
  }, [input.editorFontSizeStorageKey, input.editorFontSize])

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(input.printPageFormatStorageKey, input.printPageFormat)
    } catch (error) {
      debugLog('storage', 'persist print page format failed', error)
    }
  }, [input.printPageFormatStorageKey, input.printPageFormat])

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(input.themeStorageKey, input.themePreference)
    } catch (error) {
      debugLog('storage', 'persist theme preference failed', error)
    }
  }, [input.themeStorageKey, input.themePreference])

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      window.localStorage.setItem(input.stylePackStorageKey, input.stylePackChoice)
    } catch (error) {
      debugLog('storage', 'persist style pack preference failed', error)
    }
  }, [input.stylePackStorageKey, input.stylePackChoice])
}
