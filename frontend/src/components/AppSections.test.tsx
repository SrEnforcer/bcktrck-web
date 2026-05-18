import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import {
  EditorPanel,
  OverlayViewer,
  PreviewPanel,
  WorkspaceTopbar,
} from './AppSections'
import {
  makeEditorPanelProps,
  makeOverlayViewerProps,
  makePreviewPanelErrorProps,
  makeWorkspaceTopbarProps,
} from '../tests/factories/appSectionsProps.factory'

vi.mock('./BcktrckEditor', () => ({
  BcktrckEditor: () => <div>Editor Stub</div>,
}))

describe('WorkspaceTopbar', () => {
  it('calls export callback when export button is clicked', () => {
    const onExportSource = vi.fn()

    render(
      <WorkspaceTopbar {...makeWorkspaceTopbarProps({ onExportSource })} />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Export .btl' }))

    expect(onExportSource).toHaveBeenCalledTimes(1)
  })
})

describe('EditorPanel', () => {
  it('renders source editor tab content when source tab is active', () => {
    render(
      <EditorPanel {...makeEditorPanelProps()} />,
    )

    expect(screen.getByText('Editor Stub')).toBeDefined()
  })
})

describe('PreviewPanel', () => {
  it('renders error state content when result is not ok', () => {
    render(
      <PreviewPanel {...makePreviewPanelErrorProps()} />,
    )

    expect(screen.getByText('Compile failed')).toBeDefined()
  })
})

describe('OverlayViewer', () => {
  it('renders a dialog and calls close callback on backdrop click when open', () => {
    const onCloseOverlay = vi.fn()

    render(
      <OverlayViewer {...makeOverlayViewerProps({ onCloseOverlay })} />,
    )

    fireEvent.click(screen.getByRole('dialog', { name: 'Backtrack viewer' }))

    expect(onCloseOverlay).toHaveBeenCalledTimes(1)
  })
})
