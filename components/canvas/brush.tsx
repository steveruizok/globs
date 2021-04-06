import { useSelector } from "lib/state"
import { deepCompare } from "lib/utils"

export default function Brush() {
  const brush = useSelector((s) => s.data.brush, deepCompare)

  if (!brush) return null

  return (
    <rect
      x={Math.min(brush.start[0], brush.end[0])}
      y={Math.min(brush.start[1], brush.end[1])}
      width={Math.abs(brush.start[0] - brush.end[0])}
      height={Math.abs(brush.start[1] - brush.end[1])}
      stroke="#1f58ff"
      className="strokewidth-s"
      fill="rgba(30, 88, 255, .1"
      pointerEvents="none"
    />
  )
}
