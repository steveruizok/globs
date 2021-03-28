import state, { useSelector } from "lib/state"
import { deepCompare } from "lib/utils"

export default function BoundsBg() {
  const selectedNodes = useSelector((s) => s.data.selectedNodes)
  const selectedGlobs = useSelector((s) => s.data.selectedGlobs)
  const bounds = useSelector((s) => s.values.selectionBounds, deepCompare)

  if (bounds === null) return null
  if (selectedGlobs.length === 0 && selectedNodes.length === 1) return null

  const { x, maxX, y, maxY } = bounds,
    width = Math.abs(maxX - x),
    height = Math.abs(maxY - y)

  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      onPointerDown={() => state.send("POINTED_BOUNDS")}
      fill="transparent"
      stroke="blue"
      className="stroke-s"
    />
  )
}
