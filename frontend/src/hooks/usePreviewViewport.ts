/**
 * @module hooks/use-preview-viewport
 *
 * React hook that manages pan, zoom, and rectangle-selection interactions in
 * the primary preview panel.
 *
 * @packageDocumentation
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { fromNullable, getNumberField, getOrElseOption, isErr, isNone, isRecord, isSome, mapOption, match, pipe, tryCatch } from '@tsfpp/prelude'
import { debugLog } from '../logging/logger'
import { clampScale, computeCenteredOffset, computeFitScale, computeReadableScale, type Point, type ViewBox, zoomOffsetAroundPivot } from '../lib/viewportMath'

type PreviewMode = 'pan' | 'select'

type SelectionRect = {
  readonly start: Point
  readonly end: Point
}

type UsePreviewViewportInput = {
  readonly viewBox: ViewBox | null
  readonly selectionSignature: string
}

type UsePreviewViewportResult = {
  readonly previewScale: number
  readonly previewOffset: Point
  readonly isPreviewDragging: boolean
  readonly previewMode: PreviewMode
  readonly isCtrlHeld: boolean
  readonly rectSelect: SelectionRect | null
  readonly previewStageRef: React.RefObject<HTMLDivElement | null>
  readonly handlePreviewModePan: () => void
  readonly handlePreviewModeToggleSelect: () => void
  readonly handlePreviewMouseDown: (event: React.MouseEvent) => void
  readonly handlePreviewMouseMove: (event: React.MouseEvent) => void
  readonly handlePreviewMouseUp: () => void
  readonly previewZoomIn: () => void
  readonly previewZoomOut: () => void
  readonly resetPreviewView: () => void
  readonly fitPreviewView: () => void
}

const readSessionStorage = (key: string): string | null => {
  if (typeof window === 'undefined') return null

  const readResult = tryCatch(
    () => window.sessionStorage.getItem(key),
    () => null,
  )

  return match(() => null, (value: string | null) => value)(readResult)
}

const writeSessionStorage = (key: string, value: string, logMessage: string): void => {
  if (typeof window === 'undefined') return

  const writeResult = tryCatch(
    () => {
      window.sessionStorage.setItem(key, value)
      return value
    },
    (cause) => cause,
  )

  if (isErr(writeResult)) {
    debugLog('storage', logMessage, writeResult.error)
  }
}

/**
 * Manage preview viewport pan/zoom/selection state for the main workspace panel.
 * @param input Current viewBox and subtree selection signature.
 * @returns Preview viewport state and interaction handlers.
 */
