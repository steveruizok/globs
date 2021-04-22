import state, { useSelector } from "lib/state"
import { motion } from "framer-motion"
import { deepCompare } from "lib/utils"

export default function Bounds() {
  const selectedNodes = useSelector((s) => s.data.selectedNodes)
  const selectedGlobs = useSelector((s) => s.data.selectedGlobs)
  const bounds = useSelector((s) => s.values.selectionBounds, deepCompare)
  const zoom = useSelector((s) => s.data.camera.zoom)
  const isBrushing = useSelector((s) => s.isIn("brushSelecting"))

  if (bounds === null) return null
  if (selectedGlobs.length === 0 && selectedNodes.length === 1) return null
  if (selectedGlobs.length === 1 && selectedNodes.length === 0) return null

  const { minX, maxX, minY, maxY, width, height } = bounds

  const p = 4 / zoom
  const cp = p * 2

  return (
    <g pointerEvents={isBrushing ? "none" : "all"}>
      <Corner
        x={minX}
        y={minY}
        corner={0}
        width={cp}
        height={cp}
        cursor="nwse-resize"
      />
      <Corner
        x={maxX}
        y={minY}
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
        x={minX}
        y={maxY}
        corner={3}
        width={cp}
        height={cp}
        cursor="nesw-resize"
      />
      <EdgeHorizontal
        x={minX + p}
        y={minY}
        width={Math.max(0, width - p * 2)}
        height={p}
        onSelect={(e) => {
          e.stopPropagation()
          if (e.buttons !== 1) return
          state.send("POINTED_BOUNDS_EDGE", {
            edge: 0,
            shiftKey: e.shiftKey,
            optionKey: e.altKey,
            metaKey: e.metaKey || e.ctrlKey,
            ctrlKey: e.ctrlKey,
          })
          document.body.style.cursor = "ns-resize"
        }}
      />
      <EdgeVertical
        x={maxX}
        y={minY + p}
        width={p}
        height={Math.max(0, height - p * 2)}
        onSelect={(e) => {
          e.stopPropagation()
          if (e.buttons !== 1) return
          state.send("POINTED_BOUNDS_EDGE", {
            edge: 1,
            shiftKey: e.shiftKey,
            optionKey: e.altKey,
            metaKey: e.metaKey || e.ctrlKey,
            ctrlKey: e.ctrlKey,
          })
          document.body.style.cursor = "ew-resize"
        }}
      />
      <EdgeHorizontal
        x={minX + p}
        y={maxY}
        width={Math.max(0, width - p * 2)}
        height={p}
        onSelect={(e) => {
          e.stopPropagation()
          if (e.buttons !== 1) return
          state.send("POINTED_BOUNDS_EDGE", {
            edge: 2,
            shiftKey: e.shiftKey,
            optionKey: e.altKey,
            metaKey: e.metaKey || e.ctrlKey,
            ctrlKey: e.ctrlKey,
          })
          document.body.style.cursor = "ns-resize"
        }}
      />
      <EdgeVertical
        x={minX}
        y={minY + p}
        width={p}
        height={Math.max(0, height - p * 2)}
        onSelect={(e) => {
          e.stopPropagation()
          if (e.buttons !== 1) return
          state.send("POINTED_BOUNDS_EDGE", {
            edge: 3,
            shiftKey: e.shiftKey,
            optionKey: e.altKey,
            metaKey: e.metaKey || e.ctrlKey,
            ctrlKey: e.ctrlKey,
          })
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
          if (e.buttons !== 1) return
          state.send("POINTED_ROTATE_CORNER", {
            corner,
            shiftKey: e.shiftKey,
            optionKey: e.altKey,
            metaKey: e.metaKey || e.ctrlKey,
            ctrlKey: e.ctrlKey,
          })
          document.body.style.cursor = "grabbing"
        }}
        style={{ cursor: "grab" }}
        fill="transparent"
      />
      <motion.rect
        x={x + width * -0.5}
        y={y + height * -0.5}
        width={width}
        height={height}
        onPointerEnter={onHover}
        onPointerDown={(e) => {
          e.stopPropagation()
          if (e.buttons !== 1) return
          state.send("POINTED_BOUNDS_CORNER", {
            corner,
            shiftKey: e.shiftKey,
            optionKey: e.altKey,
            metaKey: e.metaKey || e.ctrlKey,
            ctrlKey: e.ctrlKey,
          })
          document.body.style.cursor = "nesw-resize"
        }}
        onPanEnd={restoreCursor}
        onTap={restoreCursor}
        style={{ cursor }}
        className="strokewidth-ui stroke-bounds fill-corner"
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
      className="strokewidth-ui"
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
      className="strokewidth-ui"
      fill="none"
    />
  )
}

// function setCursorNS() {
//   document.body.style.cursor = "ns-resize"
// }

// function setCursorEW() {
//   document.body.style.cursor = "ew-resize"
// }

function restoreCursor() {
  document.body.style.cursor = "default"
  state.send("STOPPED_POINTING")
}
