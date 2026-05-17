/**
 * @module components/bcktrck-editor
 *
 * Expose the Monaco-backed editor component used by source and style tabs,
 * including language registration and consistent editor options.
 *
 * @packageDocumentation
 */
import Editor from '@monaco-editor/react'
import type * as Monaco from 'monaco-editor'
import { fromNullable, getOrElse, pipe } from '@tsfpp/prelude'
import { bcktrckEditorTheme, bcktrckLanguageId, registerBcktrckLanguage } from '../lib/bcktrckLanguage'

type BcktrckEditorProps = {
  readonly initialValue: string
  readonly onChange: (value: string) => void
  readonly fontSize: number
  readonly editorInstanceKey: React.Key
  readonly resolvedTheme: 'light' | 'dark'
}

/**
 * Monaco-backed editor for bcktrck source and style text.
 * @param props Editor configuration and change callback.
 * @returns Configured Monaco editor container.
 */
export function BcktrckEditor({ initialValue, onChange, fontSize, editorInstanceKey, resolvedTheme }: BcktrckEditorProps): React.JSX.Element {
  const handleBeforeMount = (monaco: typeof Monaco) => {
    registerBcktrckLanguage(monaco)
  }

  return (
    <div className="editor" aria-label="bcktrck source">
      <Editor
        key={editorInstanceKey}
        language={bcktrckLanguageId}
        theme={bcktrckEditorTheme[resolvedTheme]}
        defaultValue={initialValue}
        onChange={(nextValue) => onChange(pipe(fromNullable(nextValue), getOrElse(() => '')))}
        beforeMount={handleBeforeMount}
        options={{
          minimap: { enabled: false },
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
          fontSize,
          lineHeight: fontSize * 1.5,
          tabSize: 2,
          insertSpaces: true,
          automaticLayout: true,
          allowVariableFonts: false,
          fontLigatures: false,
          scrollBeyondLastLine: false,
          wordWrap: 'off',
          renderWhitespace: 'selection',
          smoothScrolling: true,
          padding: { top: 14, bottom: 14 },
          bracketPairColorization: { enabled: false }
        }}
      />
    </div>
  )
}