export const usePreviewViewport = (input: UsePreviewViewportInput): UsePreviewViewportResult => {
  // DEVIATION(11.1): This hook intentionally coordinates persistence, pointer state, and viewport math for one cohesive interaction model.
  const sessionZoomKey = 'bcktrck:preview-zoom'
  const sessionOffsetKey = 'bcktrck:preview-offset'
  const [previewScale, setPreviewScale] = useState(() => {
    const stored = readSessionStorage(sessionZoomKey)
    return pipe(
      fromNullable(stored),
      mapOption((value) => Number(value)),
      getOrElseOption(() => 1)
    )
  })
  const [previewOffset, setPreviewOffset] = useState<Point>(() => {
    const stored = readSessionStorage(sessionOffsetKey)
    const parsedResult = tryCatch(
      () => JSON.parse(pipe(fromNullable(stored), getOrElseOption(() => '{"x":0,"y":0}'))),
      () => ({ x: 0, y: 0 }),
    )
    const parsed = match(() => ({ x: 0, y: 0 }), (value: unknown) => value)(parsedResult)
    if (!isRecord(parsed)) return { x: 0, y: 0 }

    const x = getNumberField(parsed, 'x')
    const y = getNumberField(parsed, 'y')
    if (isSome(x) && isSome(y)) {
      return { x: x.value, y: y.value }
    }

    return { x: 0, y: 0 }
  })

  const previewScaleRef = useRef(1)
  const previewOffsetRef = useRef<Point>({ x: 0, y: 0 })
  const previewAutoCenteredRef = useRef(false)
  const [isPreviewDragging, setIsPreviewDragging] = useState(false)
  const [previewDragStart, setPreviewDragStart] = useState<Point>({ x: 0, y: 0 })
  const previewStageRef = useRef<HTMLDivElement>(null)
  const [previewMode, setPreviewMode] = useState<PreviewMode>('pan')
  const [isCtrlHeld, setIsCtrlHeld] = useState(false)
  const previewDragModeRef = useRef<PreviewMode>('pan')
  const [rectSelect, setRectSelect] = useState<SelectionRect | null>(null)

  useEffect(() => {
    previewAutoCenteredRef.current = false
  }, [input.selectionSignature])

  useEffect(() => {
    previewScaleRef.current = previewScale
    writeSessionStorage(sessionZoomKey, String(previewScale), 'storage.session.preview_zoom.persist.failed')
  }, [previewScale])

  useEffect(() => {
    previewOffsetRef.current = previewOffset
    writeSessionStorage(sessionOffsetKey, JSON.stringify(previewOffset), 'storage.session.preview_offset.persist.failed')
  }, [previewOffset])

  const handlePreviewModePan = useCallback(() => {
    setPreviewMode('pan')
  }, [setPreviewMode])

  const handlePreviewModeToggleSelect = useCallback(() => {
    setPreviewMode((currentMode) => (currentMode === 'select' ? 'pan' : 'select'))
  }, [setPreviewMode])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleKeyStateChange = (event: KeyboardEvent) => {
      setIsCtrlHeld(event.ctrlKey)
    }

    const resetKeyState = () => {
      setIsCtrlHeld(false)
    }

    window.addEventListener('keydown', handleKeyStateChange)
    window.addEventListener('keyup', handleKeyStateChange)
    window.addEventListener('blur', resetKeyState)

    return () => {
      window.removeEventListener('keydown', handleKeyStateChange)
      window.removeEventListener('keyup', handleKeyStateChange)
      window.removeEventListener('blur', resetKeyState)
    }
  }, [])

  const setPreviewHomePosition = useCallback((mode: 'readable' | 'fit' = 'readable') => {
    const stageOption = fromNullable(previewStageRef.current)
    const viewBoxOption = fromNullable(input.viewBox)
    if (isNone(stageOption) || isNone(viewBoxOption)) return
    const stage = stageOption.value
    const viewBox = viewBoxOption.value

    const stageSize = { width: stage.clientWidth, height: stage.clientHeight }
    const fitScale = computeFitScale(viewBox, stageSize)
    const targetScale = mode === 'fit' ? fitScale : computeReadableScale(fitScale)
    const centeredOffset = computeCenteredOffset(viewBox, stageSize, targetScale)

    previewScaleRef.current = targetScale
    previewOffsetRef.current = centeredOffset
    setPreviewScale(targetScale)
    setPreviewOffset(centeredOffset)
  }, [input.viewBox])

  const applyPreviewZoom = useCallback((factor: number, pivot: Point) => {
    const currentScale = previewScaleRef.current
    const currentOffset = previewOffsetRef.current
    const nextScale = clampScale(currentScale * factor)
    const nextOffset = zoomOffsetAroundPivot(currentOffset, currentScale, nextScale, pivot)

    previewScaleRef.current = nextScale
    previewOffsetRef.current = nextOffset
    setPreviewScale(nextScale)
    setPreviewOffset(nextOffset)
  }, [])

  useEffect(() => {
    const viewBoxOption = fromNullable(input.viewBox)
    if (isNone(viewBoxOption) || previewAutoCenteredRef.current) return

    const animationFrame = window.requestAnimationFrame(() => {
      setPreviewHomePosition('readable')
      previewAutoCenteredRef.current = true
    })

    return () => window.cancelAnimationFrame(animationFrame)
  }, [input.viewBox, setPreviewHomePosition])

  const handlePreviewMouseDown = useCallback((event: React.MouseEvent) => {
    if (event.button !== 0) return

    const nextPreviewDragMode: PreviewMode = event.ctrlKey || previewMode === 'select' ? 'select' : 'pan'
    previewDragModeRef.current = nextPreviewDragMode

    if (nextPreviewDragMode === 'pan') {
      setIsPreviewDragging(true)
      setPreviewDragStart({ x: event.clientX - previewOffset.x, y: event.clientY - previewOffset.y })
      return
    }

    const rect = pipe(
      fromNullable(previewStageRef.current?.getBoundingClientRect()),
      getOrElseOption(() => ({ left: 0, top: 0 }))
    )
    setRectSelect({
      start: { x: event.clientX - rect.left, y: event.clientY - rect.top },
      end: { x: event.clientX - rect.left, y: event.clientY - rect.top }
    })
  }, [previewOffset, previewMode])

  const handlePreviewMouseMove = useCallback((event: React.MouseEvent) => {
    if (isPreviewDragging && previewDragModeRef.current === 'pan') {
      setPreviewOffset({ x: event.clientX - previewDragStart.x, y: event.clientY - previewDragStart.y })
      return
    }

    const rectSelectOption = fromNullable(rectSelect)
    if (isNone(rectSelectOption) || previewDragModeRef.current !== 'select') return

    const rect = pipe(
      fromNullable(previewStageRef.current?.getBoundingClientRect()),
      getOrElseOption(() => ({ left: 0, top: 0 }))
    )
    setRectSelect({
      ...rectSelectOption.value,
      end: { x: event.clientX - rect.left, y: event.clientY - rect.top }
    })
  }, [isPreviewDragging, previewDragStart, rectSelect])

  const handlePreviewMouseUp = useCallback(() => {
    setIsPreviewDragging(false)

    const rectSelectOption = fromNullable(rectSelect)
    const viewBoxOption = fromNullable(input.viewBox)
    const stageOption = fromNullable(previewStageRef.current)

    if (
      isSome(rectSelectOption)
      && previewDragModeRef.current === 'select'
      && isSome(viewBoxOption)
      && isSome(stageOption)
    ) {
      const { start, end } = rectSelectOption.value
      const minX = Math.min(start.x, end.x)
      const minY = Math.min(start.y, end.y)
      const maxX = Math.max(start.x, end.x)
      const maxY = Math.max(start.y, end.y)

      const scale = previewScaleRef.current
      const offset = previewOffsetRef.current
      const svgX = (minX - offset.x) / scale
      const svgY = (minY - offset.y) / scale
      const svgW = (maxX - minX) / scale
      const svgH = (maxY - minY) / scale

      const stageWidth = stageOption.value.clientWidth
      const stageHeight = stageOption.value.clientHeight
      const fitScale = clampScale(Math.min(stageWidth / svgW, stageHeight / svgH))
      const offsetX = -svgX * fitScale + (stageWidth - svgW * fitScale) / 2
      const offsetY = -svgY * fitScale + (stageHeight - svgH * fitScale) / 2

      setPreviewScale(fitScale)
      setPreviewOffset({ x: offsetX, y: offsetY })
    }

    previewDragModeRef.current = previewMode
    setRectSelect(null)
  }, [previewMode, rectSelect, input.viewBox])

  const zoomPreviewByFactor = useCallback((factor: number) => {
    const stageOption = fromNullable(previewStageRef.current)
    if (isNone(stageOption)) return
    const stage = stageOption.value

    applyPreviewZoom(factor, { x: stage.clientWidth / 2, y: stage.clientHeight / 2 })
  }, [applyPreviewZoom])

  const previewZoomIn = useCallback(() => zoomPreviewByFactor(1.3), [zoomPreviewByFactor])
  const previewZoomOut = useCallback(() => zoomPreviewByFactor(1 / 1.3), [zoomPreviewByFactor])

  const resetPreviewView = useCallback(() => {
    setPreviewHomePosition('readable')
    setPreviewMode('pan')
  }, [setPreviewHomePosition, setPreviewMode])

  const fitPreviewView = useCallback(() => {
    setPreviewHomePosition('fit')
    setPreviewMode('pan')
  }, [setPreviewHomePosition, setPreviewMode])

  useEffect(() => {
    const elementOption = fromNullable(previewStageRef.current)
    if (isNone(elementOption)) return
    const element = elementOption.value

    const handler = (event: WheelEvent) => {
      event.preventDefault()
      const lineHeightPx = 16
      const pageHeightPx = element.clientHeight || (typeof window === 'undefined' ? 600 : window.innerHeight)
      const deltaYpx =
        event.deltaMode === WheelEvent.DOM_DELTA_LINE
          ? event.deltaY * lineHeightPx
          : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
            ? event.deltaY * pageHeightPx
            : event.deltaY
      const clampedDelta = Math.max(-240, Math.min(240, deltaYpx))
      const factor = Math.exp(-clampedDelta * 0.001)
      const rect = element.getBoundingClientRect()
      applyPreviewZoom(factor, { x: event.clientX - rect.left, y: event.clientY - rect.top })
    }

    element.addEventListener('wheel', handler, { passive: false })
    return () => element.removeEventListener('wheel', handler)
  }, [applyPreviewZoom, input.viewBox])

  return {
    previewScale,
    previewOffset,
    isPreviewDragging,
    previewMode,
    isCtrlHeld,
    rectSelect,
    previewStageRef,
    handlePreviewModePan,
    handlePreviewModeToggleSelect,
    handlePreviewMouseDown,
    handlePreviewMouseMove,
    handlePreviewMouseUp,
    previewZoomIn,
    previewZoomOut,
    resetPreviewView,
    fitPreviewView
  }
}
