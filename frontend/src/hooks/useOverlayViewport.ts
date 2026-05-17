import { useCallback, useEffect, useRef, useState } from 'react'
import { clampScale, computeCenteredOffset, computeFitScale, computeReadableScale, type Point, type ViewBox, zoomOffsetAroundPivot } from '../lib/viewportMath'

type UseOverlayViewportInput = {
  readonly viewBox: ViewBox | null
}

type UseOverlayViewportResult = {
  readonly overlayOpen: boolean
  readonly viewScale: number
  readonly viewOffset: Point
  readonly isDragging: boolean
  readonly overlayStageRef: React.RefObject<HTMLDivElement | null>
  readonly openOverlay: () => void
  readonly closeOverlay: () => void
  readonly zoomOut: () => void
  readonly zoomIn: () => void
  readonly resetView: () => void
  readonly fitOverlayView: () => void
  readonly handleMouseDown: (event: React.MouseEvent) => void
  readonly handleMouseMove: (event: React.MouseEvent) => void
  readonly handleMouseUp: () => void
}

/**
 * Manage overlay viewport pan/zoom state for the fullscreen viewer.
 * @param input Current SVG viewBox dimensions.
 * @returns Overlay visibility, viewport state, and interaction handlers.
 */
export const useOverlayViewport = (input: UseOverlayViewportInput): UseOverlayViewportResult => {
  const [overlayOpen, setOverlayOpen] = useState(false)
  const [viewScale, setViewScale] = useState(1)
  const [viewOffset, setViewOffset] = useState<Point>({ x: 0, y: 0 })
  const viewScaleRef = useRef(1)
  const viewOffsetRef = useRef<Point>({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<Point>({ x: 0, y: 0 })
  const overlayStageRef = useRef<HTMLDivElement>(null)
  const overlayAutoCenteredForOpenRef = useRef(false)

  useEffect(() => {
    viewScaleRef.current = viewScale
  }, [viewScale])

  useEffect(() => {
    viewOffsetRef.current = viewOffset
  }, [viewOffset])

  const setOverlayHomePosition = useCallback((mode: 'readable' | 'fit' = 'readable') => {
    const stage = overlayStageRef.current
    if (stage === null || input.viewBox === null) return

    const stageSize = { width: stage.clientWidth, height: stage.clientHeight }
    const fitScale = computeFitScale(input.viewBox, stageSize)
    const targetScale = mode === 'fit' ? fitScale : computeReadableScale(fitScale)
    const centeredOffset = computeCenteredOffset(input.viewBox, stageSize, targetScale)

    viewScaleRef.current = targetScale
    viewOffsetRef.current = centeredOffset
    setViewScale(targetScale)
    setViewOffset(centeredOffset)
  }, [input.viewBox])

  const applyOverlayZoom = useCallback((factor: number, pivot: Point) => {
    const currentScale = viewScaleRef.current
    const currentOffset = viewOffsetRef.current
    const nextScale = clampScale(currentScale * factor)
    const nextOffset = zoomOffsetAroundPivot(currentOffset, currentScale, nextScale, pivot)

    viewScaleRef.current = nextScale
    viewOffsetRef.current = nextOffset
    setViewScale(nextScale)
    setViewOffset(nextOffset)
  }, [])

  const openOverlay = useCallback(() => {
    setOverlayOpen(true)
  }, [])

  const closeOverlay = useCallback(() => {
    setOverlayOpen(false)
  }, [])

  useEffect(() => {
    if (!overlayOpen) return

    const firstControl = document.querySelector<HTMLButtonElement>('.overlay-controls button')
    firstControl?.focus()

    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeOverlay()
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [overlayOpen, closeOverlay])

  useEffect(() => {
    if (!overlayOpen) {
      overlayAutoCenteredForOpenRef.current = false
      return
    }

    if (input.viewBox === null || overlayAutoCenteredForOpenRef.current) return

    const animationFrame = window.requestAnimationFrame(() => {
      setOverlayHomePosition('readable')
      overlayAutoCenteredForOpenRef.current = true
    })

    return () => window.cancelAnimationFrame(animationFrame)
  }, [overlayOpen, input.viewBox, setOverlayHomePosition])

  useEffect(() => {
    if (!overlayOpen) return

    const element = overlayStageRef.current
    if (element === null) return

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
      applyOverlayZoom(factor, { x: event.clientX - rect.left, y: event.clientY - rect.top })
    }

    element.addEventListener('wheel', handler, { passive: false })
    return () => element.removeEventListener('wheel', handler)
  }, [overlayOpen, applyOverlayZoom])

  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    if (event.button !== 0) return
    setIsDragging(true)
    setDragStart({ x: event.clientX - viewOffset.x, y: event.clientY - viewOffset.y })
  }, [viewOffset])

  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (!isDragging) return
    setViewOffset({ x: event.clientX - dragStart.x, y: event.clientY - dragStart.y })
  }, [isDragging, dragStart])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const zoomOverlayByFactor = useCallback((factor: number) => {
    const stage = overlayStageRef.current
    if (stage === null) return
    applyOverlayZoom(factor, { x: stage.clientWidth / 2, y: stage.clientHeight / 2 })
  }, [applyOverlayZoom])

  const zoomIn = useCallback(() => zoomOverlayByFactor(1.3), [zoomOverlayByFactor])
  const zoomOut = useCallback(() => zoomOverlayByFactor(1 / 1.3), [zoomOverlayByFactor])
  const resetView = useCallback(() => setOverlayHomePosition('readable'), [setOverlayHomePosition])
  const fitOverlayView = useCallback(() => setOverlayHomePosition('fit'), [setOverlayHomePosition])

  return {
    overlayOpen,
    viewScale,
    viewOffset,
    isDragging,
    overlayStageRef,
    openOverlay,
    closeOverlay,
    zoomOut,
    zoomIn,
    resetView,
    fitOverlayView,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp
  }
}
