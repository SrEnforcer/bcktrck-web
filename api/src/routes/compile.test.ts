import { describe, expect, it, vi } from 'vitest'
import { compileHandler } from './compile'

const { compileMock } = vi.hoisted(() => ({
  compileMock: vi.fn(),
}))

vi.mock('@bcktrck/engine', () => ({
  compile: compileMock,
  defaultRenderConfig: {},
}))

const createCompileRequest = (body: unknown): Request => {
  // DEVIATION(1.9): Request construction is required for Fetch API handler tests.
  // eslint-disable-next-line no-restricted-syntax -- DEVIATION(1.9): adapter-boundary test input.
  return new Request('http://localhost/api/compile', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const validCompileBody = {
  source: 'org "Test"',
  effectiveSubtreeId: null,
  effectiveSubtreeIds: null,
  styleSource: null,
  ignoreSourceStyle: false,
}

describe('compileHandler', () => {
  it('returns 200 when compile succeeds', async () => {
    compileMock.mockReturnValueOnce({
      ok: true,
      svg: '<svg />',
      viewBox: { x: 0, y: 0, width: 100, height: 80 },
    })

    const req = createCompileRequest(validCompileBody)

    const res = await compileHandler(req)

    expect(res.status).toBe(200)
  })

  it('returns 422 when source is missing', async () => {
    const req = createCompileRequest({
      effectiveSubtreeId: null,
      effectiveSubtreeIds: null,
      styleSource: null,
      ignoreSourceStyle: false,
    })

    const res = await compileHandler(req)

    expect(res.status).toBe(422)
  })

  it('returns 500 when compile throws', async () => {
    compileMock.mockImplementationOnce(() => JSON.parse('{'))

    const req = createCompileRequest(validCompileBody)

    const res = await compileHandler(req)

    expect(res.status).toBe(500)
  })
})
