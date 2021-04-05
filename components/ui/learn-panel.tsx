import { createState } from "@state-designer/core"
import { useStateDesigner } from "@state-designer/react"
import { motion, animate, useMotionValue, PanInfo } from "framer-motion"
import { RefObject, useEffect, useRef } from "react"
import * as vec from "lib/vec"
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  X,
  Disc,
  ArrowRight,
} from "react-feather"
import styled from "styled-components"

const state = createState({
  data: {
    page: 0,
    pages: [
      {
        title: "Creating Nodes",
        image: "learn/nodes.gif",
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
        image: "learn/globs.gif",
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
        image: "learn/handles.gif",
        description: (
          <p>
            To <b>change</b> a glob, drag its handles. Hold <b>Command</b> to
            move both handles at once.
          </p>
        ),
      },
      {
        title: "Resizing Nodes",
        image: "learn/resizing.gif",
        description: (
          <p>
            To <b>resize</b> a node: hold <b>Command</b> and drag the node.
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
            <img src={page.image} height="auto" width="100%" />
          </div>
          {page.description}
        </Content>
      )}
    </PanelContainer>
  )
}

const PanelContainer = styled(motion.div)`
  position: absolute;
  top: 0;
  left: 0;
  background-color: var(--colors-panel);
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid var(--colors-border);
  pointer-events: all;
  user-select: none;

  button {
    border: none;
  }
`

const IconButton = styled.button`
  height: 40px;
  width: 40px;
  background-color: var(--colors-panel);
  border-radius: 4px;
  border: 1px solid var(--colors-border);
  padding: 0;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  outline: none;
  pointer-events: all;
  cursor: pointer;

  &:hover:not(:disabled) {
    background-color: var(--colors-panel);
  }

  &:disabled {
    opacity: 0.5;
  }

  svg {
    height: 20px;
    width: 20px;
    stroke-width: 2px;
    stroke: var(--colors-text);
  }
`

const Content = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: auto auto 1fr;
  width: 100%;
  max-width: 400px;
  height: 340px;
  padding-bottom: 4px;
  user-select: none;
  pointer-events: all;

  & > div {
    pointer-events: none;
  }

  img {
  }

  p {
    margin: 0;
    padding: 16px;
    font-size: 13px;
  }
`

const Header = styled.div`
  pointer-events: all;
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid var(--colors-border);

  & button {
    grid-column: 1;
    grid-row: 1;
  }

  & h3 {
    grid-column: 1 / span 3;
    grid-row: 1;
    text-align: center;
    margin: 0;
    padding: 0;
    font-size: 16px;
  }
`

const ButtonsGroup = styled.div`
  grid-row: 1;
  grid-column: 3;
  display: flex;
`
