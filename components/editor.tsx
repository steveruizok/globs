import React, { useCallback, useEffect, useRef } from "react"
import styled from "styled-components"
import state from "lib/state"
import usePinchZoom from "hooks/usePinchZoom"

import Globs from "./canvas/globs"
import Nodes from "./canvas/nodes"
import HoveredGlobs from "./canvas/hovered-globs"
import HoveredNodes from "./canvas/hovered-nodes"
import ContentPanel from "components/ui/content-panel"
import Toolbar from "components/ui/toolbar"
import StatusBar from "components/ui/statusbar"
import Brush from "components/canvas/brush"

export default function Editor() {
  const rContainer = useRef<HTMLDivElement>(null)
  const rSvg = useRef<SVGSVGElement>(null)
  const rCanvas = useRef<SVGRectElement>(null)

  // When we zoom or pan, manually update the svg's viewbox
  // This is expensive, so we want to set this property
  // only when we really need to.
  useEffect(() => {
    const svg = rSvg.current!
    const cvs = rCanvas.current!
    let prev = ``

    return state.onUpdate((s) => {
      const {
        document: { point, size },
      } = s.data
      const next = [point, size].toString()

      if (next !== prev) {
        cvs.setAttribute("x", point[0].toString())
        cvs.setAttribute("y", point[1].toString())
        cvs.setAttribute("width", size[0].toString())
        cvs.setAttribute("height", size[1].toString())
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
    <EditorContainer
      ref={rContainer}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchMove}
      onWheel={handleWheel}
    >
      <svg ref={rSvg} width="100%" height="100%">
        <rect
          ref={rCanvas}
          x={-2000}
          y={-2000}
          width={4000}
          height={4000}
          fill="#efefef"
          onPointerDown={() => state.send("POINTED_CANVAS")}
        />
        <Globs />
        <Nodes />
        <HoveredNodes />
        <HoveredGlobs />
        <Brush />
      </svg>
      <Layout>
        <Toolbar />
        <ContentPanel />
        <StatusBar />
      </Layout>
    </EditorContainer>
  )
}

const EditorContainer = styled.div`
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;

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
    "content main    main"
    "status  status  status";
  grid-template-columns: 200px auto 1fr;
  grid-template-rows: 40px 1fr 32px;

  @media (max-width: 768px) {
    grid-template-columns: 0px auto 1fr;

    & > *[data-bp-desktop="true"] {
      visibility: hidden;
    }
  }

  & > * {
    pointer-events: all;
    z-index: 2;
  }
`
