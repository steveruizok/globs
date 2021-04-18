import useCodemirror, { getTheme } from "./useCodemirror"
import { EditorState } from "@codemirror/state"
import { useEffect, useRef } from "react"
import { styled } from "stitches.config"
import prettier from "prettier/standalone"

const PARSER = "javascript"

interface Props {
  code: string
  onChange: (code: string) => void
}

export default function Editor({ code, onChange }: Props) {
  const [editor, editorRef] = useCodemirror()

  const stateRef = useRef<EditorState>(null)
  const rPrevState = useRef<any>(null)

  useEffect(() => {
    if (!editor) return
    editor.setTheme(getTheme())
  }, [editor])

  useEffect(() => {
    if (!editor) return

    const state = stateRef.current

    const theme = getTheme()

    if (state) {
      editor.view.setState(state)
      return
    }

    let didCancel = false

    editor.loadExentions({ filename: "globs.js", theme }).then((extensions) => {
      if (didCancel) return

      const { codemirror } = editor

      // Keep our state in sync with the editor's state. This listener is called
      // after view.setState and on any future updates
      const updateListener = codemirror.view.EditorView.updateListener.of(
        (update) => {
          onChange(update.state.toJSON().doc)
          stateRef.current = update.state
        }
      )

      rPrevState.current = {
        doc: code,
        extensions: [extensions, updateListener],
      }

      const state = codemirror.state.EditorState.create(rPrevState.current)

      editor.view.setState(state)
    })

    return () => {
      didCancel = true
    }
  }, [editor])

  return <EditorContainer ref={editorRef} className="codemirror-container" />
}

const EditorContainer = styled("div", {
  overflow: "hidden",
  "& .cm-wrap": {
    outline: "none",
  },
  "& .cm-scroller": { overflowX: "scroll", overflowY: "scroll", font: "$code" },
})
