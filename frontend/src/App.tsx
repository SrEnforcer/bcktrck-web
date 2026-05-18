/**
 * @module app
 *
 * Provide the root React workspace shell that coordinates source editing,
 * style-pack selection, compile preview, overlay viewing, and persistence hooks.
 *
 * @packageDocumentation
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { fromNullable, fromUnknownString, getOrElse, isErr, isNone, isOk, isRecord, isSome, mapO, pipe, tryCatch, tryCatchAsync } from '@tsfpp/prelude'
import { EditorPanel, OverlayViewer, PreviewPanel, WorkspaceTopbar } from './components/AppSections'
import { debugLog } from './logging/logger'
import { useCompiledSvg } from './hooks/useCompiledSvg'
import { useLocalStoragePersistence } from './hooks/useLocalStoragePersistence'
import { useOverlayViewport } from './hooks/useOverlayViewport'
import { usePrintPageStyle } from './hooks/usePrintPageStyle'
import { usePreviewViewport } from './hooks/usePreviewViewport'
import { useSubtreeIsolation } from './hooks/useSubtreeIsolation'
import { useThemeEffects } from './hooks/useThemeEffects'
import { buildBackupFileDataUri, isSaveShortcut } from './lib/editorPersistence'
import { toSvgDataUri } from './lib/svgDataUri'
import './App.css'

const initialScript = `org "Backtrack Labs"
  Maya Singh @maya [title: CEO]
    Ravi Patel @ravi [title: CTO]
      ~staff Iris Cole @iris [side: left] [title: Executive Assistant]
      Lea Martin @lea [title: Platform Lead]
        Omar Khan @omar [title: Staff Engineer]
        June Park @june [title: Senior Engineer]
      Ken Wu @ken [title: Security Lead]
    Nora Diaz @nora [title: COO]
      Priya Shah @priya [title: Operations Manager]
      Lucas Reed @lucas [title: Finance Manager]
    ~dept People Operations @people_ops [head: @elena]
      Elena Rossi @elena [title: Chief People Officer]
        Tom Blake @tom [title: Talent Lead]
        Sara Lim @sara [title: People Ops Lead]
        Sam Reed @sam [title: HR Business Partner]
links
  @nora --> @lea [label: mentoring]
  @elena --> @priya [label: coordination]
  @ken --> @lucas [label: controls]
`

const sourceStorageKey = 'bcktrck:source'
const editorPanelWidthStorageKey = 'bcktrck:editor-panel-width'
const editorFontSizeStorageKey = 'bcktrck:editor-font-size'
const printPageFormatStorageKey = 'bcktrck:print-page-format'
const themeStorageKey = 'bcktrck:theme-preference'
const stylePackStorageKey = 'bcktrck:style-pack'
const sessionSourceStorageKey = 'bcktrck:source:session'
const backupFileName = 'bcktrck-backup.btl'

type PrintPageFormat = 'a4-portrait' | 'a4-landscape' | 'a3-portrait' | 'a3-landscape' | 'letter-portrait' | 'letter-landscape'
type ThemePreference = 'system' | 'light' | 'dark'
type StylePackChoice = 'inherit' | 'corporate' | 'elegant' | 'simple' | 'classic' | 'contrast' | 'minimal' | 'colorful'
type LeftPanelTab = 'source' | 'style' | 'tree'

type StylePackParts = {
  readonly defsText: string
  readonly styleBodyText: string
}

const defaultPrintPageFormat: PrintPageFormat = 'a4-landscape'
const printPageMargin = '8mm'
const themeOptions: readonly { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' }
]

const stylePackOptions: readonly { value: StylePackChoice; label: string }[] = [
  { value: 'inherit', label: 'From source' },
  { value: 'corporate', label: 'Corporate' },
  { value: 'elegant', label: 'Elegant' },
  { value: 'simple', label: 'Simple' },
  { value: 'classic', label: 'Classic' },
  { value: 'contrast', label: 'Contrast' },
  { value: 'minimal', label: 'Minimal' },
  { value: 'colorful', label: 'Colorful' }
]

const printPageFormats: readonly { value: PrintPageFormat; label: string; pageSize: string }[] = [
  { value: 'a4-portrait', label: 'A4 Portrait', pageSize: 'A4 portrait' },
  { value: 'a4-landscape', label: 'A4 Landscape', pageSize: 'A4 landscape' },
  { value: 'a3-portrait', label: 'A3 Portrait', pageSize: 'A3 portrait' },
  { value: 'a3-landscape', label: 'A3 Landscape', pageSize: 'A3 landscape' },
  { value: 'letter-portrait', label: 'Letter Portrait', pageSize: 'letter portrait' },
  { value: 'letter-landscape', label: 'Letter Landscape', pageSize: 'letter landscape' }
]

const isPrintPageFormat = (value: string): value is PrintPageFormat =>
  printPageFormats.some((format) => format.value === value)

const isThemePreference = (value: string): value is ThemePreference =>
  themeOptions.some((option) => option.value === value)

const isStylePackChoice = (value: string): value is StylePackChoice =>
  stylePackOptions.some((option) => option.value === value)

const toPrintPageFormat = (value: unknown): PrintPageFormat | undefined => {
  const parsed = fromUnknownString(value)
  return isSome(parsed) && isPrintPageFormat(parsed.value) ? parsed.value : undefined
}

const toThemePreference = (value: unknown): ThemePreference | undefined => {
  const parsed = fromUnknownString(value)
  return isSome(parsed) && isThemePreference(parsed.value) ? parsed.value : undefined
}

const toStylePackChoice = (value: unknown): StylePackChoice | undefined => {
  const parsed = fromUnknownString(value)
  return isSome(parsed) && isStylePackChoice(parsed.value) ? parsed.value : undefined
}

const resolvePrintPageSize = (format: PrintPageFormat): string =>
  pipe(
    fromNullable(printPageFormats.find((entry) => entry.value === format)),
    mapO((entry) => entry.pageSize),
    getOrElse(() => 'A4 landscape')
  )

const readLocalStorageItem = (key: string): string | null => {
  if (typeof window === 'undefined') return null

  const readResult = tryCatch(
    () => window.localStorage.getItem(key),
    () => null,
  )

  return isErr(readResult) ? null : readResult.value
}

const writeLocalStorageItem = (key: string, value: string, message: string): void => {
  if (typeof window === 'undefined') return

  const writeResult = tryCatch(
    () => {
      window.localStorage.setItem(key, value)
      return value
    },
    (cause) => cause,
  )

  if (isErr(writeResult)) {
    debugLog('storage', message, writeResult.error)
  }
}

const removeLocalStorageItem = (key: string): void => {
  if (typeof window === 'undefined') return

  const removeResult = tryCatch(
    () => {
      window.localStorage.removeItem(key)
      return key
    },
    () => key,
  )

  if (isErr(removeResult)) {
    // intentionally ignored for reset fallback behavior
  }
}

const writeSessionStorageItem = (key: string, value: string): void => {
  if (typeof window === 'undefined') return

  const writeResult = tryCatch(
    () => {
      window.sessionStorage.setItem(key, value)
      return value
    },
    (cause) => cause,
  )

  if (isErr(writeResult)) {
    debugLog('storage', 'explicit session save failed', writeResult.error)
  }
}

const readStoredNumber = (key: string, fallback: number): number => {
  const raw = pipe(
    fromNullable(readLocalStorageItem(key)),
    getOrElse(() => String(fallback))
  )
  const parsed = Number(raw)
  return Number.isFinite(parsed) ? parsed : fallback
}

const trimEdgeEmptyLines = (value: string): string => value.replace(/^\s*\n+/, '').replace(/\n+\s*$/, '')

const splitStylePack = (packText: string): StylePackParts => {
  const lines = packText.split(/\r?\n/)
  const styleHeaderIndex = lines.findIndex((line) => line.trim().toLowerCase() === 'style')
  if (styleHeaderIndex < 0) {
    return { defsText: trimEdgeEmptyLines(packText), styleBodyText: '' }
  }
  const defsText = trimEdgeEmptyLines(lines.slice(0, styleHeaderIndex).join('\n'))
  const styleBodyText = trimEdgeEmptyLines(lines.slice(styleHeaderIndex + 1).join('\n'))
  return { defsText, styleBodyText }
}

const composeStyleSource = (parts: StylePackParts, styleBodyText: string): string | undefined => {
  const defsText = trimEdgeEmptyLines(parts.defsText)
  const bodyText = trimEdgeEmptyLines(styleBodyText)
  const blocks = [
    ...(defsText.length > 0 ? [defsText] : []),
    ...(bodyText.length > 0 ? [`style\n${bodyText}`] : []),
  ]
  return blocks.length > 0 ? blocks.join('\n\n') : undefined
}

function App(): React.JSX.Element {
  // DEVIATION(11.2): Root container remains intentionally large while ongoing extraction to feature modules is completed.
  // DEVIATION(11.1): App orchestrates cross-panel state, viewport coordination, and persistence boundaries in one composition point.
  const [source, setSource] = useState(() => {
    const persistedSource = readLocalStorageItem(sourceStorageKey)
    return pipe(
      fromNullable(persistedSource),
      getOrElse(() => initialScript)
    )
  })
  const [leftPanelTab, setLeftPanelTab] = useState<LeftPanelTab>('source')
  const [stylePackChoice, setStylePackChoice] = useState<StylePackChoice>(() => {
    const stored = readLocalStorageItem(stylePackStorageKey)
    const parsed = toStylePackChoice(stored)
    return pipe(
      fromNullable(parsed),
      getOrElse((): StylePackChoice => 'inherit')
    )
  })
  const [styleEditorTextByChoice, setStyleEditorTextByChoice] = useState<Readonly<Partial<Record<StylePackChoice, string>>>>({})
  const [stylePackCache, setStylePackCache] = useState<Readonly<Record<string, string>>>({})

  useEffect(() => {
    if (stylePackChoice === 'inherit') {
      return
    }

    if (isSome(fromNullable(stylePackCache[stylePackChoice]))) {
      return
    }

    void (async (): Promise<void> => {
      const responseResult = await tryCatchAsync(
        () => fetch('/api/style-pack', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ choice: stylePackChoice })
        }),
        (cause) => cause,
      )
      if (!isOk(responseResult) || !responseResult.value.ok) {
        return
      }

      const payloadResult = await tryCatchAsync(
        () => responseResult.value.json(),
        (cause) => cause,
      )
      if (!isOk(payloadResult) || !isRecord(payloadResult.value)) {
        return
      }

      const candidate = 'packText' in payloadResult.value ? payloadResult.value.packText : undefined
      if (typeof candidate !== 'string') {
        return
      }

      setStylePackCache((previous) => ({ ...previous, [stylePackChoice]: candidate }))
    })()
  }, [stylePackChoice, stylePackCache])

  const selectedStylePackText = useMemo(
    () => (stylePackChoice === 'inherit' ? undefined : stylePackCache[stylePackChoice]),
    [stylePackChoice, stylePackCache]
  )
  const selectedStylePackParts = useMemo(
    () => splitStylePack(pipe(fromNullable(selectedStylePackText), getOrElse(() => ''))),
    [selectedStylePackText]
  )
  const styleEditorText = useMemo(
    () => {
      if (stylePackChoice === 'inherit') {
        return ''
      }

      const edited = styleEditorTextByChoice[stylePackChoice]
      return pipe(
        fromNullable(edited),
        getOrElse(() => selectedStylePackParts.styleBodyText)
      )
    },
    [stylePackChoice, styleEditorTextByChoice, selectedStylePackParts]
  )
  const styleEditorInstanceKey = useMemo(
    // NOTE(unknown, 2026-05-17): Monaco uses defaultValue only on mount, so this key intentionally forces remount on source changes.
    () => `${stylePackChoice}:${pipe(fromNullable(selectedStylePackText), getOrElse(() => ''))}`,
    [stylePackChoice, selectedStylePackText]
  )
  const styleSource = useMemo(
    () => (stylePackChoice === 'inherit' ? undefined : composeStyleSource(selectedStylePackParts, styleEditorText)),
    [stylePackChoice, selectedStylePackParts, styleEditorText]
  )
  const ignoreSourceStyle = stylePackChoice !== 'inherit'

  const {
    setSelectedSubtreeIds,
    subtreeIsolationMode,
    setSubtreeIsolationMode,
    subtreeEntries,
    normalizedSelectedSubtreeIds,
    forestSelectionIds,
    effectiveSubtreeId,
    effectiveSubtreeIds
  } = useSubtreeIsolation({ source, styleSource, ignoreSourceStyle })

  const { result, errorText, safeSvg, printSafeSvg } = useCompiledSvg({
    source,
    effectiveSubtreeId,
    effectiveSubtreeIds,
    styleSource,
    ignoreSourceStyle
  })
  const [editorPanelWidth, setEditorPanelWidth] = useState(() => readStoredNumber(editorPanelWidthStorageKey, 42))
  const [editorFontSize, setEditorFontSize] = useState(() => readStoredNumber(editorFontSizeStorageKey, 14))
  const [printPageFormat, setPrintPageFormat] = useState<PrintPageFormat>(() => {
    const stored = readLocalStorageItem(printPageFormatStorageKey)
    const parsed = toPrintPageFormat(stored)
    return pipe(
      fromNullable(parsed),
      getOrElse(() => defaultPrintPageFormat)
    )
  })
  const [themePreference, setThemePreference] = useState<ThemePreference>(() => {
    const stored = readLocalStorageItem(themeStorageKey)
    const parsed = toThemePreference(stored)
    return pipe(
      fromNullable(parsed),
      getOrElse((): ThemePreference => 'system')
    )
  })
  const { resolvedTheme } = useThemeEffects({ themePreference })
  const [undoStack, setUndoStack] = useState<ReadonlyArray<string>>([])
  const [editorInstanceKey, setEditorInstanceKey] = useState(0)
  const [savePulseToken, setSavePulseToken] = useState(0)
  const [isResizingPane, setIsResizingPane] = useState(false)
  const workspaceRef = useRef<HTMLElement>(null)
  const currentPrintFormat = useMemo(
    () => pipe(
      fromNullable(printPageFormats.find((format) => format.value === printPageFormat)),
      getOrElse(() => printPageFormats[0])
    ),
    [printPageFormat]
  )
  const effectiveSubtreeIdForLogs = useMemo(
    () => pipe(fromNullable(effectiveSubtreeId), getOrElse(() => 'root')),
    [effectiveSubtreeId]
  )
  const sourceLineCount = useMemo(() => source.split(/\r?\n/).length, [source])
  const renderStatus = savePulseToken > 0
    ? 'Saved!'
    : result.ok
      ? 'Render OK'
      : isSome(fromNullable(result.parseError))
        ? 'Parser issue'
        : 'Resolve issues'

  const handleExplicitSaveToSession = useCallback(() => {
    writeSessionStorageItem(sessionSourceStorageKey, source)
    setSavePulseToken((token) => token + 1)
  }, [source])

  const handleExportSource = useCallback(() => {
    if (typeof document === 'undefined') return
    const anchor = document.createElement('a')
    anchor.download = backupFileName
    anchor.href = buildBackupFileDataUri(source)
    anchor.style.display = 'none'
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
  }, [source])

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return
    e.preventDefault()
    const workspaceOption = fromNullable(workspaceRef.current)
    if (isNone(workspaceOption)) return
    const workspace = workspaceOption.value
    setIsResizingPane(true)
    const onMove = (moveEvent: MouseEvent) => {
      const rect = workspace.getBoundingClientRect()
      const newPct = ((moveEvent.clientX - rect.left) / rect.width) * 100
      setEditorPanelWidth(Math.min(70, Math.max(20, newPct)))
    }
    const onUp = () => {
      setIsResizingPane(false)
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [])

  const handleResizeKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      setEditorPanelWidth((prev) => Math.max(20, prev - 2))
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      setEditorPanelWidth((prev) => Math.min(70, prev + 2))
    }
  }, [])

  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return
    const [previousSource, ...rest] = undoStack
    setSource(previousSource)
    setUndoStack(rest)
    writeLocalStorageItem(sourceStorageKey, previousSource, 'persist source failed')
  }, [undoStack])

  const handleStylePackChange = useCallback((nextValue: string) => {
    if (isStylePackChoice(nextValue)) {
      setStylePackChoice(nextValue)
    }
  }, [])

  const handleStyleEditorChange = useCallback((nextStyleText: string) => {
    if (stylePackChoice === 'inherit') {
      return
    }

    setStyleEditorTextByChoice((previous) => ({
      ...previous,
      [stylePackChoice]: nextStyleText
    }))
  }, [stylePackChoice])

  const handleThemePreferenceChange = useCallback((nextValue: string) => {
    if (isThemePreference(nextValue)) {
      setThemePreference(nextValue)
    }
  }, [])

  const handleResetSample = useCallback(() => {
    setUndoStack([source])
    setSource(initialScript)
    // Remount Monaco so the uncontrolled model picks up reset content.
    setEditorInstanceKey((key) => key + 1)
    removeLocalStorageItem(sourceStorageKey)
  }, [source])

  const handleSubtreeModeChange = useCallback((nextMode: 'context' | 'forest') => {
    setSubtreeIsolationMode(nextMode)
  }, [setSubtreeIsolationMode])

  const handleToggleSelectedSubtree = useCallback((subtreeId: string, isChecked: boolean) => {
    setSelectedSubtreeIds((previous) =>
      isChecked
        ? [...previous, subtreeId]
        : previous.filter((id) => id !== subtreeId)
    )
  }, [setSelectedSubtreeIds])

  const handleClearSelectedSubtrees = useCallback(() => {
    setSelectedSubtreeIds([])
  }, [setSelectedSubtreeIds])

  const handlePrintPageFormatChange = useCallback((nextValue: string) => {
    if (isPrintPageFormat(nextValue)) {
      setPrintPageFormat(nextValue)
    }
  }, [])

  useEffect(() => {
    if (savePulseToken === 0 || typeof window === 'undefined') {
      return
    }

    const timerId = window.setTimeout(() => {
      setSavePulseToken(0)
    }, 1200)

    return () => {
      window.clearTimeout(timerId)
    }
  }, [savePulseToken])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isSaveShortcut(event)) {
        return
      }

      event.preventDefault()
      handleExplicitSaveToSession()
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleExplicitSaveToSession])

  // Re-center the preview whenever the focused subtree changes.
  const selectionSignature = useMemo(
    () => `${subtreeIsolationMode}|${effectiveSubtreeIdForLogs}|${normalizedSelectedSubtreeIds.join('|')}`,
    [subtreeIsolationMode, effectiveSubtreeIdForLogs, normalizedSelectedSubtreeIds]
  )

  const viewBox = useMemo(
    () => (result.ok ? { width: result.viewBox.width, height: result.viewBox.height } : null),
    [result]
  )

  const {
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
  } = usePreviewViewport({
    viewBox,
    selectionSignature
  })

  const {
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
  } = useOverlayViewport({ viewBox })

  useLocalStoragePersistence({
    sourceStorageKey,
    source,
    editorPanelWidthStorageKey,
    editorPanelWidth,
    editorFontSizeStorageKey,
    editorFontSize,
    printPageFormatStorageKey,
    printPageFormat,
    themeStorageKey,
    themePreference,
    stylePackStorageKey,
    stylePackChoice
  })

  usePrintPageStyle({
    pageSize: resolvePrintPageSize(printPageFormat),
    margin: printPageMargin
  })

  useEffect(() => {
    if (result.ok) {
      debugLog('compile', 'compile success', {
        sourceLineCount,
        subtreeMode: subtreeIsolationMode,
        selectedSubtreeIds: normalizedSelectedSubtreeIds,
        subtreeId: effectiveSubtreeIdForLogs,
        width: result.viewBox.width,
        height: result.viewBox.height
      })
      return
    }

    debugLog('compile', 'compile error', {
      sourceLineCount,
      subtreeMode: subtreeIsolationMode,
      selectedSubtreeIds: normalizedSelectedSubtreeIds,
      subtreeId: effectiveSubtreeIdForLogs,
      parseError: result.parseError,
      resolveErrors: result.resolveErrors
    })
  }, [result, sourceLineCount, subtreeIsolationMode, normalizedSelectedSubtreeIds, effectiveSubtreeIdForLogs])

  const printChart = useCallback(() => {
    if (!result.ok || typeof window === 'undefined') return
    window.print()
  }, [result])

  return (
    <main className="app-shell">
      <WorkspaceTopbar
        renderStatus={renderStatus}
        isRenderOk={result.ok}
        sourceLineCount={sourceLineCount}
        editorFontSize={editorFontSize}
        currentPrintFormatLabel={currentPrintFormat.label}
        stylePackChoice={stylePackChoice}
        themePreference={themePreference}
        stylePackOptions={stylePackOptions}
        themeOptions={themeOptions}
        undoStack={undoStack}
        onStylePackChange={handleStylePackChange}
        onThemePreferenceChange={handleThemePreferenceChange}
        onExportSource={handleExportSource}
        onUndo={handleUndo}
        onResetSample={handleResetSample}
      />

      <section
        className="workspace"
        ref={workspaceRef}
        style={{ userSelect: isResizingPane ? 'none' : undefined }}
      >
        <EditorPanel
          leftPanelTab={leftPanelTab}
          editorPanelWidth={editorPanelWidth}
          editorFontSize={editorFontSize}
          source={source}
          editorInstanceKey={editorInstanceKey}
          resolvedTheme={resolvedTheme}
          subtreeEntries={subtreeEntries}
          subtreeIsolationMode={subtreeIsolationMode}
          normalizedSelectedSubtreeIds={normalizedSelectedSubtreeIds}
          forestSelectionIds={forestSelectionIds}
          onLeftPanelTabChange={setLeftPanelTab}
          onEditorFontSizeChange={setEditorFontSize}
          onSourceChange={setSource}
          onStyleEditorChange={handleStyleEditorChange}
          onSubtreeIsolationModeChange={handleSubtreeModeChange}
          onClearSelectedSubtrees={handleClearSelectedSubtrees}
          onToggleSelectedSubtree={handleToggleSelectedSubtree}
          styleEditorText={styleEditorText}
          styleEditorInstanceKey={styleEditorInstanceKey}
        />

        <div
          className={`resize-handle${isResizingPane ? ' dragging' : ''}`}
          onMouseDown={handleResizeStart}
          onKeyDown={handleResizeKeyDown}
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize width"
          tabIndex={0}
        />

        <PreviewPanel
          isResultOk={result.ok}
          errorText={errorText}
          safeSvg={safeSvg}
          isPreviewDragging={isPreviewDragging}
          previewMode={previewMode}
          isCtrlHeld={isCtrlHeld}
          previewScale={previewScale}
          previewOffset={previewOffset}
          rectSelect={rectSelect}
          printPageFormat={printPageFormat}
          printPageFormats={printPageFormats}
          previewStageRef={previewStageRef}
          onPreviewModePan={handlePreviewModePan}
          onPreviewModeToggleSelect={handlePreviewModeToggleSelect}
          onPreviewZoomOut={previewZoomOut}
          onPreviewZoomIn={previewZoomIn}
          onResetPreviewView={resetPreviewView}
          onFitPreviewView={fitPreviewView}
          onPrintPageFormatChange={handlePrintPageFormatChange}
          onPrintChart={printChart}
          onOpenOverlay={openOverlay}
          onPreviewMouseDown={handlePreviewMouseDown}
          onPreviewMouseMove={handlePreviewMouseMove}
          onPreviewMouseUp={handlePreviewMouseUp}
        />
      </section>

      <footer className="statusbar">
        <span>{result.ok ? 'Render OK' : 'Render failed'}</span>
        <span>{resolvedTheme} theme · {currentPrintFormat.label} · {sourceLineCount} lines</span>
      </footer>

      {result.ok && (
        <section className="print-sheet" aria-hidden="true">
          <div className="print-sheet-inner">
            <img className="print-sheet-image" src={toSvgDataUri(printSafeSvg)} alt="" draggable={false} />
          </div>
        </section>
      )}

      <OverlayViewer
        overlayOpen={overlayOpen}
        safeSvg={safeSvg}
        viewScale={viewScale}
        viewOffset={viewOffset}
        isDragging={isDragging}
        overlayStageRef={overlayStageRef}
        onCloseOverlay={closeOverlay}
        onOverlayZoomOut={zoomOut}
        onOverlayZoomIn={zoomIn}
        onResetOverlayView={resetView}
        onFitOverlayView={fitOverlayView}
        onOverlayMouseDown={handleMouseDown}
        onOverlayMouseMove={handleMouseMove}
        onOverlayMouseUp={handleMouseUp}
      />
    </main>
  )
}

/**
 * Root web editor application.
 * @returns The full editor shell UI.
 */
export default App
