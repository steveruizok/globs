import React, { useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { useStateDesigner } from "@state-designer/react"
import evalCode from "lib/code"
import CodeDocs from "./code-docs"
import CodeEditor from "./code-editor"
import state, { useSelector } from "lib/state"
// import { IMonaco, IMonacoEditor } from "types"

import {
  X,
  Code,
  Info,
  PlayCircle,
  ChevronUp,
  ChevronDown,
} from "react-feather"
import { styled } from "stitches.config"
import { ICode } from "lib/types"

export default function LearnPanel() {
  // const rEditor = useRef<IMonacoEditor>(null)
  // const rMonaco = useRef<IMonaco>(null)
  const rContainer = useRef<HTMLDivElement>(null)

  const fileId = "0"
  const isReadOnly = useSelector((s) => s.data.readOnly)
  const file = useSelector((s) => s.data.code[fileId])
  const isOpen = useSelector((s) => s.data.codePanel.isOpen)
  const fontSize = useSelector((s) => s.data.codePanel.fontSize)

  const local = useStateDesigner({
    data: {
      code: file.code,
    },
    on: {
      MOUNTED: "setCode",
      CHANGED_FILE: "loadFile",
    },
    initial: "editingCode",
    states: {
      editingCode: {
        on: {
          RAN_CODE: "runCode",
          SAVED_CODE: ["runCode", "saveCode"],
          CHANGED_CODE: { secretlyDo: "setCode" },
          TOGGLED_DOCS: { to: "viewingDocs" },
        },
      },
      viewingDocs: {
        on: {
          TOGGLED_DOCS: { to: "editingCode" },
        },
      },
    },
    actions: {
      loadFile(data, payload: { file: ICode }) {
        data.code = payload.file.code
      },
      setCode(data, payload: { code: string }) {
        data.code = payload.code
      },
      runCode(data) {
        try {
          const { nodes, globs } = evalCode(data.code)
          state.send("GENERATED_ITEMS", { nodes, globs })
        } catch (e) {
          console.error(e)
        }
      },
      saveCode(data) {
        state.send("CHANGED_CODE", { fileId, code: data.code })
      },
    },
  })

  useEffect(() => {
    local.send("CHANGED_FILE", { file })
  }, [file])

  useEffect(() => {
    local.send("MOUNTED", { code: state.data.code[fileId].code })
    return () => {
      state.send("CHANGED_CODE", { fileId, code: local.data.code })
    }
  }, [])

  return (
    <PanelContainer
      data-bp-desktop
      ref={rContainer}
      dragMomentum={false}
      onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
        if ((e.key === "s" && e.metaKey) || e.ctrlKey) {
          local.send("SAVED_CODE")
        }
      }}
      onKeyUp={(e: React.KeyboardEvent<HTMLDivElement>) => e.stopPropagation()}
      isCollapsed={!isOpen}
    >
      {isOpen ? (
        <Content>
          <Header>
            <IconButton onClick={() => state.send("CLOSED_CODE_PANEL")}>
              <X />
            </IconButton>
            <h3>Code</h3>
            <ButtonsGroup>
              <FontSizeButtons>
                <IconButton
                  disabled={!local.isIn("editingCode")}
                  onClick={() => state.send("INCREASED_CODE_FONT_SIZE")}
                >
                  <ChevronUp />
                </IconButton>
                <IconButton
                  disabled={!local.isIn("editingCode")}
                  onClick={() => state.send("DECREASED_CODE_FONT_SIZE")}
                >
                  <ChevronDown />
                </IconButton>
              </FontSizeButtons>
              <IconButton onClick={() => local.send("TOGGLED_DOCS")}>
                <Info />
              </IconButton>
              <IconButton
                disabled={!local.isIn("editingCode")}
                onClick={() => local.send("SAVED_CODE")}
              >
                <PlayCircle />
              </IconButton>
            </ButtonsGroup>
          </Header>
          <EditorContainer>
            <CodeEditor
              fontSize={fontSize}
              readOnly={isReadOnly}
              value={file.code}
              onChange={(code) => local.send("CHANGED_CODE", { code })}
              onSave={() => local.send("SAVED_CODE")}
            />
            <CodeDocs isHidden={!local.isIn("viewingDocs")} />
          </EditorContainer>
        </Content>
      ) : (
        <IconButton onClick={() => state.send("OPENED_CODE_PANEL")}>
          <Code />
        </IconButton>
      )}
    </PanelContainer>
  )
}

const PanelContainer = styled(motion.div, {
  position: "absolute",
  top: "0",
  right: "0",
  backgroundColor: "$panel",
  borderRadius: "4px",
  overflow: "hidden",
  border: "1px solid $border",
  pointerEvents: "all",
  userSelect: "none",

  button: {
    border: "none",
  },

  variants: {
    isCollapsed: {
      true: {},
      false: {
        height: "100%",
      },
    },
  },
})

const IconButton = styled("button", {
  height: "40px",
  width: "40px",
  backgroundColor: "$panel",
  borderRadius: "4px",
  border: "1px solid $border",
  padding: "0",
  margin: "0",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  outline: "none",
  pointerEvents: "all",
  cursor: "pointer",

  "&:hover:not(:disabled)": {
    backgroundColor: "$panel",
  },

  "&:disabled": {
    opacity: "0.5",
  },

  svg: {
    height: "20px",
    width: "20px",
    strokeWidth: "2px",
    stroke: "$text",
  },
})

const Content = styled("div", {
  display: "grid",
  gridTemplateColumns: "1fr",
  gridTemplateRows: "auto 1fr",
  minWidth: "100%",
  width: 560,
  maxWidth: 560,
  overflow: "hidden",
  height: "100%",
  userSelect: "none",
  pointerEvents: "all",
})

const Header = styled("div", {
  pointerEvents: "all",
  display: "grid",
  gridTemplateColumns: "auto 1fr",
  alignItems: "center",
  justifyContent: "center",
  borderBottom: "1px solid $border",

  "& button": {
    gridColumn: "1",
    gridRow: "1",
  },

  "& h3": {
    gridColumn: "1 / span 3",
    gridRow: "1",
    textAlign: "center",
    margin: "0",
    padding: "0",
    fontSize: "16px",
  },
})

const ButtonsGroup = styled("div", {
  gridRow: "1",
  gridColumn: "3",
  display: "flex",
})

const EditorContainer = styled("div", {
  position: "relative",
  pointerEvents: "all",
  overflowY: "scroll",
})

const ErrorContainer = styled("div", {
  overflowX: "scroll",
})

const FontSizeButtons = styled("div", {
  paddingRight: 4,

  "& > button": {
    height: "50%",
    width: "100%",

    "&:nth-of-type(1)": {
      paddingTop: 4,
    },

    "&:nth-of-type(2)": {
      paddingBottom: 4,
    },

    "& svg": {
      height: 12,
    },
  },
})
