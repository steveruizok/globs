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
import HoveredGlobs from "./canvas/hovers/hovered-globs"
import HoveredNodes from "./canvas/hovers/hovered-nodes"
import InspectPanel from "components/ui/inspect-panel/inspect-panel"
import ContentPanel from "components/ui/content-panel/content-panel"
import Toolbar from "components/ui/toolbar"
import StatusBar from "components/ui/statusbar"
import Brush from "components/canvas/brush"
import Bounds from "components/canvas/bounds/bounds"
import BoundsBg from "components/canvas/bounds/bounds-bg"
import LearnPanel from "components/ui/learn-panel"

const DOT_RADIUS = 2,
  ANCHOR_RADIUS = 4,
  HANDLE_RADIUS = 6,
  TOUCH_SM_RADIUS = 8,
  TOUCH_RADIUS = 12,
  CORNER_SIZE = 5

export default function Editor() {
  const rContainer = useRef<HTMLDivElement>(null)
  const rSvg = useRef<SVGSVGElement>(null)
  const rDot = useRef<SVGCircleElement>(null)
  const rAnchor = useRef<SVGCircleElement>(null)
  const rHandle = useRef<SVGCircleElement>(null)
  const rTouchSmall = useRef<SVGCircleElement>(null)
  const rTouch = useRef<SVGCircleElement>(null)
  const rCorner = useRef<SVGRectElement>(null)
  const rMain = useRef<HTMLDivElement>(null)

  // When we zoom or pan, manually update the svg's viewbox
  // This is expensive, so we want to set this property
  // only when we really need to.
  useEffect(() => {
    const svg = rSvg.current!
    const root = document.documentElement

    let prev = ``
    let prevZoom = 1

    return state.onUpdate((s) => {
      const {
        camera: { zoom },
        document: { point, size },
      } = s.data

      // Update view box when panning or zooming
      const next = [``, point, size].join(`
`)
      if (next !== prev) {
        svg.setAttribute("viewBox", next)
        prev = next
      }

      // Update stroke widths when zooming
      if (prevZoom !== zoom) {
        prevZoom = zoom
        const z = zoom < 1 ? 1 : 1 / zoom
        root.style.setProperty("--zoom", (0.5 / zoom).toString())
        root.style.setProperty("--zoomed", z.toString())
        rDot.current!.setAttribute("r", (DOT_RADIUS * z).toString())
        rAnchor.current!.setAttribute("r", (ANCHOR_RADIUS * z).toString())
        rHandle.current!.setAttribute("r", (HANDLE_RADIUS * z).toString())
        rTouch.current!.setAttribute("r", (TOUCH_RADIUS * z).toString())
        rTouchSmall.current!.setAttribute("r", (TOUCH_SM_RADIUS * z).toString())
        rCorner.current!.setAttribute("width", (CORNER_SIZE * z).toString())
        rCorner.current!.setAttribute("height", (CORNER_SIZE * z).toString())
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
              onPointerDown={(e) => {
                if (e.target.constructor.name !== "SVGSVGElement") return
                state.send("POINTED_CANVAS")
              }}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchMove}
              onWheel={handleWheel}
            >
              <svg ref={rSvg} width="100%" height="100%" strokeLinecap="round">
                <defs>
                  {/* Shape definitions */}
                  <circle id="dot" ref={rDot} cx={0} cy={0} r={DOT_RADIUS} />
                  <circle
                    id="anchor"
                    ref={rAnchor}
                    cx={0}
                    cy={0}
                    r={ANCHOR_RADIUS}
                  />
                  <circle
                    id="handle"
                    ref={rHandle}
                    cx={0}
                    cy={0}
                    r={HANDLE_RADIUS}
                  />
                  <circle
                    id="touch-small"
                    ref={rTouchSmall}
                    cx={0}
                    cy={0}
                    r={TOUCH_SM_RADIUS}
                  />
                  <circle
                    id="touch"
                    ref={rTouch}
                    cx={0}
                    cy={0}
                    r={TOUCH_RADIUS}
                  />
                  <rect
                    id="corner"
                    ref={rCorner}
                    x={0}
                    y={0}
                    width={5}
                    height={5}
                  />
                </defs>
                <BoundsBg />
                <Globs />
                <Nodes />
                <HoveredNodes />
                <HoveredGlobs />
                <Bounds />
                <Brush />
              </svg>
              <ContextMenu />
            </SVGWrapper>
            <Toolbar />
            <ContentPanel />
            <InspectPanel />
            <StatusBar />
            <Main ref={rMain}>
              <LearnPanel bounds={rMain} />
            </Main>
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

  g > *.hover-hidey {
    visibility: hidden;
  }

  g:hover > *.hover-hidey {
    visibility: visible;
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
      display: none;
    }
  }

  & > * {
    pointer-events: all;
    z-index: 2;
  }
`

const Main = styled.main`
  grid-area: main;
  position: relative;
  pointer-events: none;
  margin: 16px;
  width: calc(100% - 32px);
  height: calc(100% - 32px);
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
