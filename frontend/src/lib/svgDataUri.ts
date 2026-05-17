/**
 * Convert sanitized SVG markup into a data URI for safe image rendering.
 * @param svgMarkup Sanitized SVG markup.
 * @returns Data URI usable in image `src` attributes.
 */
export const toSvgDataUri = (svgMarkup: string): string =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgMarkup)}`
