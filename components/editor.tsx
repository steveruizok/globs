import React, { useCallback, useEffect, useRef } from "react"
import styled from "styled-components"
import state from "lib/state"
import usePinchZoom from "hooks/usePinchZoom"

import ContextMenu, {
  ContextMenuRoot,
  ContextMenuTrigger,
} from "./ui/context-menu"

import Globs from "./canvas/globs"
import Nodes from "./canvas/nodes"
import HoveredGlobs from "./canvas/hovered-globs"
import HoveredNodes from "./canvas/hovered-nodes"
import InspectPanel from "components/ui/inspect-panel"
import ContentPanel from "components/ui/content-panel"
import Toolbar from "components/ui/toolbar"
import StatusBar from "components/ui/statusbar"
import Brush from "components/canvas/brush"

export default function Editor() {
  const rContainer = useRef<HTMLDivElement>(null)
  const rSvg = useRef<SVGSVGElement>(null)

  // When we zoom or pan, manually update the svg's viewbox
  // This is expensive, so we want to set this property
  // only when we really need to.
  useEffect(() => {
    const svg = rSvg.current!
    // const cvs = rCanvas.current!
    let prev = ``

    return state.onUpdate((s) => {
      const {
        document: { point, size },
      } = s.data
      const next = [point, size].toString()

      if (next !== prev) {
        svg.setAttribute("viewBox", next)
        prev = next
      }
    })
  }, [])

  // Update the viewport on first mount
  useEffect(() => {
    const svg = rSvg.current!
    const rect = svg.getBoundingClientRect()
    state.send("MOUNTED", { size: [rect.width, rect.height] })
    return () => void state.send("UNMOUNTED")
  }, [])

  // Prevent browser zoom and use our own instead
  const { handleTouchStart, handleTouchMove } = usePinchZoom(rContainer)

  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    state.send("WHEELED", {
      ctrlKey: e.ctrlKey,
      delta: [e.deltaX, e.deltaY],
    })
  }, [])

  return (
    <OuterWrapper className="light">
      <ContextMenuRoot>
        <EditorContainer ref={rContainer}>
          <Layout>
            <SVGWrapper
              onPointerDown={() => state.send("POINTED_CANVAS")}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchMove}
              onWheel={handleWheel}
            >
              <svg ref={rSvg} width="100%" height="100%">
                <Globs />
                <Nodes />
                <HoveredNodes />
                <HoveredGlobs />
                <Brush />
              </svg>
              <ContextMenu />
            </SVGWrapper>
            <Toolbar />
            <ContentPanel />
            <InspectPanel />
            <StatusBar />
          </Layout>
        </EditorContainer>
      </ContextMenuRoot>
    </OuterWrapper>
  )
}

const EditorContainer = styled.div`
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 0;
  /* height: 100vh; */

  & > svg {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 1;
    touch-action: none;
  }
`

const Layout = styled.div`
  pointer-events: none;
  display: grid;
  height: 100%;
  grid-template-areas:
    "tool    tool    tool"
    "content main    inspect"
    "status  status  status";
  grid-template-columns: auto 1fr auto;
  grid-template-rows: 40px 1fr 32px;

  @media (max-width: 768px) {
    grid-template-columns: 0px 1fr auto;

    & > *[data-bp-desktop="true"] {
      visibility: hidden;
    }
  }

  & > * {
    pointer-events: all;
    z-index: 2;
  }
`

const Main = styled.main`
  grid-area: main;
`

const OuterWrapper = styled.div`
  height: 100vh;
  width: 100vw;
`

const SVGWrapper = styled(ContextMenuTrigger)`
  position: relative;
  grid-column: 1 / span 3;
  grid-row: 1 / span 3;
  background-color: var(--muted);
`
