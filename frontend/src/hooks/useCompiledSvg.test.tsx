import { renderHook, waitFor } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { setupServer } from 'msw/node'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { useCompiledSvg } from './useCompiledSvg'

const server = setupServer()

beforeAll(() => {
  server.listen()
})

afterEach(() => {
  server.resetHandlers()
})

afterAll(() => {
  server.close()
})

describe('useCompiledSvg', () => {
  it('returns sanitized svg and clear error text when compile succeeds', async () => {
    server.use(
      http.post('/api/compile', () =>
        HttpResponse.json({
          result: {
            ok: true,
            svg: '<svg><rect/></svg>',
            viewBox: { x: 0, y: 0, width: 100, height: 80 },
          },
        })),
    )

    const { result } = renderHook(() => useCompiledSvg({
      source: 'org "Test"',
      effectiveSubtreeId: undefined,
      effectiveSubtreeIds: undefined,
      styleSource: undefined,
      ignoreSourceStyle: false,
    }))

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

    const { result } = renderHook(() => useCompiledSvg({
      source: 'org "Test"',
      effectiveSubtreeId: undefined,
      effectiveSubtreeIds: undefined,
      styleSource: undefined,
      ignoreSourceStyle: false,
    }))

    await waitFor(() => {
      if (result.current.result.ok) {
        throw new Error('Expected compile to fail')
      }

      expect(result.current.result.resolveErrors).toEqual([
        { line: 0, col: 0, message: 'Compile API unavailable. Start @bcktrck/api and retry.' },
      ])
    })
  })

  it('formats parse error context when parseError exists', async () => {
    server.use(
      http.post('/api/compile', () =>
        HttpResponse.json({
          result: {
            ok: false,
            parseError: {
              line: 1,
              col: 5,
              error: 'Expected indent',
            },
            resolveErrors: [],
          },
        })),
    )

    const { result } = renderHook(() => useCompiledSvg({
      source: 'org "Test"',
      effectiveSubtreeId: undefined,
      effectiveSubtreeIds: undefined,
      styleSource: undefined,
      ignoreSourceStyle: false,
    }))

    await waitFor(() => {
      expect(result.current.errorText.includes('Parse error at 1:5')).toBe(true)
    })
  })

  it('formats resolve errors list when resolve errors exist', async () => {
    server.use(
      http.post('/api/compile', () =>
        HttpResponse.json({
          result: {
            ok: false,
            parseError: null,
            resolveErrors: [
              { line: 2, col: 3, message: 'invalid ref' },
            ],
          },
        })),
    )

    const { result } = renderHook(() => useCompiledSvg({
      source: 'org "Test"',
      effectiveSubtreeId: undefined,
      effectiveSubtreeIds: undefined,
      styleSource: undefined,
      ignoreSourceStyle: false,
    }))

    await waitFor(() => {
      expect(result.current.errorText).toBe('- [2:3] invalid ref')
    })
  })
})
