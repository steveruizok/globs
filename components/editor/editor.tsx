import React, { useCallback, useEffect, useRef } from "react"
import { styled } from "stitches.config"
import state, { keys, pointer } from "lib/state"
import usePinchZoom from "hooks/usePinchZoom"
import * as vec from "lib/vec"
import { motion, PanInfo, TapInfo } from "framer-motion"

import ContextMenu, {
  ContextMenuRoot,
  ContextMenuTrigger,
} from "../ui/context-menu"

import Contents from "./contents"
import HoveredGlobs from "./hovers/hovered-globs"
import HoveredNodes from "./hovers/hovered-nodes"
import InspectPanel from "components/ui/inspect-panel/inspect-panel"
import ContentPanel from "components/ui/content-panel/content-panel"
import Toolbar from "components/ui/toolbar"
import StatusBar from "components/ui/statusbar"
import Brush from "./brush"
import Bounds from "./bounds/bounds"
import BoundsBg from "./bounds/bounds-bg"
import LearnPanel from "../ui/learn-panel"
import ZoomPanel from "../ui/zoom-panel"
import Snaps from "./snaps"
import { throttle } from "lib/utils"

const DOT_RADIUS = 2,
  ANCHOR_RADIUS = 4,
  HANDLE_RADIUS = 6,
  TOUCH_SM_RADIUS = 8,
  TOUCH_RADIUS = 12,
  CORNER_SIZE = 5

export default function Editor() {
  const rContainer = useRef<HTMLDivElement>(null)
  const rSvg = useRef<SVGSVGElement>(null)
  const rContent = useRef<SVGGElement>(null)
  const rDot = useRef<SVGCircleElement>(null)
  const rAnchor = useRef<SVGCircleElement>(null)
  const rHandle = useRef<SVGCircleElement>(null)
  const rTouchSmall = useRef<SVGCircleElement>(null)
  const rTouch = useRef<SVGCircleElement>(null)
  const rCorner = useRef<SVGRectElement>(null)
  const rSnap = useRef<SVGPathElement>(null)
  const rMain = useRef<HTMLDivElement>(null)

  // When we zoom or pan, manually update the svg's viewbox
  // This is expensive, so we want to set this property
  // only when we really need to.
  useEffect(() => {
    const svg = rSvg.current!
    const root = document.documentElement

    let prevViewbox = ``
    let prevZoom = 1

    return state.onUpdate((s) => {
      const {
        camera: { zoom },
        document: { point, size },
      } = s.data

      // Viewbox
      const nextViewbox = [``, point, size].join(`
`)
      if (nextViewbox !== prevViewbox) {
        svg.setAttribute("viewBox", nextViewbox)
        prevViewbox = nextViewbox
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
        const dz = z * 3
        rSnap.current!.setAttribute(
          "d",
          `M -${dz},-${dz} L ${dz},${dz} M -${dz},${dz} L ${dz},-${dz}`
        )
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

  const handlePointerCancel = useCallback(() => {
    for (let id in keys) {
      keys[id] = false
    }
  }, [])

  const handlePointerDown = useCallback((e: PointerEvent, info: TapInfo) => {
    pointer.points.add(e.pointerId)

    Object.assign(pointer, {
      id: e.pointerId,
      type: e.pointerType,
      buttons: e.buttons,
      direction: "any",
    })

    const { x, y } = info.point

    pointer.origin = [x, y]
    pointer.point = [x, y]
    pointer.delta = [0, 0]

    state.send("STARTED_POINTING")
  }, [])

  const handlePointerUp = useCallback((e: PointerEvent, info: TapInfo) => {
    pointer.points.delete(e.pointerId)

    if (e.pointerId !== pointer.id) return
    const { x, y } = info.point

    pointer.id = -1
    pointer.buttons = e.buttons
    pointer.delta = vec.sub([x, y], pointer.point)
    pointer.point = [x, y]
    pointer.axis = "any"

    document.body.style.cursor = "default"

    state.send("STOPPED_POINTING")
  }, [])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const { clientX: x, clientY: y } = e
    handleMove(x, y, e.pointerId, e.buttons)
  }, [])

  const handlePan = useCallback((e: PointerEvent, info: PanInfo) => {
    const { x, y } = info.point
    handleMove(x, y, e.pointerId, e.buttons)
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
    <OuterWrapper
      onTapStart={handlePointerDown}
      onPan={handlePan}
      onPointerCancel={handlePointerCancel}
      onPointerLeave={handlePointerCancel}
      onPointerMove={handlePointerMove}
      onTap={handlePointerUp}
    >
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
                  <path
                    ref={rSnap}
                    id="snap"
                    d="M -2,-2 L 2,2 M -2,2 L 2,-2"
                    className="strokewidth-s stroke-selected"
                  />
                </defs>
                <g ref={rContent}>
                  <BoundsBg />
                  <Contents />
                  <Snaps />
                  <HoveredNodes />
                  <HoveredGlobs />
                  <Bounds />
                  <Brush />
                </g>
              </svg>
              <ContextMenu />
            </SVGWrapper>
            <Toolbar />
            <ContentPanel />
            <InspectPanel />
            <StatusBar />
            <Main ref={rMain}>
              <LearnPanel bounds={rMain} />
              <ZoomPanel />
            </Main>
          </Layout>
        </EditorContainer>
      </ContextMenuRoot>
    </OuterWrapper>
  )
}

const EditorContainer = styled("div", {
  position: "fixed",
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  zIndex: 0,
  // height: '100vh',

  "g > *.hover-hidey": {
    visibility: "hidden",
  },

  "g:hover > *.hover-hidey": {
    visibility: "visible",
  },
})

const Layout = styled("div", {
  pointerEvents: "none",
  display: "grid",
  height: "100%",
  gridTemplateAreas: `
    "tool    tool    tool"
    "content main    inspect"
    "status  status  status"`,
  gridTemplateColumns: "auto 1fr auto",
  gridTemplateRows: "40px 1fr 32px",

  "@media (max-width: 768px)": {
    gridTemplateColumns: "0px 1fr auto",

    '& > *[data-bp-desktop="true"]': {
      display: "none",
    },
  },

  "& > *": {
    pointerEvents: "all",
    zIndex: 2,
  },
})

const Main = styled("main", {
  gridArea: "main",
  position: "relative",
  pointerEvents: "none",
  margin: "16px",
  width: "calc(100% - 32px)",
  height: "calc(100% - 32px)",
})

const OuterWrapper = styled(motion.div, {
  height: "100vh",
  width: "100vw",
})

const SVGWrapper = styled(ContextMenuTrigger, {
  position: "relative",
  gridColumn: "1 / span 3",
  gridRow: "1 / span 3",
  backgroundColor: "$canvas",

  "& > svg": {
    position: "absolute",
    top: "0",
    right: "0",
    bottom: "0",
    left: "0",
    zIndex: "1",
    touchAction: "none",
    shapeRendering: "optimizeSpeed",
    textRendering: "optimizeSpeed",
    imageRendering: "optimizeSpeed",
  },
})

const handleMove = throttle(
  (x: number, y: number, pointerId: number, buttons: number) => {
    if (pointer.id > -1 && pointerId !== pointer.id) return

    const ox = Math.abs(x - pointer.origin[0])
    const oy = Math.abs(y - pointer.origin[1])

    pointer.axis = ox > oy ? "x" : "y"
    pointer.buttons = buttons
    pointer.delta = vec.sub([x, y], pointer.point)
    pointer.point = [x, y]
    state.send("MOVED_POINTER")
  },
  16
)
