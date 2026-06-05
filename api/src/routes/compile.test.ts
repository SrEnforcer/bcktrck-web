import { describe, expect, it } from 'vitest'
import { compileHandler } from './compile'
import {
  makeCompileRequestBody,
  makeCompileRequestBodyMissingSource,
} from '../tests/factories/compileRequestBody.factory'
import { makeJsonRequest } from '../tests/factories/request.factory'
import { getLastCompileCall, resetLastCompileCall } from '../test-support/engineShim'

describe('compileHandler visual-hint suppression for basic requests', () => {
  it('suppresses icon and !new visual hints when requested', async () => {
    resetLastCompileCall()

    const req = makeJsonRequest({
      path: '/api/compile',
      body: {
        ...makeCompileRequestBody({ source: 'org "Test"\n  Alice @alice !new' }),
        suppressVisualHints: true,
      },
    })

    const res = await compileHandler(req)
    const compileCall = getLastCompileCall()

    expect(res.status).toBe(200)
    expect(compileCall).toEqual({
      source: 'org "Test"\n  Alice @alice',
      renderConfig: expect.objectContaining({
        showSubordinateCount: false,
      }),
      options: {
        ignoreSourceStyle: false,
        styleSource: 'style\n  .node\n    icon-opacity: 0',
      },
    })
  })
})

describe('compileHandler visual-hint suppression for style merging', () => {
  it('suppresses multiple !new variants and merges with style source', async () => {
    resetLastCompileCall()

    const req = makeJsonRequest({
      path: '/api/compile',
      body: {
        ...makeCompileRequestBody({ source: 'Alice !new\nBob !new:urgent\nCarol !new' }),
        styleSource: 'style\n  .node\n    color: #ff0000',
        suppressVisualHints: true,
      },
    })

    const res = await compileHandler(req)
    const compileCall = getLastCompileCall()

    expect(res.status).toBe(200)
    expect(compileCall).toEqual({
      source: 'Alice\nBob\nCarol',
      renderConfig: expect.objectContaining({
        showSubordinateCount: false,
      }),
      options: {
        ignoreSourceStyle: false,
        styleSource: 'style\n  .node\n    color: #ff0000\n\nstyle\n  .node\n    icon-opacity: 0',
      },
    })
  })
})

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
