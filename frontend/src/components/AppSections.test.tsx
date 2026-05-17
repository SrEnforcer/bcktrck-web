import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import {
  EditorPanel,
  OverlayViewer,
  PreviewPanel,
  WorkspaceTopbar,
} from './AppSections'

vi.mock('./BcktrckEditor', () => ({
  BcktrckEditor: () => <div>Editor Stub</div>,
}))

describe('WorkspaceTopbar', () => {
  it('calls export callback when export button is clicked', () => {
    const onExportSource = vi.fn()

    render(
      <WorkspaceTopbar
        renderStatus="Render OK"
        isRenderOk={true}
        sourceLineCount={12}
        editorFontSize={14}
        currentPrintFormatLabel="A4 Landscape"
        stylePackChoice="inherit"
        themePreference="system"
        stylePackOptions={[{ value: 'inherit', label: 'From source' }]}
        themeOptions={[{ value: 'system', label: 'System' }]}
        undoStack={[]}
        onStylePackChange={() => undefined}
        onThemePreferenceChange={() => undefined}
        onExportSource={onExportSource}
        onUndo={() => undefined}
        onResetSample={() => undefined}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Export .btl' }))

    expect(onExportSource).toHaveBeenCalledTimes(1)
  })
})

describe('EditorPanel', () => {
  it('renders source editor tab content when source tab is active', () => {
    render(
      <EditorPanel
        leftPanelTab="source"
        editorPanelWidth={42}
        editorFontSize={14}
        source={'org "Test"'}
        styleEditorText=""
        editorInstanceKey="source-key"
        styleEditorInstanceKey="style-key"
        resolvedTheme="light"
        subtreeEntries={[]}
        subtreeIsolationMode="forest"
        normalizedSelectedSubtreeIds={[]}
        forestSelectionIds={[]}
        onLeftPanelTabChange={() => undefined}
        onEditorFontSizeChange={() => undefined}
        onSourceChange={() => undefined}
        onStyleEditorChange={() => undefined}
        onSubtreeIsolationModeChange={() => undefined}
        onClearSelectedSubtrees={() => undefined}
        onToggleSelectedSubtree={() => undefined}
      />,
    )

    expect(screen.getByText('Editor Stub')).toBeDefined()
  })
})

describe('PreviewPanel', () => {
  it('renders error state content when result is not ok', () => {
    render(
      <PreviewPanel
        isResultOk={false}
        errorText="Compile failed"
        safeSvg=""
        isPreviewDragging={false}
        previewMode="pan"
        isCtrlHeld={false}
        previewScale={1}
        previewOffset={{ x: 0, y: 0 }}
        rectSelect={null}
        printPageFormat="a4-landscape"
        printPageFormats={[{ value: 'a4-landscape', label: 'A4 Landscape' }]}
        previewStageRef={{ current: null }}
        onPreviewModePan={() => undefined}
        onPreviewModeToggleSelect={() => undefined}
        onPreviewZoomOut={() => undefined}
        onPreviewZoomIn={() => undefined}
        onResetPreviewView={() => undefined}
        onFitPreviewView={() => undefined}
        onPrintPageFormatChange={() => undefined}
        onPrintChart={() => undefined}
        onOpenOverlay={() => undefined}
        onPreviewMouseDown={() => undefined}
        onPreviewMouseMove={() => undefined}
        onPreviewMouseUp={() => undefined}
      />,
    )

    expect(screen.getByText('Compile failed')).toBeDefined()
  })
})

describe('OverlayViewer', () => {
  it('renders a dialog and calls close callback on backdrop click when open', () => {
    const onCloseOverlay = vi.fn()

    render(
      <OverlayViewer
        overlayOpen={true}
        safeSvg="<svg />"
        viewScale={1}
        viewOffset={{ x: 0, y: 0 }}
        isDragging={false}
        overlayStageRef={{ current: null }}
        onCloseOverlay={onCloseOverlay}
        onOverlayZoomOut={() => undefined}
        onOverlayZoomIn={() => undefined}
        onResetOverlayView={() => undefined}
        onFitOverlayView={() => undefined}
        onOverlayMouseDown={() => undefined}
        onOverlayMouseMove={() => undefined}
        onOverlayMouseUp={() => undefined}
      />,
    )

    fireEvent.click(screen.getByRole('dialog', { name: 'Backtrack viewer' }))

    expect(onCloseOverlay).toHaveBeenCalledTimes(1)
  })
})
