import state, { useSelector } from "lib/state"
import NodeListItem from "./node-list-item"
import { motion } from "framer-motion"
import { ReactNode, useRef } from "react"
import { useStateDesigner } from "@state-designer/react"
import { clamp } from "lib/utils"
import GlobListItem from "./glob-list-item"

const HEADER_HEIGHT = 40
const ITEM_HEIGHT = 28

export default function GlobList() {
  const globIds = useSelector((s) => s.data.globIds)
  const selectedGlobIds = useSelector((s) => s.data.selectedGlobs)

  const rContainer = useRef<HTMLDivElement>(null)
  const rList = useRef<HTMLOListElement>(null)

  const local = useStateDesigner({
    data: {
      start: [] as number[],
      draggingId: null as string | null,
      draggingIndex: -1,
      draggingDirection: "up" as "up" | "down",
      nextIndex: -1,
    },
    on: {},
    initial: "idle",
    states: {
      idle: {
        on: {
          STARTED_DRAGGING: {
            do: "setDraggingIndex",
            to: "dragging",
          },
        },
      },
      dragging: {
        onEnter: "addCancelEvent",
        onExit: ["removeCancelEvent", "cleanup"],
        on: {
          CHANGED_POSITION: [
            {
              get: "scrollDirection",
              if: "isScrolling",
              do: "scrollInDirection",
            },
            {
              get: "nextIndex",
              if: "indexChanged",
              do: "setNextIndex",
            },
          ],
          CANCELLED: { to: "idle" },
          STOPPED_DRAGGING: { do: "moveDraggingToNextPosition", to: "idle" },
        },
      },
    },
    results: {
      scrollDirection(data, payload: { point: number[] }) {
        const { point } = payload
        const { offsetTop } = rList.current!
        const { offsetHeight } = rContainer.current!

        const y = point[1] - HEADER_HEIGHT - offsetTop + ITEM_HEIGHT

        const direction =
          y < 24 ? "up" : y > offsetHeight - 24 ? "down" : "none"

        return {
          direction,
          strength:
            direction === "up"
              ? clamp(1 - y / 24, 0, 1)
              : clamp((y - offsetHeight + 24) / 24, 0, 1),
        }
      },
      nextIndex(data, payload: { point: number[] }) {
        const { draggingIndex } = data
        const { point } = payload
        const { offsetTop } = rList.current!
        const { offsetTop: listTop, scrollTop } = rContainer.current!

        const y =
          (point[1] - listTop - offsetTop + scrollTop - HEADER_HEIGHT) /
          ITEM_HEIGHT

        const nextIndex = Math.floor(y)

        const direction = nextIndex < draggingIndex ? "up" : "down"

        return {
          direction,
          nextIndex,
        }
      },
    },
    conditions: {
      indexChanged(data, payload, result: { nextIndex: number }) {
        return result.nextIndex !== data.nextIndex
      },
      isScrolling(
        data,
        payload,
        result: { direction: "up" | "down" | "none" }
      ) {
        return result.direction !== "none"
      },
    },
    actions: {
      addCancelEvent() {
        window.addEventListener("keydown", cancelDrag)
      },
      removeCancelEvent() {
        window.removeEventListener("keydown", cancelDrag)
      },
      scrollInDirection(
        data,
        payload,
        result: { direction: "up" | "down"; strength: number }
      ) {
        const { direction, strength } = result
        rContainer.current.scrollBy(
          0,
          10 * (direction === "up" ? -strength : strength)
        )
      },
      setDraggingIndex(
        data,
        payload: { id: string; point: number[]; index: number }
      ) {
        data.start = payload.point
        data.draggingId = payload.id
        data.draggingIndex = payload.index
        data.nextIndex = payload.index
      },
      setNextIndex(
        data,
        payload,
        result: { nextIndex: number; direction: "up" | "down" }
      ) {
        data.nextIndex = clamp(result.nextIndex, 0, globIds.length)
        data.draggingDirection = result.direction
      },
      moveDraggingToNextPosition(data) {
        const { draggingId, draggingIndex, nextIndex } = data

        state.send("MOVED_GLOB_ORDER", {
          id: draggingId,
          from: draggingIndex,
          to: nextIndex,
          reason: "DROP",
        })
      },
      cleanup(data) {
        data.draggingIndex = -1
        data.nextIndex = -1
      },
    },
  })

  function cancelDrag(e: KeyboardEvent) {
    if (e.key === "Escape") {
      local.send("CANCELLED")
    }
  }

  const isDragging = local.isIn("dragging")

  const { nextIndex, draggingIndex, draggingDirection } = local.data

  return (
    <section ref={rContainer}>
      <h2>Nodes</h2>
      <ol ref={rList}>
        {globIds.map((id, index) => {
          return (
            <Draggable
              key={id}
              isDragging={isDragging && draggingIndex === index}
              onDragStart={(point) =>
                local.send("STARTED_DRAGGING", {
                  id,
                  point,
                  index,
                })
              }
              onDragEnd={() => local.send("STOPPED_DRAGGING", { id, index })}
              onDrag={(point) =>
                local.send("CHANGED_POSITION", { id, index, point })
              }
            >
              <GlobListItem id={id} selected={selectedGlobIds.includes(id)} />
            </Draggable>
          )
        })}
      </ol>
      {isDragging && nextIndex !== draggingIndex && (
        <PositionIndicator
          depth={0}
          nextIndex={nextIndex}
          direction={draggingDirection}
        />
      )}
    </section>
  )
}

function Draggable({
  isDragging,
  onDragStart,
  onDragEnd,
  onDrag,
  children,
}: {
  isDragging: boolean
  onDragStart: (point: number[]) => void
  onDragEnd: () => void
  onDrag: (point: number[]) => void
  children: ReactNode
}) {
  return (
    <motion.li
      layout
      onPanStart={(_, info) => onDragStart([info.point.x, info.point.y])}
      onPanEnd={onDragEnd}
      onPan={(_, info) => isDragging && onDrag([info.point.x, info.point.y])}
      whileTap={{ backgroundColor: "var(--muted)" }}
      style={{ backgroundColor: "transparent" }}
      transition={{
        type: "spring",
        stiffness: 900,
        mass: 0.2,
        damping: 30,
      }}
    >
      {children}
    </motion.li>
  )
}

function PositionIndicator({
  nextIndex,
  direction,
  depth,
}: {
  nextIndex: number
  direction: "up" | "down"
  depth: number
}) {
  return (
    <motion.div
      style={{
        position: "absolute",
        top: (nextIndex + 1) * ITEM_HEIGHT,
        left: depth * 12,
        width: `calc(100% - ${depth * 12}px)`,
        height: ITEM_HEIGHT,
        pointerEvents: "none",
      }}
      animate={direction}
      transition={{ duration: 0 }}
      variants={{
        up: {
          borderTop: "2px solid #000",
        },
        down: {
          borderBottom: "2px solid #000",
        },
      }}
    />
  )
}
