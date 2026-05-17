import { describe, expect, it, vi } from 'vitest'
import { subtreesHandler } from './subtrees'

const { listSubtreesFromSourceMock } = vi.hoisted(() => ({
  listSubtreesFromSourceMock: vi.fn(),
}))

vi.mock('@bcktrck/engine', () => ({
  listSubtreesFromSource: listSubtreesFromSourceMock,
}))

const createSubtreesRequest = (body: unknown): Request => {
  // DEVIATION(1.9): Request construction is required for Fetch API handler tests.
  // eslint-disable-next-line no-restricted-syntax -- DEVIATION(1.9): adapter-boundary test input.
  return new Request('http://localhost/api/subtrees', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const validSubtreesBody = {
  source: 'org "Test"',
  styleSource: null,
  ignoreSourceStyle: false,
}

describe('subtreesHandler', () => {
  it('returns 200 when subtree extraction succeeds', async () => {
    listSubtreesFromSourceMock.mockReturnValueOnce([
      { kind: 'department', id: 'eng', label: 'Engineering', depth: 1 },
    ])

    const req = createSubtreesRequest(validSubtreesBody)

    const res = await subtreesHandler(req)

    expect(res.status).toBe(200)
  })

  it('returns 422 when source is missing', async () => {
    const req = createSubtreesRequest({
      styleSource: null,
      ignoreSourceStyle: false,
    })

    const res = await subtreesHandler(req)

    expect(res.status).toBe(422)
  })

  it('returns 500 when subtree extraction throws', async () => {
    listSubtreesFromSourceMock.mockImplementationOnce(() => JSON.parse('{'))

    const req = createSubtreesRequest(validSubtreesBody)

    const res = await subtreesHandler(req)

    expect(res.status).toBe(500)
  })
})
