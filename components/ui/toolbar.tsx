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
} from "react-feather"
import styled from "styled-components"

export default function Toolbar() {
  const canUndo = useSelector((s) => s.can("UNDO"))
  const canRedo = useSelector((s) => s.can("REDO"))
  const hasSelectedNodes = useSelector((s) => s.data.selectedNodes.length > 0)
  const hasSelectedGlobs = useSelector((s) => s.data.selectedGlobs.length > 0)
  const isLinking = useSelector((s) => s.isIn("linkingNodes"))
  const isCreating = useSelector((s) => s.isIn("creatingNodes"))

  return (
    <StyledContainer>
      <section>
        <button
          title="Undo"
          disabled={!canUndo}
          onClick={() => state.send("UNDO")}
        >
          <RotateCcw size={18} />
        </button>
        <button
          title="Redo"
          disabled={!canRedo}
          onClick={() => state.send("REDO")}
        >
          <RotateCw size={18} />
        </button>
      </section>
      <Spacer />

      <section>
        <button
          title="Create Node"
          data-active={isCreating}
          onClick={() => state.send("STARTED_CREATING_NODES")}
        >
          <Disc size={18} />
        </button>
        {hasSelectedNodes && (
          <button
            title="Link Nodes"
            data-active={isLinking}
            onClick={() => state.send("STARTED_LINKING_NODES")}
          >
            <ArrowRight />
          </button>
        )}
        {(hasSelectedNodes || hasSelectedGlobs) && (
          <button title="Delete" onClick={() => state.send("DELETED")}>
            <X />
          </button>
        )}
      </section>
      <Spacer />
      <section>
        <button>
          <Copy size={18} />
        </button>
        <button>
          <Sun />
        </button>
      </section>
    </StyledContainer>
  )
}

const StyledContainer = styled.div`
  user-select: none;
  grid-area: tool;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #ffffff;
  border-bottom: 1px solid rgba(0, 0, 0, 0.2);

  & > section {
    display: flex;
  }

  & section > button {
    background: none;
    border: none;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    outline: none;
    &:hover {
      background-color: rgba(0, 0, 0, 0.1);
    }

    &[data-active="true"] {
      background-color: rgba(0, 0, 0, 0.15);
    }
  }
`

const Spacer = styled.div`
  flex-grow: 2;
`
