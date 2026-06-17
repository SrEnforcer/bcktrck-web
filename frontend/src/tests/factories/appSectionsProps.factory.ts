import type { ComponentProps } from 'react'
import {
  EditorPanel,
  OverlayViewer,
  PreviewPanel,
  WorkspaceTopbar,
} from '../../components/AppSections'

const noop = (): void => undefined

const noopMouse = (): void => undefined

/**
 * Builds topbar props with deterministic defaults for component tests.
 * @param input Required callbacks for behavioral assertions.
 * @returns Topbar props.
 */
export const makeWorkspaceTopbarProps = (
  input: Readonly<{ readonly onExportSource: () => void }>,
): ComponentProps<typeof WorkspaceTopbar> => ({
  renderStatus: 'Render OK',
  isRenderOk: true,
  sourceLineCount: 12,
  editorFontSize: 14,
  currentPrintFormatLabel: 'A4 Landscape',
  stylePackChoice: 'inherit',
  themePreference: 'system',
  stylePackOptions: [{ value: 'inherit', label: 'From source' }],
  themeOptions: [{ value: 'system', label: 'System' }],
  undoStack: [],
  onStylePackChange: noop,
  onThemePreferenceChange: noop,
  onExportSource: input.onExportSource,
  onUndo: noop,
  onResetSample: noop,
})

/**
 * Builds editor panel props with deterministic defaults for component tests.
 * @returns Editor panel props.
 */
export const makeEditorPanelProps = (): ComponentProps<typeof EditorPanel> => ({
  leftPanelTab: 'source',
  editorPanelWidth: 42,
  editorFontSize: 14,
  source: 'org "Test"',
  styleEditorText: '',
  editorInstanceKey: 'source-key',
  styleEditorInstanceKey: 'style-key',
  resolvedTheme: 'light',
  subtreeEntries: [],
  subtreeIsolationMode: 'forest',
  collapsedSubtreeRootIds: [],
  normalizedSelectedSubtreeIds: [],
  forestSelectionIds: [],
  onLeftPanelTabChange: noop,
  onEditorFontSizeChange: noop,
  onSourceChange: noop,
  onStyleEditorChange: noop,
  onSubtreeIsolationModeChange: noop,
  onToggleCollapsedSubtreeRoot: noop,
  onClearSelectedSubtrees: noop,
  onToggleSelectedSubtree: noop,
})

/**
 * Builds preview panel props representing an error-state render.
 * @returns Preview panel props.
 */
export const makePreviewPanelErrorProps = (): ComponentProps<typeof PreviewPanel> => ({
  isResultOk: false,
  errorText: 'Compile failed',
  safeSvg: '',
  isPreviewDragging: false,
  previewMode: 'pan',
  isCtrlHeld: false,
  previewScale: 1,
  previewOffset: { x: 0, y: 0 },
  rectSelect: null,
  printPageFormat: 'a4-landscape',
  printPageFormats: [{ value: 'a4-landscape', label: 'A4 Landscape' }],
  previewStageRef: { current: null },
  onPreviewModePan: noop,
  onPreviewModeToggleSelect: noop,
  onPreviewZoomOut: noop,
  onPreviewZoomIn: noop,
  onResetPreviewView: noop,
  onFitPreviewView: noop,
  onPrintPageFormatChange: noop,
  onPrintChart: noop,
  onOpenOverlay: noop,
  onPreviewMouseDown: noopMouse,
  onPreviewMouseMove: noopMouse,
  onPreviewMouseUp: noop,
})

/**
 * Builds overlay viewer props with deterministic defaults for component tests.
 * @param input Required callbacks for behavioral assertions.
 * @returns Overlay viewer props.
 */
export const makeOverlayViewerProps = (
  input: Readonly<{ readonly onCloseOverlay: () => void }>,
): ComponentProps<typeof OverlayViewer> => ({
  overlayOpen: true,
  safeSvg: '<svg />',
  viewScale: 1,
  viewOffset: { x: 0, y: 0 },
  isDragging: false,
  overlayStageRef: { current: null },
  onCloseOverlay: input.onCloseOverlay,
  onOverlayZoomOut: noop,
  onOverlayZoomIn: noop,
  onResetOverlayView: noop,
  onFitOverlayView: noop,
  onOverlayMouseDown: noopMouse,
  onOverlayMouseMove: noopMouse,
  onOverlayMouseUp: noop,
})
