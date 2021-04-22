import React, { useCallback, useEffect, useRef } from "react"
import { styled } from "stitches.config"
import state, { useSelector } from "lib/state"
import usePinchZoom from "hooks/usePinchZoom"
import { motion } from "framer-motion"
import inputs from "lib/inputs"

import ContextMenu, {
  ContextMenuRoot,
  ContextMenuTrigger,
} from "./ui/context-menu"

import Canvas from "./canvas/canvas"
import Cursor from "./ui/cursor"
import InspectPanel from "./ui/inspect-panel/inspect-panel"
import ContentPanel from "./ui/content-panel/content-panel"
import Toolbar from "./ui/toolbar/toolbar"
import StatusBar from "./ui/statusbar"
import LearnPanel from "./ui/learn-panel"
import CodePanel from "./ui/code-panel/code-panel"
import ZoomPanel from "./ui/zoom-panel"
import Thumbstick from "./ui/thumbstick"
import { IProject } from "lib/types"

const DOT_RADIUS = 2,
  ANCHOR_RADIUS = 4,
  HANDLE_RADIUS = 6,
  TOUCH_SM_RADIUS = 8,
  TOUCH_RADIUS = 12,
  CORNER_SIZE = 5

interface Props {
  isShareLink?: boolean
  project?: IProject
}

export default function Editor({ isShareLink = false, project }: Props) {
  const rContainer = useRef<HTMLDivElement>(null)
  const rSvg = useRef<SVGSVGElement>(null)
  const rDot = useRef<SVGCircleElement>(null)
  const rAnchor = useRef<SVGCircleElement>(null)
  const rHandle = useRef<SVGCircleElement>(null)
  const rTouchSmall = useRef<SVGCircleElement>(null)
  const rTouch = useRef<SVGCircleElement>(null)
  const rCorner = useRef<SVGRectElement>(null)
  const rSnap = useRef<SVGPathElement>(null)
  const rMain = useRef<HTMLDivElement>(null)

  const isLoading = useSelector((state) => state.isIn("loading"))
  const isFilled = useSelector((state) => state.data.fill)

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
    state.send("MOUNTED", {
      size: [rect.width, rect.height],
      isShareLink,
      project,
    })
    return () => void state.send("UNMOUNTED")
  }, [])

  const handlePointerCancel = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      inputs.handlePointerCancel(
        e.clientX,
        e.clientY,
        e.pointerType,
        e.buttons,
        e.shiftKey,
        e.altKey,
        e.ctrlKey,
        e.metaKey
      )

      state.send("CANCELLED_POINTER", {
        shiftKey: e.shiftKey,
        optionKey: e.altKey,
        ctrlKey: e.ctrlKey,
        metaKey: e.metaKey || e.ctrlKey,
      })
    },
    []
  )

  const handlePointerDown = useCallback((e: PointerEvent) => {
    // pointer.points.add(e.pointerId)
    inputs.handlePointerDown(
      e.clientX,
      e.clientY,
      e.pointerId,
      e.pointerType,
      e.buttons,
      e.shiftKey,
      e.altKey,
      e.ctrlKey,
      e.metaKey
    )

    state.send("STARTED_POINTING", {
      shiftKey: e.shiftKey,
      optionKey: e.altKey,
      ctrlKey: e.ctrlKey,
      metaKey: e.metaKey || e.ctrlKey,
    })
  }, [])

  const handlePointerUp = useCallback((e: PointerEvent) => {
    inputs.handlePointerUp(
      e.clientX,
      e.clientY,
      e.pointerType,
      e.buttons,
      e.shiftKey,
      e.altKey,
      e.ctrlKey,
      e.metaKey
    )

    document.body.style.cursor = "default"

    state.send("STOPPED_POINTING", {
      shiftKey: e.shiftKey,
      optionKey: e.altKey,
      ctrlKey: e.ctrlKey,
      metaKey: e.metaKey || e.ctrlKey,
    })
  }, [])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (state.isIn("draggingThumbstick")) return

    inputs.handlePointerMove(
      e.clientX,
      e.clientY,
      e.pointerId,
      e.pointerType,
      e.buttons,
      e.shiftKey,
      e.altKey,
      e.ctrlKey,
      e.metaKey
    )

    state.send("MOVED_POINTER", {
      isPan: e.buttons === 4,
      shiftKey: e.shiftKey,
      optionKey: e.altKey,
      metaKey: e.metaKey || e.ctrlKey,
      ctrlKey: e.ctrlKey,
    })
  }, [])

  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    state.send("WHEELED", {
      delta: [e.deltaX, e.deltaY],
      shiftKey: e.shiftKey,
      optionKey: e.altKey,
      metaKey: e.metaKey || e.ctrlKey,
      ctrlKey: e.ctrlKey,
    })
  }, [])

  const handleWrapperPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.target.constructor.name !== "SVGSVGElement") return
      state.send("POINTED_CANVAS", {
        shiftKey: e.shiftKey,
        optionKey: e.altKey,
        metaKey: e.metaKey || e.ctrlKey,
        ctrlKey: e.ctrlKey,
      })
    },
    []
  )

  const zoomEvents = usePinchZoom(rContainer)

  return (
    <OuterWrapper
      onTapStart={handlePointerDown}
      onPointerCancel={handlePointerCancel}
      onPointerLeave={handlePointerCancel}
      onPointerMove={handlePointerMove}
      onTap={handlePointerUp}
    >
      <ContextMenuRoot>
        <EditorContainer ref={rContainer}>
          <Layout>
            <SVGWrapper
              quality={isFilled ? "high" : "low"}
              onPointerDown={handleWrapperPointerDown}
              onWheel={handleWheel}
              {...zoomEvents}
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
                {!isLoading && <Canvas />}
              </svg>
              <ContextMenu />
            </SVGWrapper>
            <Toolbar />
            <ContentPanel />
            <InspectPanel />
            <StatusBar />
            <Main ref={rMain}>
              <LearnPanel bounds={rMain} />
              <CodePanel />
              <ZoomPanel />
              <Thumbstick />
            </Main>
          </Layout>
        </EditorContainer>
      </ContextMenuRoot>
      <Cursor />
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

    '& *[data-bp-desktop="true"]': {
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
  },

  "@media (max-width: 480px)": {
    '& *[data-bp-desktop="true"]': {
      display: "none",
    },
  },

  variants: {
    quality: {
      low: {
        "& svg": {
          shapeRendering: "optimizeSpeed",
        },
      },
      high: {
        "& svg": {
          shapeRendering: "geometricPrecision",
        },
      },
    },
  },
})
