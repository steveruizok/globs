import state, { useSelector } from "lib/state"
import { motion } from "framer-motion"
import useBoundingBox from "hooks/useBoundingBox"

export default function Bounds() {
  const bounds = useBoundingBox()
  const zoom = useSelector((s) => s.data.camera.zoom)
  // const showBounds = useSelector(state => state.isInAny("brushSelecting", "notPointing"))

  if (!bounds) {
    restoreCursor()
    return null
  }

  const { x, maxX, y, maxY } = bounds,
    width = Math.abs(maxX - x),
    height = Math.abs(maxY - y)

  const p = 5 / zoom

  return (
    <g>
      <Corner
        x={x}
        y={y}
        width={p}
        height={p}
        cursor="nwse-resize"
        onSelect={(e) => {
          e.stopPropagation()
          state.send("POINTED_BOUNDS_CORNER", { corner: 0 })
          document.body.style.cursor = "nwse-resize"
        }}
      />
      <Corner
        x={maxX}
        y={y}
        width={p}
        height={p}
        cursor="nesw-resize"
        onSelect={(e) => {
          e.stopPropagation()
          state.send("POINTED_BOUNDS_CORNER", { corner: 1 })
          document.body.style.cursor = "nesw-resize"
        }}
      />
      <Corner
        x={maxX}
        y={maxY}
        width={p}
        height={p}
        cursor="nwse-resize"
        onSelect={(e) => {
          e.stopPropagation()
          state.send("POINTED_BOUNDS_CORNER", { corner: 2 })
          document.body.style.cursor = "nwse-resize"
        }}
      />
      <Corner
        x={x}
        y={maxY}
        width={p}
        height={p}
        cursor="nesw-resize"
        onSelect={(e) => {
          e.stopPropagation()
          state.send("POINTED_BOUNDS_CORNER", { corner: 3 })
          document.body.style.cursor = "nesw-resize"
        }}
      />
      <EdgeHorizontal
        x={x + p}
        y={y}
        width={Math.max(0, width - p * 2)}
        height={p}
        onSelect={(e) => {
          e.stopPropagation()
          state.send("POINTED_BOUNDS_EDGE", { edge: 0 })
          document.body.style.cursor = "ns-resize"
        }}
      />
      <EdgeVertical
        x={maxX}
        y={y + p}
        width={p}
        height={Math.max(0, height - p * 2)}
        onSelect={(e) => {
          e.stopPropagation()
          state.send("POINTED_BOUNDS_EDGE", { edge: 1 })
          document.body.style.cursor = "ew-resize"
        }}
      />
      <EdgeHorizontal
        x={x + p}
        y={maxY}
        width={Math.max(0, width - p * 2)}
        height={p}
        onSelect={(e) => {
          e.stopPropagation()
          state.send("POINTED_BOUNDS_EDGE", { edge: 2 })
          document.body.style.cursor = "ns-resize"
        }}
      />
      <EdgeVertical
        x={x}
        y={y + p}
        width={p}
        height={Math.max(0, height - p * 2)}
        onSelect={(e) => {
          e.stopPropagation()
          state.send("POINTED_BOUNDS_EDGE", { edge: 3 })
          document.body.style.cursor = "ew-resize"
        }}
      />
    </g>
  )
}

function Corner({
  x,
  y,
  width,
  height,
  cursor,
  onHover,
  onSelect,
}: {
  x: number
  y: number
  width: number
  height: number
  cursor: string
  onHover?: () => void
  onSelect?: (e: React.PointerEvent) => void
}) {
  return (
    <motion.rect
      x={x - width / 2}
      y={y - height / 2}
      width={width}
      height={height}
      onPointerEnter={onHover}
      onPointerDown={onSelect}
      onPanEnd={restoreCursor}
      style={{ cursor }}
      fill="white"
      stroke="blue"
      className="stroke-s"
    />
  )
}

function EdgeHorizontal({
  x,
  y,
  width,
  height,
  onHover,
  onSelect,
}: {
  x: number
  y: number
  width: number
  height: number
  onHover?: () => void
  onSelect?: (e: React.PointerEvent) => void
}) {
  return (
    <motion.rect
      x={x}
      y={y - height / 2}
      width={width}
      height={height}
      onPointerEnter={onHover}
      onPointerDown={onSelect}
      onPanEnd={restoreCursor}
      style={{ cursor: "ns-resize" }}
      fill="none"
    />
  )
}

function EdgeVertical({
  x,
  y,
  width,
  height,
  onHover,
  onSelect,
}: {
  x: number
  y: number
  width: number
  height: number
  onHover?: () => void
  onSelect?: (e: React.PointerEvent) => void
}) {
  return (
    <motion.rect
      x={x - width / 2}
      y={y}
      width={width}
      height={height}
      onPointerEnter={onHover}
      onPointerDown={onSelect}
      onPanEnd={restoreCursor}
      style={{ cursor: "ew-resize" }}
      fill="none"
    />
  )
}

function setCursorNS() {
  document.body.style.cursor = "ns-resize"
}

function setCursorEW() {
  document.body.style.cursor = "ew-resize"
}

function restoreCursor() {
  document.body.style.cursor = "default"
  state.send("STOPPED_POINTING")
}
