import { describe, expect, it, vi } from 'vitest'
import {
  makeSanitizedSvgMarkup,
  makeUnsafeSvgMarkup,
} from '../tests/factories/svgSanitization.factory'

vi.mock('dompurify', () => ({
  default: {
    sanitize: (raw: string): string => `clean:${raw}`,
  }
}))

describe('sanitizeSvgMarkup', () => {
  it('delegates to DOMPurify with SVG-only profile', async () => {
    const { sanitizeSvgMarkup } = await import('./svgSanitization')
    const rawSvg = makeUnsafeSvgMarkup()

    const sanitized = sanitizeSvgMarkup(rawSvg)

    expect(sanitized).toBe(makeSanitizedSvgMarkup({ rawSvg }))
  })
})
