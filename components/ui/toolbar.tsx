import state, { useSelector } from "lib/state"
import {
  RotateCcw,
  RotateCw,
  Disc,
  ArrowRight,
  Copy,
  Sun,
  ArrowUp,
  X,
  Menu,
} from "react-feather"
import { styled } from "stitches.config"
import useTheme from "hooks/useTheme"

export default function Toolbar() {
  const canUndo = useSelector((s) => s.can("UNDO"))
  const canRedo = useSelector((s) => s.can("REDO"))
  const hasSelectedNodes = useSelector((s) => s.data.selectedNodes.length > 0)
  const hasSelectedGlobs = useSelector((s) => s.data.selectedGlobs.length > 0)
  const isLinking = useSelector((s) => s.isIn("linkingNodes"))
  const isCreating = useSelector((s) => s.isIn("creatingNodes"))

  const { toggle } = useTheme()

  return (
    <StyledContainer>
      <section>
        <button
          title="Menu"
          disabled={true}
          onClick={() => state.send("OPENED_MENU")}
          onDoubleClick={() => state.send("HARD_RESET")}
        >
          <Menu />
        </button>
        <button
          title="Undo"
          disabled={true} //!canUndo}
          onClick={() => state.send("UNDO")}
        >
          <RotateCcw />
        </button>
        <button
          title="Redo"
          disabled={true} //!canRedo}
          onClick={() => state.send("REDO")}
        >
          <RotateCw />
        </button>
        <button
          title="Hard Reset"
          onDoubleClick={() => state.send("HARD_RESET")}
        ></button>
      </section>
      <Spacer />

      <section>
        <button
          title="Create Node (N)"
          data-active={isCreating}
          onClick={() => {
            state.send("STARTED_CREATING_NODES")
          }}
        >
          <Disc />
        </button>
        {hasSelectedNodes && (
          <button
            title="Create Globs (L)"
            data-active={isLinking}
            onClick={() => state.send("STARTED_LINKING_NODES")}
          >
            <ArrowRight />
          </button>
        )}
        {(hasSelectedNodes || hasSelectedGlobs) && (
          <button
            title="Delete Selected Items (Backspace)"
            onClick={() => state.send("DELETED")}
          >
            <X />
          </button>
        )}
      </section>
      <Spacer />
      <section>
        <button disabled={true}>
          <Copy />
        </button>
        <button onClick={toggle}>
          <Sun />
        </button>
      </section>
    </StyledContainer>
  )
}

const StyledContainer = styled("div", {
  userSelect: "none",
  gridArea: "tool",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  backgroundColor: "$panel",
  borderBottom: "1px solid $border",

  "& svg": {
    height: "18px",
    width: "18px",
    stroke: "$text",
  },

  "& > section": {
    display: "flex",
  },

  "& section > button": {
    background: "none",
    border: "none",
    width: "40px",
    height: "40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    outline: "none",

    "@media (min-width: 768px)": {
      "&:hover:enabled": {
        "& > svg": {
          stroke: "$selected",
        },
      },
    },

    "&:disabled": {
      opacity: "0.3",
    },

    '&[data-active="true"]': {
      "& > svg": {
        stroke: "$selected",
      },
    },
  },
})

const Spacer = styled("div", {
  flexGrow: 2,
})
