import { describe, expect, it, vi } from 'vitest'

const sanitizeMock = vi.fn((raw: string) => `clean:${raw}`)

vi.mock('dompurify', () => ({
  default: {
    sanitize: sanitizeMock
  }
}))

describe('sanitizeSvgMarkup', () => {
  it('delegates to DOMPurify with SVG-only profile', async () => {
    const { sanitizeSvgMarkup } = await import('./svgSanitization')
    const rawSvg = '<svg><script>alert(1)</script><rect /></svg>'

    const sanitized = sanitizeSvgMarkup(rawSvg)

    expect(sanitized).toBe(`clean:${rawSvg}`)
    expect(sanitizeMock).toHaveBeenCalledWith(rawSvg, {
      USE_PROFILES: {
        svg: true,
        svgFilters: true
      }
    })
  })
})
