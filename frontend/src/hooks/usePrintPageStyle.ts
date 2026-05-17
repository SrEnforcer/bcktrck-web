import { useEffect } from 'react'

type UsePrintPageStyleInput = {
  readonly pageSize: string
  readonly margin: string
}

/**
 * Keep a print-specific @page stylesheet in sync with current print settings.
 */
export const usePrintPageStyle = (input: UsePrintPageStyleInput): void => {
  useEffect(() => {
    if (typeof document === 'undefined') return

    const styleId = 'bcktrck-print-page-style'
    const existingTag = document.getElementById(styleId)
    const styleTag = existingTag instanceof HTMLStyleElement
      ? existingTag
      : document.createElement('style')

    if (!(existingTag instanceof HTMLStyleElement)) {
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
