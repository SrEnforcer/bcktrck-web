/**
 * @module components/app-sections
 *
 * Define presentational workspace sections for topbar, editor panel, preview,
 * and overlay viewer used by the root application shell.
 *
 * @packageDocumentation
 */
import type { SubtreeEntry } from '@bcktrck/engine'
import { fromNullable, getOrElse, isSome, mapO, pipe } from '@tsfpp/prelude'
import { Expand, Hand, Maximize2, Minus, Plus, RotateCcw, Square, X } from 'lucide-react'
import type { RefObject } from 'react'
import { BcktrckEditor } from './BcktrckEditor'
import { toSvgDataUri } from '../lib/svgDataUri'

type SelectOption<T extends string> = {
  readonly value: T
  readonly label: string
}

type WorkspaceTopbarProps = {
  readonly renderStatus: string
  readonly isRenderOk: boolean
  readonly sourceLineCount: number
  readonly editorFontSize: number
  readonly currentPrintFormatLabel: string
  readonly stylePackChoice: string
  readonly themePreference: string
  readonly stylePackOptions: readonly SelectOption<string>[]
  readonly themeOptions: readonly SelectOption<string>[]
  readonly undoStack: readonly string[]
  readonly onStylePackChange: (nextValue: string) => void
  readonly onThemePreferenceChange: (nextValue: string) => void
  readonly onExportSource: () => void
  readonly onUndo: () => void
  readonly onResetSample: () => void
}

/**
 * Workspace header with status indicators and global actions.
 * @param props Topbar render state and action callbacks.
 * @returns Topbar header element.
 */
