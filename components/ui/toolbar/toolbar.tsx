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
  Circle,
  Share,
} from "react-feather"
import { styled } from "stitches.config"
import useTheme from "hooks/useTheme"
import ShareModel from "./share-modal"
import IconButton from "../icon-button"

export default function Toolbar() {
  const hasSelectedNodes = useSelector((s) => s.data.selectedNodes.length > 0)
  const hasSelectedGlobs = useSelector((s) => s.data.selectedGlobs.length > 0)
  const isGlobbing = useSelector((s) => s.isIn("globbingNodes"))
  const isCreating = useSelector((s) => s.isIn("creatingNodes"))

  const { toggle } = useTheme()

  return (
    <StyledContainer>
      <section>
        {/* <IconButton
          disabled={true}
          title="Menu"
          onClick={() => state.send("OPENED_MENU")}
        >
          <Menu />
        </IconButton> */}
        <IconButton title="Undo" onClick={() => state.send("UNDO")}>
          <RotateCcw />
        </IconButton>
        <IconButton title="Redo" onClick={() => state.send("REDO")}>
          <RotateCw />
        </IconButton>
      </section>
      <Spacer />

      <section>
        <IconButton
          title="Create Node (N)"
          data-active={isCreating}
          onClick={() => {
            state.send("STARTED_CREATING_NODES")
          }}
        >
          <Disc />
        </IconButton>
        <IconButton
          title="Create Globs (G)"
          disabled={!hasSelectedNodes}
          data-active={isGlobbing}
          onClick={() => state.send("STARTED_GLOBBING_NODES")}
        >
          <ArrowRight />
        </IconButton>
        <IconButton
          title="Delete Selected Items (Backspace)"
          disabled={!(hasSelectedNodes || hasSelectedGlobs)}
          onClick={() => state.send("DELETED")}
        >
          <X />
        </IconButton>
      </section>
      <Spacer />
      <section>
        <IconButton
          title="Toggle Fill"
          onClick={() => state.send("TOGGLED_FILL")}
        >
          <Circle className="fill-flat" />
        </IconButton>
        <IconButton
          title="Copy SVG to Clipboard"
          onClick={() => state.send("EXPORTED")}
        >
          <Copy />
        </IconButton>
        <ShareModel />
        <IconButton onClick={toggle}>
          <Sun />
        </IconButton>
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
})

const Spacer = styled("div", {
  flexGrow: 2,
})
