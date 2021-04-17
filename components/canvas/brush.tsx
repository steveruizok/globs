import { useSelector } from "lib/state"
import { deepCompare } from "lib/utils"

export default function Brush() {
  const brush = useSelector((s) => s.data.brush, deepCompare)

  if (!brush) return null

  return (
    <rect
      x={brush.minX}
      y={brush.minY}
      width={brush.width}
      height={brush.height}
      stroke="#1f58ff"
      className="strokewidth-brush"
      fill="rgba(30, 88, 255, .1"
      pointerEvents="none"
    />
  )
}
