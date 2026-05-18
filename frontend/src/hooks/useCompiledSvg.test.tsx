import { renderHook, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { setupServer } from 'msw/node'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { useCompiledSvg } from './useCompiledSvg'
import {
  makeApiUnavailableResolveErrors,
  makeCompileParseErrorApiPayload,
  makeCompileResolveErrorsApiPayload,
  makeCompileSuccessApiPayload,
  makeUseCompiledSvgInput,
} from '../tests/factories/compileApi.factory'

const server = setupServer()

beforeEach(() => {
  server.listen()
})

afterEach(() => {
  server.resetHandlers()
  server.close()
})

describe('useCompiledSvg', () => {
  it('returns sanitized svg and clear error text when compile succeeds', async () => {
    server.use(
      http.post('/api/compile', () => HttpResponse.json(makeCompileSuccessApiPayload())),
    )

    const { result } = renderHook(() => useCompiledSvg(makeUseCompiledSvgInput({ source: 'org "Test"' })))

    await waitFor(() => {
      expect(result.current.result.ok).toBe(true)
    })

    expect(result.current.safeSvg).toBe('<svg><rect></rect></svg>')
    expect(result.current.errorText).toBe('')
  })

  it('returns API unavailable message when compile endpoint is not ok', async () => {
    server.use(
      http.post('/api/compile', () => HttpResponse.text('unavailable', { status: 503 })),
    )

    const { result } = renderHook(() => useCompiledSvg(makeUseCompiledSvgInput({ source: 'org "Test"' })))

    await waitFor(() => {
      expect(result.current.result).toMatchObject({
        ok: false,
        resolveErrors: makeApiUnavailableResolveErrors(),
      })
    })
  })

  it('formats parse error context when parseError exists', async () => {
    server.use(
      http.post('/api/compile', () => HttpResponse.json(makeCompileParseErrorApiPayload())),
    )

    const { result } = renderHook(() => useCompiledSvg(makeUseCompiledSvgInput({ source: 'org "Test"' })))

    await waitFor(() => {
      expect(result.current.errorText.includes('Parse error at 1:5')).toBe(true)
    })
  })

  it('formats resolve errors list when resolve errors exist', async () => {
    server.use(
      http.post('/api/compile', () => HttpResponse.json(makeCompileResolveErrorsApiPayload())),
    )

    const { result } = renderHook(() => useCompiledSvg(makeUseCompiledSvgInput({ source: 'org "Test"' })))

    await waitFor(() => {
      expect(result.current.errorText).toBe('- [2:3] invalid ref')
    })
  })
})
