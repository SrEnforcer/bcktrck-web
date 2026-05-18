/**
 * @module lib/svg-sanitization
 *
 * Security-focused SVG sanitization helpers for untrusted compile output.
 *
 * @packageDocumentation
 */

import DOMPurify from 'dompurify'

const svgSanitizeOptions = {
  USE_PROFILES: {
    svg: true,
    svgFilters: true
  }
}

/**
 * Sanitize untrusted SVG markup before rendering it in the UI.
 * @param rawSvg Untrusted SVG string from compile responses.
 * @returns Sanitized SVG markup safe for image rendering.
 */
export const sanitizeSvgMarkup = (rawSvg: string): string => DOMPurify.sanitize(rawSvg, svgSanitizeOptions)
