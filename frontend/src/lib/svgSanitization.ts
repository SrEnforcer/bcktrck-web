import DOMPurify from 'dompurify'

const svgSanitizeOptions = {
  USE_PROFILES: {
    svg: true,
    svgFilters: true
  }
}

/**
 * Sanitize untrusted SVG markup before rendering it in the UI.
 */
export const sanitizeSvgMarkup = (rawSvg: string): string => DOMPurify.sanitize(rawSvg, svgSanitizeOptions)
