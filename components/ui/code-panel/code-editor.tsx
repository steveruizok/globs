import { useEffect, useRef } from "react"
import prettier from "prettier/standalone"
import parser from "prettier/parser-typescript"
import { styled } from "stitches.config"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ICopenhagenEditor = any
type ICopenhagen = { Editor: ICopenhagenEditor }
declare let Copenhagen: ICopenhagen

export default function CopenhagenEditor({
  value = "",
  language = "javascript",
  maximized = false,
  hidden = false,
  disabled = false,
  rows = 1,
  maxrows = 30,
  tabout = false,
  nolines = false,
  readOnly = false,
  fontSize = 14,
  error,
  onMount,
  onUnmount,
  onChange,
  onSave,
  onError,
  onFocus,
  onBlur,
  onContextMenu,
  onAutoComplete,
  onWaiting,
  onCursor,
  onSingleCursor,
  onMultiCursor,
  onMetaData,
}: {
  language?: "javascript" | "json" | "markdown" | "html" | "css" | "text"
  maximized?: boolean
  hidden?: boolean
  disabled?: boolean
  rows?: number
  maxrows?: number
  tabout?: boolean
  nolines?: boolean
  value?: string
  error?: { lineIndex: number; column: number }
  readOnly?: boolean
  fontSize?: number
  onMount?: (value: string, editor: ICopenhagenEditor) => void
  onUnmount?: (editor: ICopenhagenEditor) => void
  onChange?: (value: string, editor: ICopenhagenEditor) => void
  onSave?: (value: string, editor: ICopenhagenEditor) => void
  onError?: (error: Error, line: number, col: number) => void
  onFocus?: (value: string, editor: ICopenhagenEditor) => void
  onBlur?: (value: string, editor: ICopenhagenEditor) => void
  onContextMenu?: (value: string, editor: ICopenhagenEditor) => void
  onAutoComplete?: (value: string, editor: ICopenhagenEditor) => void
  onWaiting?: (value: string, editor: ICopenhagenEditor) => void
  onCursor?: (value: string, cursor: unknown, editor: ICopenhagenEditor) => void
  onSingleCursor?: (
    value: string,
    cursor: unknown,
    editor: ICopenhagenEditor
  ) => void
  onMultiCursor?: (
    value: string,
    cursors: unknown[],
    editor: ICopenhagenEditor
  ) => void
  onMetaData?: (value: string, key: string, editor: ICopenhagenEditor) => void
}) {
  const rCopenhagen = useRef<ICopenhagenEditor>(null)
  const rEditor = useRef<HTMLDivElement>(null)

  // Update the editor when value changes.
  // (Keep this above the mountEditor effect so that it does not run on first update.)
  useEffect(
    function updateValueFromProps() {
      if (!rCopenhagen.current) return

      const editor = rCopenhagen.current
      if (value !== editor.getValue()) {
        editor.setValue(value)
      }
    },
    [value]
  )

  // Create the editor, mount into the DOM, and set event listeners.
  useEffect(
    function mountEditor() {
      const elm = rEditor.current!

      // instantiated CPHEditor instance with config
      const editor = new Copenhagen.Editor({
        language,
        maximized,
        hidden,
        disabled,
        rows,
        maxrows,
        tabout,
        nolines,
      })

      // open, but do not auto-focus the editor
      editor.open(elm, false)

      // save editor to ref
      rCopenhagen.current = editor

      // Set initial value
      editor.setValue(value)

      if (onMount) onMount(value, editor)

      // Set events

      editor.on("change", (editor: ICopenhagenEditor, value: string) => {
        if (onChange) onChange(value, editor)
      })

      editor.on("save", (editor: ICopenhagenEditor, value: string) => {
        let formatted = value

        try {
          formatted = prettier.format(value, {
            parser: "typescript",
            plugins: [parser],
            proseWrap: "always",
            printWidth: 60,
            semi: false,
          })

          editor.setValue(formatted)
        } catch (e) {
          const regexp = new RegExp(/(^.*\()(.*):(.*)\)/)
          const [line, col] = e.stack.match(regexp).slice(2)
          editor.setError(Number(line - 1), Number(col - 1))
          onError && onError(e, line, col)
        }

        if (onSave) onSave(formatted, editor)
      })

      editor.on("focus", (editor: ICopenhagenEditor, value: string) => {
        if (onFocus) onFocus(value, editor)
      })

      editor.on("blur", (editor: ICopenhagenEditor, value: string) => {
        if (onBlur) onBlur(value, editor)
      })

      editor.on("contextmenu", (editor: ICopenhagenEditor, value: string) => {
        if (onContextMenu) onContextMenu(value, editor)
      })

      editor.on("autocomplete", (editor: ICopenhagenEditor, value: string) => {
        if (onAutoComplete) onAutoComplete(value, editor)
      })

      editor.on("waiting", (editor: ICopenhagenEditor, value: string) => {
        if (onWaiting) onWaiting(value, editor)
      })

      editor.on(
        "cursor",
        (editor: ICopenhagenEditor, value: string, cursor: unknown) => {
          if (onCursor) onCursor(value, cursor, editor)
        }
      )

      editor.on(
        "singlecursor",
        (editor: ICopenhagenEditor, value: string, cursor: unknown) => {
          if (onSingleCursor) onSingleCursor(value, cursor, editor)
        }
      )

      editor.on(
        "multicursor",
        (editor: ICopenhagenEditor, value: string, cursors: unknown[]) => {
          if (onMultiCursor) onMultiCursor(value, cursors, editor)
        }
      )

      editor.on(
        "metadata",
        (editor: ICopenhagenEditor, value: string, key: string) => {
          if (onMetaData) onMetaData(value, key, editor)
        }
      )

      return () => {
        // Any way to dispose the editor?
        if (onUnmount) onUnmount(rCopenhagen.current)

        // For now, clear out any previous editor
        elm.innerHTML = ""
      }
    },
    [language, maximized, hidden, disabled, rows, maxrows, tabout, nolines]
  )

  // When readonly changes, update the editor's readonly status (don't forget to render)
  useEffect(
    function updateReadOnly() {
      const editor = rCopenhagen.current!
      editor.setReadOnly(readOnly)
      editor.render(editor.getValue())
    },
    [readOnly]
  )

  // When error changes, update the editor's error status (don't forget to render)
  useEffect(
    function updateError() {
      const editor = rCopenhagen.current!
      if (error) {
        // Set an error.
        editor.setError(error?.lineIndex, error?.column)
        editor.render(editor.getValue())
      } else if (editor._errorPos.enabled) {
        // Clear an error if one exists.
        editor.setError(null)
      }
    },
    [error]
  )

  return <Container ref={rEditor} />
}

const Container = styled("div", {
  height: "100%",
  color: "$text",
  font: "$code",
})
