import { describe, expect, it } from 'vitest'
import { subtreesHandler } from './subtrees'
import {
  makeSubtreesRequestBody,
  makeSubtreesRequestBodyMissingSource,
} from '../tests/factories/subtreesRequestBody.factory'
import { makeJsonRequest } from '../tests/factories/request.factory'

describe('subtreesHandler', () => {
  it('returns 200 when subtree extraction succeeds', async () => {
    const req = makeJsonRequest({
      path: '/api/subtrees',
      body: makeSubtreesRequestBody({ source: 'org "Test"' }),
    })

    const res = await subtreesHandler(req)

    expect(res.status).toBe(200)
  })

  it('returns 422 when source is missing', async () => {
    const req = makeJsonRequest({
      path: '/api/subtrees',
      body: makeSubtreesRequestBodyMissingSource(),
    })

    const res = await subtreesHandler(req)

    expect(res.status).toBe(422)
  })
})
