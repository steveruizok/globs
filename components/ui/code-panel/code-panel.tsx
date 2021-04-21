import { createState } from "@state-designer/core"
import { useStateDesigner } from "@state-designer/react"
import { motion } from "framer-motion"
import React, { useEffect, useRef } from "react"
import evalCode from "lib/code"
import CodeDocs from "./code-docs"
import CodeEditor from "./code-editor"
import state from "lib/state"
import { IMonaco, IMonacoEditor } from "types"

import {
  X,
  Code,
  Info,
  PlayCircle,
  ChevronUp,
  ChevronDown,
} from "react-feather"
import { styled } from "stitches.config"
import exampleCode from "./example-code"

const style = {
  fontSize: 14,
  isOpen: false,
}

let code = exampleCode

const saved = localStorage.getItem("__globs_code")
if (saved !== null) {
  try {
    const data = JSON.parse(saved)
    code = data.code
    Object.assign(style, data.style)
  } catch (e) {
    if (typeof saved === "string") {
      code = saved
    }
  }
}

const panelState = createState({
  data: {
    code: {
      clean: code,
      dirty: code,
    },
    style,
  },
  on: {
    UNMOUNTED: "saveData",
    CHANGED_CODE: { secretlyDo: ["setCode", "saveData"] },
  },
  initial: style.isOpen ? "expanded" : "collapsed",
  states: {
    collapsed: {
      onEnter: { secretlyDo: ["setIsCollapsed", "saveData"] },
      on: {
        TOGGLED_COLLAPSED: { to: "expanded" },
      },
    },
    expanded: {
      onEnter: { secretlyDo: ["setIsExpanded", "saveData"] },
      on: {
        TOGGLED_COLLAPSED: { to: "collapsed" },
      },
      initial: "editingCode",
      states: {
        editingCode: {
          on: {
            SAVED_CODE: ["setCode", "saveData", "saveDirtyToClean", "evalCode"],
            RAN_CODE: ["saveDirtyToClean", "evalCode"],
            TOGGLED_DOCS: { to: "viewingDocs" },
            INCREASED_FONT_SIZE: ["increaseFontSize", "saveData"],
            DECREASED_FONT_SIZE: ["decreaseFontSize", "saveData"],
          },
        },
        viewingDocs: {
          on: {
            TOGGLED_DOCS: { to: "editingCode" },
          },
        },
      },
    },
  },
  conditions: {},
  actions: {
    setIsExpanded(data) {
      data.style.isOpen = true
    },
    setIsCollapsed(data) {
      data.style.isOpen = false
    },
    setCode(data, payload: { code: string }) {
      data.code.dirty = payload.code
    },
    saveData(data) {
      localStorage.setItem(
        "__globs_code",
        JSON.stringify({
          code: data.code.dirty,
          style: data.style,
        })
      )
    },
    saveDirtyToClean(data) {
      data.code.clean = data.code.dirty
    },
    evalCode(data) {
      try {
        const { nodes, globs } = evalCode(data.code.clean)
        state.send("GENERATED_ITEMS", { nodes, globs })
      } catch (e) {
        console.error(e)
      }
    },
    increaseFontSize(data) {
      data.style.fontSize++
    },
    decreaseFontSize(data) {
      data.style.fontSize--
    },
  },
})

export default function LearnPanel() {
  const rContainer = useRef<HTMLDivElement>(null)
  const rEditor = useRef<IMonacoEditor>(null)
  const rMonaco = useRef<IMonaco>(null)
  const local = useStateDesigner(panelState)
  const isCollapsed = local.isIn("collapsed")

  useEffect(() => {
    panelState.send("MOUNTED")
    return () => {
      panelState.send("UNMOUNTED")
    }
  }, [])

  return (
    <PanelContainer
      data-bp-desktop
      ref={rContainer}
      dragMomentum={false}
      onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
        if ((e.key === "s" && e.metaKey) || e.ctrlKey) {
          panelState.send("RAN_CODE")
        }
      }}
      onKeyUp={(e: React.KeyboardEvent<HTMLDivElement>) => e.stopPropagation()}
      isCollapsed={isCollapsed}
    >
      {local.isIn("collapsed") ? (
        <IconButton onClick={() => panelState.send("TOGGLED_COLLAPSED")}>
          <Code />
        </IconButton>
      ) : (
        <Content>
          <Header>
            <IconButton onClick={() => panelState.send("TOGGLED_COLLAPSED")}>
              <X />
            </IconButton>
            <h3>Code</h3>
            <ButtonsGroup>
              <FontSizeButtons>
                <IconButton
                  disabled={!local.can("INCREASED_FONT_SIZE")}
                  onClick={() => panelState.send("INCREASED_FONT_SIZE")}
                >
                  <ChevronUp />
                </IconButton>
                <IconButton
                  disabled={!local.can("DECREASED_FONT_SIZE")}
                  onClick={() => panelState.send("DECREASED_FONT_SIZE")}
                >
                  <ChevronDown />
                </IconButton>
              </FontSizeButtons>
              <IconButton onClick={() => panelState.send("TOGGLED_DOCS")}>
                <Info size={18} />
              </IconButton>
              <IconButton
                disabled={!local.can("RAN_CODE")}
                onClick={() => panelState.send("RAN_CODE")}
              >
                <PlayCircle size={18} />
              </IconButton>
            </ButtonsGroup>
          </Header>
          <EditorContainer>
            <CodeEditor
              fontSize={local.data.style.fontSize}
              value={local.data.code.clean}
              onChange={(code) => panelState.send("CHANGED_CODE", { code })}
              onSave={(code) => panelState.send("SAVED_CODE", { code })}
            />
            <CodeDocs isHidden={!local.isIn("viewingDocs")} />
          </EditorContainer>
        </Content>
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
