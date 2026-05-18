/**
 * @module hooks/use-print-page-style
 *
 * React hook that keeps the print-specific `@page` stylesheet synchronized with
 * current print format and margin preferences.
 *
 * @packageDocumentation
 */

import { useEffect } from 'react'

type UsePrintPageStyleInput = {
  readonly pageSize: string
  readonly margin: string
}

const isHtmlStyleElement = (element: Element | null): element is HTMLStyleElement => {
  // DEVIATION(1.9): Browser DOM narrowing requires `instanceof HTMLStyleElement` at this adapter boundary.
  return element instanceof HTMLStyleElement
}

/**
 * Keep a print-specific @page stylesheet in sync with current print settings.
 * @param input Print page size and margin values.
 * @returns Nothing.
 */
export const usePrintPageStyle = (input: UsePrintPageStyleInput): void => {
  useEffect(() => {
    if (typeof document === 'undefined') return

    const styleId = 'bcktrck-print-page-style'
    const existingTag = document.getElementById(styleId)
    const styleTag = isHtmlStyleElement(existingTag)
      ? existingTag
      : document.createElement('style')

    if (!isHtmlStyleElement(existingTag)) {
      styleTag.id = styleId
      document.head.appendChild(styleTag)
    }

    styleTag.textContent = `@page { size: ${input.pageSize}; margin: ${input.margin}; }`
  }, [input.pageSize, input.margin])

  useEffect(() => {
    if (typeof document === 'undefined') return

    const styleId = 'bcktrck-print-page-style'
    return () => {
      document.getElementById(styleId)?.remove()
    }
  }, [])
}
