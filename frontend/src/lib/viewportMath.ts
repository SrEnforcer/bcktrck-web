/**
 * @module lib/viewport-math
 *
 * Pure viewport geometry helpers used by preview and overlay pan/zoom interactions.
 *
 * @packageDocumentation
 */

/** Minimum allowed zoom scale. */
export const minViewScale = 0.05
/** Maximum allowed zoom scale. */
export const maxViewScale = 8
const fitPaddingPx = 32
const readableBoost = 1.35
const readableMinScale = 0.85
const readableMaxScale = 2.4

/** SVG viewBox dimensions used for viewport computations. */
export type ViewBox = {
  readonly width: number
  readonly height: number
}

/** 2D point coordinate in viewport space. */
export type Point = {
  readonly x: number
  readonly y: number
}

type StageSize = {
  readonly width: number
  readonly height: number
}

/**
 * Clamp a candidate scale into supported viewport bounds.
 * @param scale Requested scale.
 * @returns Scale constrained between `minViewScale` and `maxViewScale`.
 */
export const clampScale = (scale: number): number => Math.min(maxViewScale, Math.max(minViewScale, scale))

/**
 * Compute the scale needed to fit an SVG viewBox inside a stage.
 * @param viewBox SVG viewBox dimensions.
 * @param stage Stage dimensions.
 * @returns Fit scale constrained to allowed zoom limits.
 */
export const computeFitScale = (
  viewBox: ViewBox,
  stage: StageSize
): number => {
  const usableWidth = Math.max(1, stage.width - fitPaddingPx)
  const usableHeight = Math.max(1, stage.height - fitPaddingPx)
  const fitByWidth = usableWidth / Math.max(1, viewBox.width)
  const fitByHeight = usableHeight / Math.max(1, viewBox.height)
  return clampScale(Math.min(fitByWidth, fitByHeight))
}

/**
 * Compute a readable scale from a fit scale.
 * @param fitScale Baseline fit scale.
 * @returns Readable scale with bounded boost.
 */
export const computeReadableScale = (fitScale: number): number =>
  clampScale(Math.min(readableMaxScale, Math.max(readableMinScale, fitScale * readableBoost)))

/**
 * Compute centered offset for a scaled viewBox in a stage.
 * @param viewBox SVG viewBox dimensions.
 * @param stage Stage dimensions.
 * @param scale Applied scale.
 * @returns Offset that centers the scaled content.
 */
export const computeCenteredOffset = (
  viewBox: ViewBox,
  stage: StageSize,
  scale: number
): Point => {
  const scaledWidth = viewBox.width * scale
  const scaledHeight = viewBox.height * scale
  return {
    x: (stage.width - scaledWidth) / 2,
    y: (stage.height - scaledHeight) / 2
  }
}

/**
 * Compute the next offset while zooming around a fixed pivot.
 * @param currentOffset Current viewport offset.
 * @param currentScale Current viewport scale.
 * @param nextScale Next viewport scale.
 * @param pivot Zoom pivot in stage coordinates.
 * @returns Updated viewport offset preserving pivot position.
 */
export const zoomOffsetAroundPivot = (
  currentOffset: Point,
  currentScale: number,
  nextScale: number,
  pivot: Point
): Point => {
  const ratio = nextScale / currentScale
  return {
    x: pivot.x - (pivot.x - currentOffset.x) * ratio,
    y: pivot.y - (pivot.y - currentOffset.y) * ratio
  }
}
