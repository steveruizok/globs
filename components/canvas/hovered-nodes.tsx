import { useSelector } from "lib/state"
import { deepCompare } from "lib/utils"
import HoverNode from "./hover-node"

export default function HoveringNodes() {
  const zoom = useSelector((s) => s.data.camera.zoom)
  const highlitNodes = useSelector(
    ({ data: { highlightNodes, hoveredNodes } }) =>
      Array.from(new Set([...highlightNodes, ...hoveredNodes]).values()),
    deepCompare
  )

  return (
    <g pointerEvents="none" fill="rgba(255, 0, 0, .12)" stroke="none">
      {highlitNodes.map((id) => (
        <HoverNode key={id} id={id} />
      ))}
    </g>
  )
}
