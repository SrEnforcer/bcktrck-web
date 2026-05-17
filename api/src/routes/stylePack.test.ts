import { describe, expect, it, vi } from 'vitest'
import { stylePackHandler } from './stylePack'

const { getStylePackMock } = vi.hoisted(() => ({
  getStylePackMock: vi.fn(),
}))

vi.mock('@bcktrck/engine', () => ({
  getStylePack: getStylePackMock,
}))

const createStylePackRequest = (body: unknown): Request => {
  // DEVIATION(1.9): Request construction is required for Fetch API handler tests.
  // eslint-disable-next-line no-restricted-syntax -- DEVIATION(1.9): adapter-boundary test input.
  return new Request('http://localhost/api/style-pack', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('stylePackHandler', () => {
  it('returns 200 when style pack exists', async () => {
    getStylePackMock.mockReturnValueOnce('style\n  .node\n    color: #000000')

    const req = createStylePackRequest({ choice: 'corporate' })

    const res = await stylePackHandler(req)

    expect(res.status).toBe(200)
  })

  it('returns 422 when choice is missing', async () => {
    const req = createStylePackRequest({})

    const res = await stylePackHandler(req)

    expect(res.status).toBe(422)
  })

  it('returns 404 when style pack is unknown', async () => {
    getStylePackMock.mockReturnValueOnce(undefined)

    const req = createStylePackRequest({ choice: 'unknown' })

    const res = await stylePackHandler(req)

    expect(res.status).toBe(404)
  })
})
