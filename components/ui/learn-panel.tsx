import { createState } from "@state-designer/core"
import { useStateDesigner } from "@state-designer/react"
import { motion, animate, useMotionValue, PanInfo } from "framer-motion"
import { RefObject, useEffect, useRef } from "react"
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  X,
  Disc,
  ArrowRight,
} from "react-feather"
import { styled } from "stitches.config"

const state = createState({
  data: {
    page: 0,
    pages: [
      {
        title: "Creating Nodes",
        image: "learn/intro_nodes.mp4",
        description: (
          <p>
            To <b>create</b> a node: click the{" "}
            <Disc size={14} strokeWidth={3} style={{ marginBottom: -2 }} /> and
            then click on the canvas.
          </p>
        ),
      },
      {
        title: "Creating Globs",
        image: "learn/intro_globs.mp4",
        description: (
          <p>
            To <b>link</b> two nodes with a glob: select a node, click the{" "}
            <ArrowRight
              size={14}
              strokeWidth={3}
              style={{ marginBottom: -2 }}
            />{" "}
            and then click the second node.
          </p>
        ),
      },
      {
        title: "Setting Handles",
        image: "learn/intro_handles.mp4",
        description: (
          <p>
            To <b>change</b> a glob: drag its handles. Hold <b>Command</b> to
            move both handles at once. Hold <b>Shift</b> to move along only one
            axis. Hold <b>Option</b> to turn off auto-snapping.
          </p>
        ),
      },
      {
        title: "Preview",
        image: "learn/intro_preview.mp4",
        description: (
          <p>
            To <b>preview</b> a glob: hold the spacebar.
          </p>
        ),
      },
      {
        title: "Resizing Nodes",
        image: "learn/intro_resizing.mp4",
        description: (
          <p>
            To <b>resize</b> a node: hold <b>Command</b> and drag the node.
          </p>
        ),
      },
      {
        title: "Caps",
        image: "learn/intro_caps.mp4",
        description: (
          <p>
            To change a node&apos;s <b>cap</b>: double click it.
          </p>
        ),
      },
      {
        title: "Anchors",
        image: "learn/intro_anchors.mp4",
        description: (
          <p>
            For <b>fine adjustment</b>: drag a glob&apos;s anchor points.
          </p>
        ),
      },
      {
        title: "Splitting",
        image: "learn/intro_splitting.mp4",
        description: (
          <p>
            To <b>split</b> a glob: hold <b>Command</b>, click on the glob, and
            then click again to split.
          </p>
        ),
      },
      {
        title: "Selecting",
        image: "learn/intro_selecting.mp4",
        description: (
          <p>
            To <b>select</b> things: click on the canvas and draw a box. To{" "}
            <b>move</b>
            the items, click and drag the box. To <b>resize</b> the items: click
            and drag the box&apos;s edges or corners. To <b>rotate</b>: click
            and drag at a point just past the corners.
          </p>
        ),
      },
    ],
  },
  initial: "collapsed",
  states: {
    collapsed: {
      on: { TOGGLED_COLLAPSED: { to: "expanded" } },
    },
    expanded: {
      on: {
        MOVED_FORWARD: { if: "canMoveForward", do: "incrementPage" },
        MOVED_BACKWARD: { if: "canMoveBackward", do: "decrementPage" },
        TOGGLED_COLLAPSED: { to: "collapsed" },
      },
    },
  },
  conditions: {
    canMoveBackward(data) {
      return data.page > 0
    },
    canMoveForward(data) {
      return data.page < data.pages.length - 1
    },
  },
  actions: {
    incrementPage(data) {
      data.page++
    },
    decrementPage(data) {
      data.page--
    },
  },
})

export default function LearnPanel({
  bounds,
}: {
  bounds: RefObject<HTMLDivElement>
}) {
  const rContainer = useRef<HTMLDivElement>(null)
  const local = useStateDesigner(state)
  const mvX = useMotionValue(0)
  const mvY = useMotionValue(0)

  const isCollapsed = local.isIn("collapsed")
  const page = local.data.pages[local.data.page]

  useEffect(() => {
    animate(mvX, 0)
    animate(mvY, 0)
  }, [isCollapsed])

  function handleDragEnd(_: PointerEvent, info: PanInfo) {
    const { velocity } = info
    const wrapper = bounds.current!
    const container = rContainer.current!
    const maxY = wrapper.offsetHeight - container.offsetHeight
    const maxX = wrapper.offsetWidth - container.offsetWidth

    if (velocity.x < -200) {
      animate(mvX, 0)
    } else if (velocity.x > 200) {
      animate(mvX, maxX)
    } else {
      animate(mvX, mvX.get() > maxX / 2 ? maxX : 0)
    }

    if (velocity.y < -200) {
      animate(mvY, 0)
    } else if (velocity.y > 200) {
      animate(mvY, maxY)
    } else {
      animate(mvY, mvY.get() > maxY / 2 ? maxY : 0)
    }
  }

  useEffect(() => {
    const wrapper = bounds.current!
    const container = rContainer.current!
    const maxY = wrapper.offsetHeight - container.offsetHeight

    animate(
      mvY,
      mvY.get() + container.offsetHeight > wrapper.offsetHeight
        ? maxY
        : mvY.get() > maxY / 2
        ? maxY
        : 0
    )
  }, [page])

  return (
    <PanelContainer
      ref={rContainer}
      drag={!isCollapsed}
      dragConstraints={bounds}
      dragElastic={0.025}
      style={{ x: mvX, y: mvY }}
      dragMomentum={false}
      onDragEnd={handleDragEnd}
    >
      {local.isIn("collapsed") ? (
        <IconButton onClick={() => local.send("TOGGLED_COLLAPSED")}>
          <BookOpen />
        </IconButton>
      ) : (
        <Content>
          <Header>
            <IconButton onClick={() => local.send("TOGGLED_COLLAPSED")}>
              <X />
            </IconButton>
            <h3>{page.title}</h3>
            <ButtonsGroup>
              <IconButton
                disabled={!local.can("MOVED_BACKWARD")}
                onClick={() => local.send("MOVED_BACKWARD")}
              >
                <ChevronLeft />
              </IconButton>
              <IconButton
                disabled={!local.can("MOVED_FORWARD")}
                onClick={() => local.send("MOVED_FORWARD")}
              >
                <ChevronRight />
              </IconButton>
            </ButtonsGroup>
          </Header>
          <div>
            <video
              src={page.image}
              height="auto"
              width="100%"
              autoPlay
              muted
              playsInline
              loop
            />
          </div>
          {page.description}
        </Content>
      )}
    </PanelContainer>
  )
}

const PanelContainer = styled(motion.div, {
  position: "absolute",
  top: "0",
  left: "0",
  backgroundColor: "$panel",
  borderRadius: "4px",
  overflow: "hidden",
  border: "1px solid $border",
  pointerEvents: "all",
  userSelect: "none",

  button: {
    border: "none",
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
  gridTemplateRows: "auto minmax(230px, auto) 1fr",
  width: "100%",
  maxWidth: "400px",
  minHeight: "260px",
  paddingBottom: "4px",
  userSelect: "none",
  pointerEvents: "all",

  "& > div": {
    pointerEvents: "none",
  },

  img: {},

  p: {
    margin: "0",
    padding: "16px",
    fontSize: "13px",
  },
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
