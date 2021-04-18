import * as React from "react"
import { EditorView } from "@codemirror/view"
import { Extension, Compartment } from "@codemirror/state"
import { LanguageSupport } from "@codemirror/language"
import { defaultTabBinding } from "@codemirror/commands"
import { oneDarkTheme, oneDarkHighlightStyle } from "@codemirror/theme-one-dark"
import * as codemirror from "./codemirror"

type Bundle = typeof codemirror

interface Theme {
  base: Extension
  highlight: Extension
}

interface Editor {
  view: EditorView
  codemirror: Bundle
  setTheme: (theme: Theme) => void
  loadExentions: (options: {
    filename: string
    theme: Theme
  }) => Promise<Extension>
}

export default function useCodemirror(): [
  null | Editor,
  (div: null | HTMLDivElement) => void
] {
  const [el, setEl] = React.useState<HTMLDivElement | null>(null)
  const [editor, setEditor] = React.useState<Editor | null>(null)

  const themeCompartment = new Compartment()
  const highlightCompartment = new Compartment()

  React.useEffect(() => {
    if (!el) {
      return
    }

    let didCancel = false

    let view: null | EditorView

    async function createEditor() {
      if (!el || didCancel) {
        return
      }

      view = new EditorView({
        parent: el,
      })

      setEditor({
        view,
        codemirror,
        setTheme: () => {
          null
        },
        loadExentions: (options: { filename: string; theme: Theme }) =>
          loadExentions({
            codemirror,
            filename: options.filename,
            theme: options.theme,
            themeCompartment,
            highlightCompartment,
          }),
      })
    }

    createEditor()

    return () => {
      didCancel = true

      if (view) {
        view.destroy()
        view = null
      }
    }
  }, [el])

  return [editor, setEl]
}

export function getTheme(): Theme {
  return {
    base: oneDarkTheme,
    highlight: oneDarkHighlightStyle,
  }
}

async function loadExentions({
  codemirror,
  filename,
  theme,
  themeCompartment,
  highlightCompartment,
}: {
  codemirror: Bundle
  filename: string
  theme: Theme
  themeCompartment: Compartment
  highlightCompartment: Compartment
}): Promise<Extension> {
  const languageDescription = filename
    ? codemirror.language.LanguageDescription.matchFilename(
        codemirror.languageData.languages,
        filename
      )
    : null

  let languageSupport: null | LanguageSupport = null

  if (languageDescription) {
    languageSupport = await languageDescription.load()
  }

  const extensions = [
    codemirror.gutter.lineNumbers(),
    // codemirror.view.highlightSpecialChars(),
    // codemirror.fold.foldGutter(),
    codemirror.history.history(),
    // codemirror.view.drawSelection(),
    codemirror.state.EditorState.allowMultipleSelections.of(true),
    codemirror.language.indentOnInput(),
    codemirror.matchbrackets.bracketMatching(),
    codemirror.closebrackets.closeBrackets(),
    codemirror.autocomplete.autocompletion(),
    codemirror.rectangularSelection.rectangularSelection(),
    codemirror.view.highlightActiveLine(),
    codemirror.search.highlightSelectionMatches(),
    ...(languageSupport ? [languageSupport] : []),
    themeCompartment.of(theme.base),
    highlightCompartment.of(theme.highlight),
    codemirror.view.keymap.of([
      ...codemirror.commands.defaultKeymap,
      // ...codemirror.closebrackets.closeBracketsKeymap,
      ...codemirror.search.searchKeymap,
      ...codemirror.history.historyKeymap,
      // ...codemirror.fold.foldKeymap,
      // ...codemirror.comment.commentKeymap,
      ...codemirror.autocomplete.completionKeymap,
      // ...codemirror.lint.lintKeymap,
      defaultTabBinding,
    ]),
  ]

  return extensions
}
