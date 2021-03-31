import state, { useSelector } from "lib/state"
import { motion } from "framer-motion"
import { deepCompare } from "lib/utils"

export default function Bounds() {
  const selectedNodes = useSelector((s) => s.data.selectedNodes)
  const selectedGlobs = useSelector((s) => s.data.selectedGlobs)
  const bounds = useSelector((s) => s.values.selectionBounds, deepCompare)
  const zoom = useSelector((s) => s.data.camera.zoom)

  if (bounds === null) return null
  if (selectedGlobs.length === 0 && selectedNodes.length === 1) return null
  if (selectedGlobs.length === 1 && selectedNodes.length === 0) return null

  const { x, maxX, y, maxY } = bounds,
    width = Math.abs(maxX - x),
    height = Math.abs(maxY - y)

  const p = 4 / zoom
  const cp = p * 2

  return (
    <g>
      <Corner
        x={x}
        y={y}
        corner={0}
        width={cp}
        height={cp}
        cursor="nwse-resize"
      />
      <Corner
        x={maxX}
        y={y}
        corner={1}
        width={cp}
        height={cp}
        cursor="nesw-resize"
      />
      <Corner
        x={maxX}
        y={maxY}
        corner={2}
        width={cp}
        height={cp}
        cursor="nwse-resize"
      />
      <Corner
        x={x}
        y={maxY}
        corner={3}
        width={cp}
        height={cp}
        cursor="nesw-resize"
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
  corner,
}: {
  x: number
  y: number
  width: number
  height: number
  cursor: string
  corner: number
  onHover?: () => void
}) {
  const isTop = corner === 0 || corner === 1
  const isLeft = corner === 0 || corner === 3
  return (
    <g>
      <motion.rect
        x={x + width * (isLeft ? -1.25 : -0.5)} // + width * 2 * transformOffset[0]}
        y={y + width * (isTop ? -1.25 : -0.5)} // + height * 2 * transformOffset[1]}
        width={width * 1.75}
        height={height * 1.75}
        onPanEnd={restoreCursor}
        onTap={restoreCursor}
        onPointerDown={(e) => {
          e.stopPropagation()
          state.send("POINTED_ROTATE_CORNER", { corner })
          document.body.style.cursor = "grabbing"
        }}
        style={{ cursor: "grab" }}
        fill="transparent"
        className="strokewidth-s"
      />
      <motion.rect
        x={x + width * -0.5}
        y={y + height * -0.5}
        width={width}
        height={height}
        onPointerEnter={onHover}
        onPointerDown={(e) => {
          e.stopPropagation()
          state.send("POINTED_BOUNDS_CORNER", { corner })
          document.body.style.cursor = "nesw-resize"
        }}
        onPanEnd={restoreCursor}
        onTap={restoreCursor}
        style={{ cursor }}
        fill="white"
        stroke="#005aff"
        className="strokewidth-ui"
      />
    </g>
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
      onTap={restoreCursor}
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
      onTap={restoreCursor}
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