// DEVIATION(11.2): This presentational module currently groups workspace sections to keep cross-panel UI contracts co-located.
// DEVIATION(11.1): Topbar render body remains expanded while extraction of toolbar micro-components is staged.
export const WorkspaceTopbar = ({
  renderStatus,
  isRenderOk,
  sourceLineCount,
  editorFontSize,
  currentPrintFormatLabel,
  stylePackChoice,
  themePreference,
  stylePackOptions,
  themeOptions,
  undoStack,
  onStylePackChange,
  onThemePreferenceChange,
  onExportSource,
  onUndo,
  onResetSample
}: WorkspaceTopbarProps): React.JSX.Element => (
  <header className="topbar">
    <div className="topbar-intro">
      <div className="brand-row">
        <p className="eyebrow">bcktrck studio</p>
        <span className={`status-pill${isRenderOk ? ' is-ready' : ' is-warning'}`}>{renderStatus}</span>
      </div>
      <h1>Backtrack Editor</h1>
      <div className="summary-strip" aria-label="Workspace summary">
        <span className="summary-chip">{sourceLineCount} lines</span>
        <span className="summary-chip">Font {editorFontSize}px</span>
        <span className="summary-chip">Print {currentPrintFormatLabel}</span>
      </div>
    </div>
    <div className="topbar-actions">
      <label className="toolbar-field toolbar-field-inline" htmlFor="style-pack">
        Graph
        <select
          id="style-pack"
          className="toolbar-select"
          value={stylePackChoice}
          onChange={(event) => onStylePackChange(event.target.value)}
        >
          {stylePackOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </label>
      <label className="toolbar-field toolbar-field-inline" htmlFor="theme-preference">
        Theme
        <select
          id="theme-preference"
          className="toolbar-select"
          value={themePreference}
          onChange={(event) => onThemePreferenceChange(event.target.value)}
        >
          {themeOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </label>
      {undoStack.length > 0 && (
        <button
          type="button"
          className="button button-secondary"
          onClick={onUndo}
          title={`Undo (restore to ${pipe(
            fromNullable(undoStack[0]),
            mapO((source) => source.split(/\r?\n/).length),
            getOrElse(() => 0)
          )} lines)`}
        >
          ↶ Undo
        </button>
      )}
      <button
        type="button"
        className="button button-secondary"
        onClick={onExportSource}
      >
        Export .btl
      </button>
      <button
        type="button"
        className="button button-primary"
        onClick={onResetSample}
      >
        Reset sample
      </button>
    </div>
  </header>
)

type EditorPanelProps = {
  readonly leftPanelTab: 'source' | 'style' | 'tree'
  readonly editorPanelWidth: number
  readonly editorFontSize: number
  readonly source: string
  readonly styleEditorText: string
  readonly editorInstanceKey: React.Key
  readonly styleEditorInstanceKey: React.Key
  readonly resolvedTheme: 'light' | 'dark'
  readonly subtreeEntries: readonly SubtreeEntry[]
  readonly subtreeIsolationMode: 'context' | 'forest'
  readonly normalizedSelectedSubtreeIds: readonly string[]
  readonly forestSelectionIds: readonly string[]
  readonly onLeftPanelTabChange: (nextTab: 'source' | 'style' | 'tree') => void
  readonly onEditorFontSizeChange: (nextSize: number) => void
  readonly onSourceChange: (nextSource: string) => void
  readonly onStyleEditorChange: (nextStyle: string) => void
  readonly onSubtreeIsolationModeChange: (nextMode: 'context' | 'forest') => void
  readonly onClearSelectedSubtrees: () => void
  readonly onToggleSelectedSubtree: (subtreeId: string, isChecked: boolean) => void
}

/**
 * Left workspace panel with source/style editors and tree selection tab.
 * @param props Editor panel state and interaction callbacks.
 * @returns Editor panel element.
 */
// DEVIATION(11.1): Editor panel keeps tab/render logic together to avoid prop-drilling churn during active feature work.
export const EditorPanel = ({
  leftPanelTab,
  editorPanelWidth,
  editorFontSize,
  source,
  styleEditorText,
  editorInstanceKey,
  styleEditorInstanceKey,
  resolvedTheme,
  subtreeEntries,
  subtreeIsolationMode,
  normalizedSelectedSubtreeIds,
  forestSelectionIds,
  onLeftPanelTabChange,
  onEditorFontSizeChange,
  onSourceChange,
  onStyleEditorChange,
  onSubtreeIsolationModeChange,
  onClearSelectedSubtrees,
  onToggleSelectedSubtree
}: EditorPanelProps): React.JSX.Element => (
  <article className="panel editor-panel" style={{ flexBasis: `${editorPanelWidth}%` }}>
    <div className="panel-header editor-header">
      <div className="editor-tabs" role="tablist" aria-label="Editor and tree tabs">
        <button
          type="button"
          role="tab"
          className={`panel-tab${leftPanelTab === 'source' ? ' is-active' : ''}`}
          aria-selected={leftPanelTab === 'source'}
          onClick={() => onLeftPanelTabChange('source')}
        >
          Source
        </button>
        <button
          type="button"
          role="tab"
          className={`panel-tab${leftPanelTab === 'style' ? ' is-active' : ''}`}
          aria-selected={leftPanelTab === 'style'}
          onClick={() => onLeftPanelTabChange('style')}
        >
          Style
        </button>
        <button
          type="button"
          role="tab"
          className={`panel-tab${leftPanelTab === 'tree' ? ' is-active' : ''}`}
          aria-selected={leftPanelTab === 'tree'}
          onClick={() => onLeftPanelTabChange('tree')}
        >
          Tree
        </button>
      </div>
      {(leftPanelTab === 'source' || leftPanelTab === 'style') && (
        <div className="editor-controls">
          <label className="toolbar-field toolbar-field-inline" htmlFor="editor-font-size">
            Font
            <select
              id="editor-font-size"
              className="toolbar-select"
              value={editorFontSize}
              onChange={(event) => onEditorFontSizeChange(Number(event.target.value))}
            >
              {[12, 13, 14, 15, 16, 18, 20].map((size) => (
                <option key={size} value={size}>{size}px</option>
              ))}
            </select>
          </label>
        </div>
      )}
    </div>
    {leftPanelTab === 'source' ? (
      <BcktrckEditor
        initialValue={source}
        onChange={onSourceChange}
        fontSize={editorFontSize}
        editorInstanceKey={editorInstanceKey}
        resolvedTheme={resolvedTheme}
      />
    ) : leftPanelTab === 'style' ? (
      <BcktrckEditor
        initialValue={styleEditorText}
        onChange={onStyleEditorChange}
        fontSize={editorFontSize}
        editorInstanceKey={styleEditorInstanceKey}
        resolvedTheme={resolvedTheme}
      />
    ) : (
      <section className="tree-tab-panel" aria-label="Subtree controls">
        {subtreeEntries.length > 0 ? (
          <div className="subtree-picker subtree-picker-panel" aria-label="Subtree isolation">
            <div className="subtree-picker-toolbar">
              <label className="toolbar-field toolbar-field-inline" htmlFor="subtree-mode-select">
                Mode
                <select
                  id="subtree-mode-select"
                  className="toolbar-select"
                  value={subtreeIsolationMode}
                  onChange={(event) => onSubtreeIsolationModeChange(event.target.value === 'forest' ? 'forest' : 'context')}
                >
                  <option value="context">Context (LCA)</option>
                  <option value="forest">Forest (union)</option>
                </select>
              </label>
              <button
                type="button"
                className="button button-secondary subtree-clear-btn"
                onClick={onClearSelectedSubtrees}
                disabled={normalizedSelectedSubtreeIds.length === 0}
              >
                Clear
              </button>
            </div>
            <div className="subtree-picker-caption">
              {normalizedSelectedSubtreeIds.length === 0
                ? 'No subtree selected: full chart'
                : `Selected: ${normalizedSelectedSubtreeIds.length}`}
            </div>
            {subtreeIsolationMode === 'forest' && forestSelectionIds.length > 0 && (
              <div className="subtree-picker-note">Forest mode renders a union of selected subtrees.</div>
            )}
            <div className="subtree-picker-list" role="group" aria-label="Department selection">
              {subtreeEntries.map((entry) => {
                const checked = normalizedSelectedSubtreeIds.includes(entry.id)
                return (
                  <label
                    key={entry.id}
                    className="subtree-picker-item"
                    style={{ paddingLeft: `${entry.depth * 12 + 8}px` }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(event) => onToggleSelectedSubtree(entry.id, event.target.checked)}
                    />
                    <span>{entry.label}</span>
                  </label>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="subtree-empty">No subtree nodes available for isolation.</div>
        )}
      </section>
    )}
  </article>
)

type PrintFormatOption = {
  readonly value: string
  readonly label: string
}

type SelectionRect = {
  readonly start: { readonly x: number; readonly y: number }
  readonly end: { readonly x: number; readonly y: number }
}

type PreviewPanelProps = {
  readonly isResultOk: boolean
  readonly errorText: string
  readonly safeSvg: string
  readonly isPreviewDragging: boolean
  readonly previewMode: 'pan' | 'select'
  readonly isCtrlHeld: boolean
  readonly previewScale: number
  readonly previewOffset: { readonly x: number; readonly y: number }
  readonly rectSelect: SelectionRect | null
  readonly printPageFormat: string
  readonly printPageFormats: readonly PrintFormatOption[]
  readonly previewStageRef: RefObject<HTMLDivElement | null>
  readonly onPreviewModePan: () => void
  readonly onPreviewModeToggleSelect: () => void
  readonly onPreviewZoomOut: () => void
  readonly onPreviewZoomIn: () => void
  readonly onResetPreviewView: () => void
  readonly onFitPreviewView: () => void
  readonly onPrintPageFormatChange: (nextValue: string) => void
  readonly onPrintChart: () => void
  readonly onOpenOverlay: () => void
  readonly onPreviewMouseDown: (event: React.MouseEvent) => void
  readonly onPreviewMouseMove: (event: React.MouseEvent) => void
  readonly onPreviewMouseUp: () => void
}

/**
 * Main preview panel for rendered SVG and viewport controls.
 * @param props Preview state and viewport actions.
 * @returns Preview panel element.
 */
// DEVIATION(11.1): Preview panel intentionally keeps controls and viewport markup together pending dedicated toolbar extraction.
export const PreviewPanel = ({
  isResultOk,
  errorText,
  safeSvg,
  isPreviewDragging,
  previewMode,
  isCtrlHeld,
  previewScale,
  previewOffset,
  rectSelect,
  printPageFormat,
  printPageFormats,
  previewStageRef,
  onPreviewModePan,
  onPreviewModeToggleSelect,
  onPreviewZoomOut,
  onPreviewZoomIn,
  onResetPreviewView,
  onFitPreviewView,
  onPrintPageFormatChange,
  onPrintChart,
  onOpenOverlay,
  onPreviewMouseDown,
  onPreviewMouseMove,
  onPreviewMouseUp
}: PreviewPanelProps): React.JSX.Element => (
  <article className="panel preview-panel">
    <div className="panel-header preview-header">
      <h2>Preview</h2>
      <div className="preview-controls">
        {isResultOk && (
          <>
            <button type="button" className="icon-button" onClick={onPreviewModePan} title="Pan (default)">
              <Hand size={14} strokeWidth={1.9} aria-hidden="true" />
            </button>
            <button type="button" className={`icon-button${previewMode === 'select' ? ' is-active' : ''}`} onClick={onPreviewModeToggleSelect} title="Rectangle select (Ctrl+drag)">
              <Square size={14} strokeWidth={1.9} aria-hidden="true" />
            </button>
            <button type="button" className="icon-button" onClick={onPreviewZoomOut} title="Zoom out (scroll wheel)">
              <Minus size={14} strokeWidth={1.9} aria-hidden="true" />
            </button>
            <button type="button" className="icon-button" onClick={onPreviewZoomIn} title="Zoom in (scroll wheel)">
              <Plus size={14} strokeWidth={1.9} aria-hidden="true" />
            </button>
            <button type="button" className="icon-button" onClick={onResetPreviewView} title="Reset view">
              <RotateCcw size={14} strokeWidth={1.9} aria-hidden="true" />
            </button>
            <button type="button" className="icon-button fit-btn" onClick={onFitPreviewView} title="Fit in page">
              <Maximize2 size={14} strokeWidth={1.9} aria-hidden="true" />
            </button>
            <span className="zoom-pct">{Math.round(previewScale * 100)}%</span>
            <label className="toolbar-field toolbar-field-inline" htmlFor="print-page-format">
              Page
              <select
                id="print-page-format"
                className="toolbar-select"
                value={printPageFormat}
                onChange={(event) => onPrintPageFormatChange(event.target.value)}
              >
                {printPageFormats.map((format) => (
                  <option key={format.value} value={format.value}>{format.label}</option>
                ))}
              </select>
            </label>
            <button type="button" className="button button-secondary print-btn" onClick={onPrintChart} title="Print backtrack chart">
              Print
            </button>
          </>
        )}
        {isResultOk && (
          <button type="button" className="button button-secondary" onClick={onOpenOverlay} title="Open in full-screen viewer">
            <Expand size={14} strokeWidth={1.9} aria-hidden="true" /> Open viewer
          </button>
        )}
      </div>
    </div>
    {isResultOk ? (
      <div
        ref={previewStageRef}
        className={`svg-stage${isPreviewDragging ? ' dragging' : ''}`}
        onMouseDown={onPreviewMouseDown}
        onMouseMove={onPreviewMouseMove}
        onMouseUp={onPreviewMouseUp}
        onMouseLeave={onPreviewMouseUp}
        style={{
          cursor: previewMode === 'select'
            || isSome(fromNullable(rectSelect))
            || (isCtrlHeld && !isPreviewDragging)
            ? 'crosshair'
            : (isPreviewDragging ? 'grabbing' : 'grab')
        }}
      >
        <div
          className="svg-fit"
          style={{
            transform: `translate(${previewOffset.x}px, ${previewOffset.y}px) scale(${previewScale})`,
            transformOrigin: '0 0',
            transition: isPreviewDragging ? 'none' : undefined
          }}
        >
          <img className="svg-fit-image" src={toSvgDataUri(safeSvg)} alt="" draggable={false} />
        </div>
        {pipe(
          fromNullable(rectSelect),
          mapO((selection) => (
            <div
              style={{
                position: 'absolute',
                left: Math.min(selection.start.x, selection.end.x),
                top: Math.min(selection.start.y, selection.end.y),
                width: Math.abs(selection.end.x - selection.start.x),
                height: Math.abs(selection.end.y - selection.start.y),
                border: '2px dashed #0b5fff',
                background: 'rgba(11,95,255,0.08)',
                pointerEvents: 'none',
                zIndex: 10
              }}
            />
          )),
          getOrElse((): React.JSX.Element | null => null)
        )}
      </div>
    ) : (
      <pre className="error-box">{errorText}</pre>
    )}
  </article>
)

type OverlayViewerProps = {
  readonly overlayOpen: boolean
  readonly safeSvg: string
  readonly viewScale: number
  readonly viewOffset: { readonly x: number; readonly y: number }
  readonly isDragging: boolean
  readonly overlayStageRef: RefObject<HTMLDivElement | null>
  readonly onCloseOverlay: () => void
  readonly onOverlayZoomOut: () => void
  readonly onOverlayZoomIn: () => void
  readonly onResetOverlayView: () => void
  readonly onFitOverlayView: () => void
  readonly onOverlayMouseDown: (event: React.MouseEvent) => void
  readonly onOverlayMouseMove: (event: React.MouseEvent) => void
  readonly onOverlayMouseUp: () => void
}

/**
 * Fullscreen overlay viewer for the rendered SVG.
 * @param props Overlay state and viewport actions.
 * @returns Overlay dialog when open, otherwise null.
 */
export const OverlayViewer = ({
  overlayOpen,
  safeSvg,
  viewScale,
  viewOffset,
  isDragging,
  overlayStageRef,
  onCloseOverlay,
  onOverlayZoomOut,
  onOverlayZoomIn,
  onResetOverlayView,
  onFitOverlayView,
  onOverlayMouseDown,
  onOverlayMouseMove,
  onOverlayMouseUp
}: OverlayViewerProps): React.JSX.Element | null => {
  if (!overlayOpen) {
    return null
  }

  return (
    <div className="overlay-backdrop" onClick={onCloseOverlay} role="dialog" aria-modal="true" aria-label="Backtrack viewer">
      <div
        className="overlay-panel"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="overlay-header">
          <span className="overlay-title">Backtrack Viewer</span>
          <div className="overlay-controls">
            <button type="button" className="icon-button" onClick={onOverlayZoomOut} title="Zoom out">
              <Minus size={14} strokeWidth={1.9} aria-hidden="true" />
            </button>
            <button type="button" className="icon-button" onClick={onOverlayZoomIn} title="Zoom in">
              <Plus size={14} strokeWidth={1.9} aria-hidden="true" />
            </button>
            <button type="button" className="icon-button" onClick={onResetOverlayView} title="Reset view">
              <RotateCcw size={14} strokeWidth={1.9} aria-hidden="true" />
            </button>
            <button type="button" className="icon-button fit-btn" onClick={onFitOverlayView} title="Fit in page">
              <Maximize2 size={14} strokeWidth={1.9} aria-hidden="true" />
            </button>
            <span className="zoom-pct">{Math.round(viewScale * 100)}%</span>
            <button type="button" className="close-btn" onClick={onCloseOverlay} title="Close (Esc)">
              <X size={14} strokeWidth={1.9} aria-hidden="true" />
            </button>
          </div>
        </header>
        <div
          ref={overlayStageRef}
          className={`overlay-stage${isDragging ? ' dragging' : ''}`}
          onMouseDown={onOverlayMouseDown}
          onMouseMove={onOverlayMouseMove}
          onMouseUp={onOverlayMouseUp}
          onMouseLeave={onOverlayMouseUp}
        >
          <div
            className="overlay-viewport"
            style={{
              transform: `translate(${viewOffset.x}px, ${viewOffset.y}px) scale(${viewScale})`,
              transformOrigin: '0 0'
            }}
          >
            <img className="svg-fit-image" src={toSvgDataUri(safeSvg)} alt="" draggable={false} />
          </div>
        </div>
      </div>
    </div>
  )
}
