import { useSelector } from "lib/state"
import { deepCompare } from "lib/utils"
import Node from "./node"

export default function HoveringNodes() {
  const nodeIds = useSelector((s) => s.data.nodeIds, deepCompare)
  const fill = useSelector((s) => s.data.fill)

  return (
    <g
      fill={fill ? "black" : "rgba(255, 255, 255, .8"}
      stroke={fill ? "transparent" : "black"}
    >
      {nodeIds.map((id) => (
        <Node key={id} id={id} />
      ))}
    </g>
  )
}
