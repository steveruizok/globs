import { useSelector } from "lib/state"
import { deepCompare } from "lib/utils"
import HoverGlob from "./hover-glob"

export default function HoveringNodes() {
  const zoom = useSelector((s) => s.data.camera.zoom)
  const highlitGlobs = useSelector(
    ({ data: { highlightGlobs, hoveredGlobs } }) =>
      Array.from(new Set([...highlightGlobs, ...hoveredGlobs]).values()),
    deepCompare
  )

  return (
    <g pointerEvents="none" fill="rgba(255, 0, 0, .12)" stroke="none">
      {highlitGlobs.map((id) => (
        <HoverGlob key={id} id={id} />
      ))}
    </g>
  )
}
