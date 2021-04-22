import Editor, { Monaco } from "@monaco-editor/react"
import useTheme from "hooks/useTheme"
import prettier from "prettier/standalone"
import parserTypeScript from "prettier/parser-typescript"
import codeAsString from "./code-as-string"
import React, { useCallback, useEffect, useRef } from "react"
import { styled } from "stitches.config"
import { IMonaco, IMonacoEditor } from "types"

interface Props {
  value: string
  fontSize: number
  monacoRef?: React.MutableRefObject<IMonaco>
  editorRef?: React.MutableRefObject<IMonacoEditor>
  readOnly?: boolean
  onMount?: (value: string, editor: IMonacoEditor) => void
  onUnmount?: (editor: IMonacoEditor) => void
  onChange?: (value: string, editor: IMonacoEditor) => void
  onSave?: (value: string, editor: IMonacoEditor) => void
  onError?: (error: Error, line: number, col: number) => void
}

export default function CodeEditor({
  editorRef,
  monacoRef,
  fontSize,
  value,
  readOnly,
  onChange,
  onSave,
}: Props) {
  const { theme } = useTheme()
  const rEditor = useRef<IMonacoEditor>(null)
  const rMonaco = useRef<IMonaco>(null)

  const handleBeforeMount = useCallback((monaco: Monaco) => {
    if (monacoRef) {
      monacoRef.current = monaco
    }
    rMonaco.current = monaco

    monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
      allowJs: true,
      checkJs: false,
      strict: false,
      noLib: true,
      lib: ["es6"],
      target: monaco.languages.typescript.ScriptTarget.ES2015,
      allowNonTsExtensions: true,
    })

    monaco.languages.typescript.typescriptDefaults.setEagerModelSync(true)

    monaco.languages.typescript.javascriptDefaults.setEagerModelSync(true)

    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: true,
    })

    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: true,
    })

    monaco.languages.typescript.javascriptDefaults.addExtraLib(codeAsString)

    monaco.languages.registerDocumentFormattingEditProvider("javascript", {
      async provideDocumentFormattingEdits(model, options, token) {
        const text = prettier.format(model.getValue(), {
          parser: "typescript",
          plugins: [parserTypeScript],
          singleQuote: true,
          trailingComma: "es5",
          semi: false,
        })

        return [
          {
            range: model.getFullModelRange(),
            text,
          },
        ]
      },
    })
  }, [])

  const handleMount = useCallback((editor: IMonacoEditor) => {
    if (editorRef) {
      editorRef.current = editor
    }
    rEditor.current = editor

    editor.updateOptions({
      fontSize,
      wordBasedSuggestions: false,
      minimap: { enabled: false },
      lightbulb: {
        enabled: false,
      },
      readOnly,
    })
  }, [])

  const handleChange = useCallback((value: string | undefined) => {
    onChange(value, rEditor.current)
  }, [])

  const handleKeydown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      e.stopPropagation()
      const metaKey = navigator.platform.match("Mac") ? e.metaKey : e.ctrlKey
      if (e.key === "s" && metaKey) {
        const editor = rEditor.current
        if (!editor) return
        editor.getAction("editor.action.formatDocument").run()
        onSave(editor.getModel().getValue(), editor)
        e.preventDefault()
      }
      if (e.key === "p" && metaKey) {
        e.preventDefault()
      }
      if (e.key === "d" && metaKey) {
        e.preventDefault()
      }
    },
    []
  )

  const handleKeyUp = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => e.stopPropagation(),
    []
  )

  useEffect(() => {
    const monaco = rMonaco.current
    if (!monaco) return
    monaco.editor.setTheme(theme === "dark" ? "vs-dark" : "light")
  }, [theme])

  useEffect(() => {
    const editor = rEditor.current

    if (!editor) return

    editor.updateOptions({
      fontSize,
    })
  }, [fontSize])

  return (
    <EditorContainer onKeyDown={handleKeydown} onKeyUp={handleKeyUp}>
      <Editor
        height="100%"
        language="javascript"
        value={value}
        theme={theme === "dark" ? "vs-dark" : "light"}
        beforeMount={handleBeforeMount}
        onMount={handleMount}
        onChange={handleChange}
      />
    </EditorContainer>
  )
}

const EditorContainer = styled("div", {
  height: "100%",
})
