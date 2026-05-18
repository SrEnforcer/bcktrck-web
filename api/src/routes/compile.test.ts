import { describe, expect, it } from 'vitest'
import { compileHandler } from './compile'
import {
  makeCompileRequestBody,
  makeCompileRequestBodyMissingSource,
} from '../tests/factories/compileRequestBody.factory'
import { makeJsonRequest } from '../tests/factories/request.factory'

describe('compileHandler', () => {
  it('returns 200 when compile succeeds', async () => {
    const req = makeJsonRequest({
      path: '/api/compile',
      body: makeCompileRequestBody({ source: 'org "Test"' }),
    })

    const res = await compileHandler(req)

    expect(res.status).toBe(200)
  })

  it('returns 422 when source is missing', async () => {
    const req = makeJsonRequest({
      path: '/api/compile',
      body: makeCompileRequestBodyMissingSource(),
    })

    const res = await compileHandler(req)

    expect(res.status).toBe(422)
  })
})
