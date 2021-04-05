import state, { useSelector } from "lib/state"
import { useEffect, useRef } from "react"
import { useStateDesigner } from "@state-designer/react"
import { Draggable, PositionIndicator } from "./shared"
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
        const { offsetTop: listTop, offsetHeight } = rContainer.current!

        const y = point[1] - HEADER_HEIGHT - listTop - offsetTop + ITEM_HEIGHT

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

        const nextIndex = clamp(Math.floor(y), 0, globIds.length - 1)

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

  // Scroll the selected items into view, starting with the top selected
  useEffect(() => {
    if (selectedGlobIds.length > 0) {
      const section = rContainer.current
      const sorted = selectedGlobIds.sort(
        (a, b) => globIds.indexOf(a) - globIds.indexOf(b)
      )
      const index = globIds.indexOf(sorted[0])
      const y = ITEM_HEIGHT * index
      const minY = section.scrollTop
      const height = section.offsetHeight - ITEM_HEIGHT * 2
      if (y < minY) {
        section.scrollTo(0, y)
      } else if (y > minY + height) {
        section.scrollTo(0, y - height)
      }
    }
  }, [selectedGlobIds, globIds])

  const isDragging = local.isIn("dragging")

  const { nextIndex, draggingIndex, draggingDirection } = local.data

  return (
    <section ref={rContainer}>
      <h2>Globs</h2>
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
