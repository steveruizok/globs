import { createState } from "@state-designer/core"
import { useStateDesigner } from "@state-designer/react"
import { motion } from "framer-motion"
import { useEffect, useRef } from "react"
import evalCode from "lib/code"
import CodeDocs from "./code-docs"
import CodeEditor from "./code-editor"
import state from "lib/state"

import { X, Code, Info, PlayCircle } from "react-feather"
import { styled } from "stitches.config"

let code = `// Basic nodes and globs

const nodeA = new Node({
  x: -100,
  y: 0,
});

const nodeB = new Node({
  x: 100,
  y: 0,
});

const glob = new Glob({
  start: nodeA,
  end: nodeB,
  D: { x: 0, y: 60 },
  Dp: { x: 0, y: 90 },
});

// Something more interesting...

const PI2 = Math.PI * 2,
  center = { x: 0, y: 0 },
  radius = 400;

let prev;

for (let i = 0; i < 21; i++) {
  const t = i * (PI2 / 20);

  const node = new Node({
    x: center.x + radius * Math.sin(t),
    y: center.y + radius * Math.cos(t),
  });

  if (prev !== undefined) {
    new Glob({
      start: prev,
      end: node,
      D: center,
      Dp: center,
    });
  }

  prev = node;
}
`

const saved = localStorage.getItem("__globs_code")
if (saved !== null) code = saved

const panelState = createState({
  data: {
    code: {
      clean: code,
      dirty: code,
    },
  },
  on: {
    UNMOUNTED: "saveCode",
    CHANGED_CODE: { secretlyDo: "setCode" },
  },
  initial: "expanded",
  states: {
    collapsed: {
      on: {
        TOGGLED_COLLAPSED: { to: "expanded" },
      },
    },
    expanded: {
      on: {
        TOGGLED_COLLAPSED: { to: "collapsed" },
      },
      initial: "code",
      states: {
        code: {
          on: {
            SAVED_CODE: ["setCode", "saveDirtyToClean", "evalCode"],
            RAN_CODE: ["saveDirtyToClean", "evalCode"],
            TOGGLED_DOCS: { to: "docs" },
          },
        },
        docs: {
          on: {
            TOGGLED_DOCS: { to: "code" },
          },
        },
      },
    },
  },
  conditions: {},
  actions: {
    setCode(data, payload: { code: string }) {
      data.code.dirty = payload.code
      localStorage.setItem("__globs_code", data.code.dirty)
    },
    saveCode(data) {
      localStorage.setItem("__globs_code", data.code.dirty)
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
  },
})

export default function LearnPanel() {
  const rContainer = useRef<HTMLDivElement>(null)
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
      ref={rContainer}
      dragMomentum={false}
      onKeyDown={(e) => {
        if ((e.key === "s" && e.metaKey) || e.ctrlKey) {
          panelState.send("RAN_CODE")
          e.preventDefault()
        }
        e.stopPropagation()
      }}
      onKeyUp={(e) => e.stopPropagation()}
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
              maximized
              value={local.data.code.clean}
              onChange={(code) => panelState.send("CHANGED_CODE", { code })}
              onSave={(code) => panelState.send("SAVED_CODE", { code })}
            />
            <CodeDocs isHidden={!local.isIn("docs")} />
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
