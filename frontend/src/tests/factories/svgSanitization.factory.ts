/**
 * Builds deterministic SVG fixtures for sanitization boundary tests.
 */
export const makeUnsafeSvgMarkup = (): string => '<svg><script>alert(1)</script><rect /></svg>'

/**
 * Builds deterministic sanitized output expected from the boundary shim.
 * @param input Raw SVG source.
 * @returns Sanitized SVG output produced by test sanitizer shim.
 */
export const makeSanitizedSvgMarkup = (input: Readonly<{ readonly rawSvg: string }>): string => `clean:${input.rawSvg}`
