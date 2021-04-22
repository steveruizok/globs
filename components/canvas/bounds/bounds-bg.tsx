import state, { useSelector } from "lib/state"
import { deepCompare } from "lib/utils"

export default function BoundsBg() {
  const selectedNodes = useSelector((s) => s.data.selectedNodes)
  const selectedGlobs = useSelector((s) => s.data.selectedGlobs)
  const bounds = useSelector((s) => s.values.selectionBounds, deepCompare)

  if (bounds === null) return null
  if (selectedGlobs.length === 0 && selectedNodes.length === 1) return null
  if (selectedGlobs.length === 1 && selectedNodes.length === 0) return null

  const { minX, minY, width, height } = bounds

  return (
    <rect
      x={minX}
      y={minY}
      width={width}
      height={height}
      onPointerDown={(e) => {
        if (e.buttons !== 1) return
        state.send("POINTED_BOUNDS", {
          shiftKey: e.shiftKey,
          optionKey: e.altKey,
          metaKey: e.metaKey || e.ctrlKey,
          ctrlKey: e.ctrlKey,
        })
      }}
      fill="transparent"
      className="strokewidth-ui stroke-bounds fill-bounds-bg"
    />
  )
}
