import { describe, expect, it } from 'vitest'
import { stylePackHandler } from './stylePack'
import {
  makeStylePackRequestBody,
  makeStylePackRequestBodyMissingChoice,
} from '../tests/factories/stylePackRequestBody.factory'
import { makeJsonRequest } from '../tests/factories/request.factory'

describe('stylePackHandler', () => {
  it('returns 200 when style pack exists', async () => {
    const req = makeJsonRequest({
      path: '/api/style-pack',
      body: makeStylePackRequestBody({ choice: 'corporate' }),
    })

    const res = await stylePackHandler(req)

    expect(res.status).toBe(200)
  })

  it('returns 422 when choice is missing', async () => {
    const req = makeJsonRequest({
      path: '/api/style-pack',
      body: makeStylePackRequestBodyMissingChoice(),
    })

    const res = await stylePackHandler(req)

    expect(res.status).toBe(422)
  })

  it('returns 404 when style pack is unknown', async () => {
    const req = makeJsonRequest({
      path: '/api/style-pack',
      body: makeStylePackRequestBody({ choice: 'unknown' }),
    })

    const res = await stylePackHandler(req)

    expect(res.status).toBe(404)
  })
})
